import ExpoModulesCore
import AVFoundation

public class PawAudioModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PawAudio")
    AsyncFunction("extract") { (input: String, start: Double, duration: Double, promise: Promise) in
      Task {
        var output: URL?
        do {
          guard let url = URL(string: input), url.isFileURL,
                start.isFinite, duration.isFinite, start >= 0, duration >= 0.5, duration <= 60 else {
            throw NSError(domain: "PawAudio", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid video segment"])
          }
          let asset = AVURLAsset(url: url)
          let tracks = try await asset.loadTracks(withMediaType: .audio)
          let total = try await asset.load(.duration).seconds
          guard !tracks.isEmpty, start < total, start + duration <= total + 0.1 else {
            throw NSError(domain: "PawAudio", code: 2, userInfo: [NSLocalizedDescriptionKey: "No audio track or invalid segment"])
          }
          let destination = FileManager.default.temporaryDirectory.appendingPathComponent("paw-sound-\(UUID().uuidString).m4a")
          output = destination
          guard let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetAppleM4A) else {
            throw NSError(domain: "PawAudio", code: 3, userInfo: [NSLocalizedDescriptionKey: "Unsupported video"])
          }
          exporter.outputURL = destination
          exporter.outputFileType = .m4a
          exporter.timeRange = CMTimeRange(start: CMTime(seconds: start, preferredTimescale: 600), duration: CMTime(seconds: min(duration, total - start), preferredTimescale: 600))
          await exporter.export()
          guard exporter.status == .completed else {
            throw exporter.error ?? NSError(domain: "PawAudio", code: 4, userInfo: [NSLocalizedDescriptionKey: "Export failed"])
          }
          promise.resolve(destination.absoluteString)
        } catch {
          if let output { try? FileManager.default.removeItem(at: output) }
          promise.reject("E_AUDIO_EXTRACT", error.localizedDescription)
        }
      }
    }
  }
}
