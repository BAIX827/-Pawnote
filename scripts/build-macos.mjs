import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "darwin") throw new Error("Mac packaging requires macOS and Xcode command-line tools.");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "artifacts/macos");
// Build the signed bundle outside iCloud, which adds attributes codesign rejects.
const nativeOutput = join(homedir(), "Library/Caches/com.baricy.pawnote/build");
const app = join(nativeOutput, "爪记.app");
const contents = join(app, "Contents");
const resources = join(contents, "Resources");
const web = join(output, "web");
const config = JSON.parse(readFileSync(join(root, "app.json"), "utf8")).expo;
const environment = { ...process.env };
delete environment.EXPO_BASE_URL;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, env: environment, stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}).`);
}

mkdirSync(output, { recursive: true });
mkdirSync(nativeOutput, { recursive: true });
if (!process.argv.includes("--skip-web-build")) {
  run(process.execPath, [join(root, "node_modules/expo/bin/cli"), "export", "--platform", "web", "--output-dir", web]);
}
if (!existsSync(join(web, "index.html"))) throw new Error("Web export missing. Run npm run build:mac first.");
rmSync(app, { recursive: true, force: true });
mkdirSync(join(contents, "MacOS"), { recursive: true });
mkdirSync(resources, { recursive: true });
cpSync(web, join(resources, "Web"), { recursive: true });
cpSync(join(root, "macos/smoke-test.js"), join(resources, "smoke-test.js"));

const iconset = join(nativeOutput, "AppIcon.iconset");
rmSync(iconset, { recursive: true, force: true });
mkdirSync(iconset);
const icon = resolve(root, config.icon);
for (const size of [16, 32, 128, 256, 512]) {
  for (const scale of [1, 2]) {
    run("sips", ["-z", String(size * scale), String(size * scale), icon,
      "--out", join(iconset, `icon_${size}x${size}${scale === 2 ? "@2x" : ""}.png`)], { stdio: "ignore" });
  }
}
run("iconutil", ["-c", "icns", iconset, "-o", join(resources, "AppIcon.icns")]);

writeFileSync(join(contents, "Info.plist"), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>爪记</string>
<key>CFBundleDisplayName</key><string>爪记</string>
<key>CFBundleExecutable</key><string>Pawnote</string>
<key>CFBundleIdentifier</key><string>com.baricy.pawnote.mac</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>${config.version}</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleIconFile</key><string>AppIcon</string>
<key>CFBundleDevelopmentRegion</key><string>zh_CN</string>
<key>CFBundleLocalizations</key><array><string>zh-Hans</string><string>en</string></array>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSHighResolutionCapable</key><true/>
<key>NSMicrophoneUsageDescription</key><string>录下宠物的叫声，留住成长中的声音。</string>
<key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict>
</dict></plist>
`);
run("xcrun", ["swiftc", "-swift-version", "5", "-O", "-target", `${process.arch === "arm64" ? "arm64" : "x86_64"}-apple-macosx13.0`,
  "-framework", "Cocoa", "-framework", "WebKit", "-framework", "Network",
  join(root, "macos/Pawnote.swift"), "-o", join(contents, "MacOS/Pawnote")]);
run("xattr", ["-cr", app]);
run("codesign", ["--force", "--sign", "-", app]);
run("codesign", ["--verify", "--strict", app]);
run("ditto", ["-c", "-k", "--keepParent", "--norsrc", app, join(output, "爪记-Mac.zip")]);
console.log(`Built: ${app}`);

if (process.argv.includes("--install")) {
  const applications = join(homedir(), "Applications");
  const destination = join(applications, "爪记.app");
  const staging = join(applications, ".爪记-install.app");
  const running = spawnSync("pgrep", ["-x", "Pawnote"], { encoding: "utf8" });
  if (running.status === 0) throw new Error("请先退出正在运行的爪记，再重新安装。记录会保留。");
  mkdirSync(applications, { recursive: true });
  if (existsSync(destination)) {
    const identifier = spawnSync("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleIdentifier", join(destination, "Contents/Info.plist")], { encoding: "utf8" });
    if (identifier.stdout.trim() !== "com.baricy.pawnote.mac") throw new Error("安装位置已有其他应用，请先检查 ~/Applications/爪记.app。");
  }
  rmSync(staging, { recursive: true, force: true });
  run("ditto", [app, staging]);
  run("xattr", ["-cr", staging]);
  run("codesign", ["--verify", "--strict", staging]);
  rmSync(destination, { recursive: true, force: true });
  renameSync(staging, destination);
  run("/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister", ["-f", destination]);
  console.log(`Installed: ${destination}`);
}
