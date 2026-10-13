import Cocoa
import Network
import WebKit

// A fixed loopback origin keeps WebKit storage stable across app launches and updates.
final class LocalSite {
    let port: UInt16
    private let root: URL
    private let queue = DispatchQueue(label: "com.baricy.pawnote.site")
    private var listener: NWListener?
    private var connections: [ObjectIdentifier: NWConnection] = [:]

    init(root: URL, port: UInt16) {
        self.root = root.standardizedFileURL.resolvingSymlinksInPath()
        self.port = port
    }

    func start(completion: @escaping (Error?) -> Void) throws {
        let parameters = NWParameters.tcp
        parameters.requiredLocalEndpoint = .hostPort(
            host: .ipv4(.loopback), port: NWEndpoint.Port(rawValue: port)!
        )
        let listener = try NWListener(using: parameters)
        self.listener = listener
        var reported = false
        listener.stateUpdateHandler = { state in
            switch state {
            case .ready:
                guard !reported else { return }
                reported = true
                DispatchQueue.main.async { completion(nil) }
            case .failed(let error):
                guard !reported else { return }
                reported = true
                DispatchQueue.main.async { completion(error) }
            default: break
            }
        }
        listener.newConnectionHandler = { [weak self] connection in
            guard let self = self else { connection.cancel(); return }
            self.connections[ObjectIdentifier(connection)] = connection
            connection.start(queue: self.queue)
            self.receive(connection, buffer: Data())
            self.queue.asyncAfter(deadline: .now() + 15) { [weak self, weak connection] in
                if let connection = connection { self?.finish(connection) }
            }
        }
        listener.start(queue: queue)
    }

    private func finish(_ connection: NWConnection) {
        connections.removeValue(forKey: ObjectIdentifier(connection))
        connection.cancel()
    }

    private func receive(_ connection: NWConnection, buffer: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self] data, _, complete, error in
            guard let self = self else { return }
            var buffer = buffer
            if let data = data { buffer.append(data) }
            if buffer.count > 16384 {
                self.respond(connection, status: "431 Request Header Fields Too Large", body: Data())
            } else if buffer.range(of: Data("\r\n\r\n".utf8)) != nil {
                self.handle(connection, request: String(decoding: buffer, as: UTF8.self))
            } else if complete || error != nil {
                self.finish(connection)
            } else {
                self.receive(connection, buffer: buffer)
            }
        }
    }

    private func handle(_ connection: NWConnection, request: String) {
        let parts = request.components(separatedBy: "\r\n")[0].split(separator: " ")
        guard parts.count == 3, parts[0] == "GET" || parts[0] == "HEAD" else {
            respond(connection, status: "405 Method Not Allowed", body: Data())
            return
        }
        let target = String(parts[1]).components(separatedBy: "?")[0]
        guard target.hasPrefix("/"), let path = target.removingPercentEncoding,
              !path.contains("\0"), !path.split(separator: "/").contains("..") else {
            respond(connection, status: "403 Forbidden", body: Data())
            return
        }
        var file = root.appendingPathComponent(String(path.dropFirst()))
            .standardizedFileURL.resolvingSymlinksInPath()
        guard file.path == root.path || file.path.hasPrefix(root.path + "/") else {
            respond(connection, status: "403 Forbidden", body: Data())
            return
        }
        var isDirectory: ObjCBool = false
        let exists = FileManager.default.fileExists(atPath: file.path, isDirectory: &isDirectory)
        if !exists || isDirectory.boolValue {
            // Only extensionless routes fall back to the Expo Router SPA.
            guard file.pathExtension.isEmpty else {
                respond(connection, status: "404 Not Found", body: Data())
                return
            }
            file = root.appendingPathComponent("index.html")
        }
        guard let body = try? Data(contentsOf: file) else {
            respond(connection, status: "404 Not Found", body: Data())
            return
        }
        let types = [
            "html": "text/html; charset=utf-8", "js": "text/javascript; charset=utf-8",
            "css": "text/css; charset=utf-8", "json": "application/json",
            "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "svg": "image/svg+xml", "webp": "image/webp", "ico": "image/x-icon",
            "ttf": "font/ttf", "otf": "font/otf", "woff": "font/woff",
            "woff2": "font/woff2", "wasm": "application/wasm"
        ]
        respond(connection, status: "200 OK", body: body,
                type: types[file.pathExtension.lowercased()] ?? "application/octet-stream",
                head: parts[0] == "HEAD")
    }

    private func respond(_ connection: NWConnection, status: String, body: Data,
                         type: String = "text/plain", head: Bool = false) {
        var response = Data(("HTTP/1.1 \(status)\r\nContent-Type: \(type)\r\n" +
            "Content-Length: \(body.count)\r\nConnection: close\r\n" +
            "Cache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\n\r\n").utf8)
        if !head { response.append(body) }
        connection.send(content: response, completion: .contentProcessed { [weak self] _ in
            self?.finish(connection)
        })
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate, WKScriptMessageHandlerWithReply {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var site: LocalSite!
    private let smoke = CommandLine.arguments.contains("--smoke-test")
    private var smokeStarted = false
    private var smokeDownloads: [ObjectIdentifier: URL] = [:]
    private var imageSharePicker: NSSharingServicePicker?

    func applicationDidFinishLaunching(_ notification: Notification) {
        guard let resources = Bundle.main.resourceURL else { fail("应用资源缺失。"); return }
        let root = resources.appendingPathComponent("Web")
        guard FileManager.default.fileExists(atPath: root.appendingPathComponent("index.html").path) else {
            fail("页面资源缺失，请重新安装爪记。"); return
        }
        menu()
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "pawnoteImageShare")
        configuration.websiteDataStore = smoke ? .nonPersistent() : .default()
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1180, height: 820),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "爪记"
        window.minSize = NSSize(width: 420, height: 600)
        window.contentView = webView
        window.isReleasedWhenClosed = false
        window.center()
        if !smoke { window.setFrameAutosaveName("PawnoteMainWindow") }
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        site = LocalSite(root: root, port: smoke ? 47832 : 47831)
        do {
            try site.start { [weak self] error in
                guard let self = self else { return }
                if let error = error {
                    self.fail("本机页面服务启动失败。请退出后重试。\n\(error.localizedDescription)")
                } else {
                    self.webView.load(URLRequest(url: self.homeURL))
                }
            }
        } catch { fail(error.localizedDescription) }
        if smoke {
            DispatchQueue.main.asyncAfter(deadline: .now() + 60) { self.fail("Mac smoke test timed out") }
        }
    }

    private var homeURL: URL { URL(string: "http://127.0.0.1:\(site.port)/")! }

    // Only the app's own main frame may ask to share a PNG. No files or remote URLs are accepted.
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        let origin = message.frameInfo.securityOrigin
        guard message.name == "pawnoteImageShare", message.frameInfo.isMainFrame,
              origin.protocol == "http", origin.host == "127.0.0.1", origin.port == Int(site.port),
              let body = message.body as? [String: Any], let png = body["png"] as? String,
              png.utf8.count <= 44000000, let data = Data(base64Encoded: png),
              data.starts(with: [137, 80, 78, 71, 13, 10, 26, 10]),
              let bitmap = NSBitmapImageRep(data: data),
              bitmap.pixelsWide > 0, bitmap.pixelsHigh > 0,
              bitmap.pixelsWide * bitmap.pixelsHigh <= 16000000,
              let image = NSImage(data: data) else {
            replyHandler(nil, "分享图片读取失败，请重新生成。")
            return
        }
        if smoke {
            webView.evaluateJavaScript("window.pawnoteImageShareReady = true; null;")
            replyHandler("ready", nil)
            return
        }
        imageSharePicker = NSSharingServicePicker(items: [image])
        imageSharePicker?.show(relativeTo: NSRect(x: webView.bounds.maxX - 40, y: 40, width: 1, height: 1),
                               of: webView, preferredEdge: .minX)
        replyHandler("opened", nil)
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        window.makeKeyAndOrderFront(nil)
        return true
    }

    @objc private func home() { webView.load(URLRequest(url: homeURL)) }
    @objc private func reload() { webView.reload() }
    @objc private func back() { webView.goBack() }
    @objc private func forward() { webView.goForward() }

    private func menu() {
        let bar = NSMenu()
        func add(_ title: String, items: [(String, Selector?, String)]) {
            let root = NSMenuItem(title: title, action: nil, keyEquivalent: "")
            let submenu = NSMenu(title: title)
            for (label, selector, key) in items {
                if label.isEmpty { submenu.addItem(.separator()); continue }
                let item = NSMenuItem(title: label, action: selector, keyEquivalent: key)
                if [#selector(home), #selector(reload), #selector(back), #selector(forward)].contains(selector) {
                    item.target = self
                }
                submenu.addItem(item)
            }
            root.submenu = submenu
            bar.addItem(root)
        }
        add("爪记", items: [
            ("关于爪记", #selector(NSApplication.orderFrontStandardAboutPanel(_:)), ""),
            ("", nil, ""), ("隐藏爪记", #selector(NSApplication.hide(_:)), "h"),
            ("", nil, ""), ("退出爪记", #selector(NSApplication.terminate(_:)), "q")
        ])
        add("编辑", items: [
            ("撤销", Selector(("undo:")), "z"), ("", nil, ""),
            ("剪切", #selector(NSText.cut(_:)), "x"), ("复制", #selector(NSText.copy(_:)), "c"),
            ("粘贴", #selector(NSText.paste(_:)), "v"), ("全选", #selector(NSText.selectAll(_:)), "a")
        ])
        add("显示", items: [
            ("首页", #selector(home), "1"), ("重新载入", #selector(reload), "r"),
            ("后退", #selector(back), "["), ("前进", #selector(forward), "]")
        ])
        NSApp.mainMenu = bar
    }

    private func fail(_ message: String) {
        if smoke { fputs("FAIL: \(message)\n", stderr); exit(1) }
        let alert = NSAlert()
        alert.messageText = "爪记暂时无法打开"
        alert.informativeText = message
        alert.runModal()
        NSApp.terminate(nil)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { fail(error.localizedDescription) }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard smoke, !smokeStarted else { return }
        smokeStarted = true
        guard let url = Bundle.main.url(forResource: "smoke-test", withExtension: "js"),
              let script = try? String(contentsOf: url) else { fail("Smoke script missing"); return }
        webView.evaluateJavaScript(script + "\n;null;") { _, error in
            if let error = error { self.fail(error.localizedDescription); return }
            webView.callAsyncJavaScript("return await window.pawnoteSmoke();", arguments: [:],
                                       in: nil, in: .page, completionHandler: { result in
                switch result {
                case .success(let value): print("PASS: \(value)"); exit(0)
                case .failure(let error): self.fail("\(error.localizedDescription)\n\((error as NSError).userInfo)")
                }
            })
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.shouldPerformDownload { decisionHandler(.download); return }
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if url.scheme == "http", url.host == "127.0.0.1", url.port == Int(site.port) {
            if navigationAction.targetFrame == nil { webView.load(navigationAction.request); decisionHandler(.cancel) }
            else { decisionHandler(.allow) }
        } else if url.scheme == "blob" || url.absoluteString == "about:blank" {
            decisionHandler(.allow)
        } else {
            if ["https", "http", "mailto"].contains(url.scheme ?? "") { NSWorkspace.shared.open(url) }
            decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        decisionHandler(navigationResponse.canShowMIMEType ? .allow : .download)
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        download.delegate = self
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        download.delegate = self
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                  suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        if smoke {
            let ext = (suggestedFilename as NSString).pathExtension == "png" ? "png" : "json"
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + "." + ext)
            smokeDownloads[ObjectIdentifier(download)] = url
            completionHandler(url)
            return
        }
        let panel = NSSavePanel()
        panel.nameFieldStringValue = (suggestedFilename as NSString).lastPathComponent
        panel.canCreateDirectories = true
        panel.beginSheetModal(for: window) { result in
            completionHandler(result == .OK ? panel.url : nil)
        }
    }

    func downloadDidFinish(_ download: WKDownload) {
        guard smoke, let url = smokeDownloads.removeValue(forKey: ObjectIdentifier(download)) else { return }
        defer { try? FileManager.default.removeItem(at: url) }
        if url.pathExtension == "png" {
            guard let data = try? Data(contentsOf: url),
                  data.starts(with: [137, 80, 78, 71, 13, 10, 26, 10]),
                  let image = NSBitmapImageRep(data: data), image.pixelsWide >= 720, image.pixelsHigh > 0 else {
                fail("Downloaded news PNG is invalid"); return
            }
            webView.evaluateJavaScript("window.pawnotePNGDownloaded = true; null;")
            return
        }
        guard let data = try? Data(contentsOf: url),
              let backup = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let events = backup["events"] as? [[String: Any]], !events.isEmpty else {
            fail("Downloaded backup is invalid"); return
        }
        webView.evaluateJavaScript("window.pawnoteDownloadFinished = true; null;")
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        if (error as NSError).code == NSURLErrorCancelled { return }
        if smoke { fail(error.localizedDescription); return }
        let alert = NSAlert()
        alert.messageText = "文件保存失败"
        alert.informativeText = error.localizedDescription
        alert.beginSheetModal(for: window)
    }

    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.allowsMultipleSelection = parameters.allowsMultipleSelection
        panel.beginSheetModal(for: window) { result in completionHandler(result == .OK ? panel.urls : nil) }
    }

    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        guard origin.host == "127.0.0.1", origin.port == Int(site.port), type == .microphone else {
            decisionHandler(.deny); return
        }
        decisionHandler(.prompt)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.beginSheetModal(for: window) { _ in completionHandler() }
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: "确认")
        alert.addButton(withTitle: "取消")
        alert.beginSheetModal(for: window) { result in completionHandler(result == .alertFirstButtonReturn) }
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String,
                 defaultText: String?, initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        let alert = NSAlert()
        alert.messageText = prompt
        let input = NSTextField(string: defaultText ?? "")
        input.frame = NSRect(x: 0, y: 0, width: 300, height: 24)
        alert.accessoryView = input
        alert.addButton(withTitle: "确认")
        alert.addButton(withTitle: "取消")
        alert.beginSheetModal(for: window) { result in
            completionHandler(result == .alertFirstButtonReturn ? input.stringValue : nil)
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.setActivationPolicy(.regular)
app.delegate = delegate
app.run()
