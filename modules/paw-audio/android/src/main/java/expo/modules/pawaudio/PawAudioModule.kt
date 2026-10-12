package expo.modules.pawaudio

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMuxer
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.nio.ByteBuffer
import java.util.UUID

class PawAudioModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PawAudio")
    AsyncFunction("extract") { input: String, start: Double, duration: Double ->
      require(start.isFinite() && duration.isFinite() && start >= 0 && duration >= 0.5 && duration <= 60)
      val context = appContext.reactContext ?: error("Missing context")
      val output = File(context.cacheDir, "paw-sound-${UUID.randomUUID()}.m4a")
      val extractor = MediaExtractor()
      var muxer: MediaMuxer? = null
      try {
        val uri = Uri.parse(input)
        require(uri.scheme == "file" || uri.scheme == "content")
        extractor.setDataSource(context, uri, null)
        val track = (0 until extractor.trackCount).firstOrNull {
          extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)?.startsWith("audio/") == true
        } ?: error("No audio track")
        val format = extractor.getTrackFormat(track)
        require(format.getString(MediaFormat.KEY_MIME) == "audio/mp4a-latm") { "Please choose a video with AAC audio" }
        val startUs = (start * 1000000).toLong()
        val endUs = ((start + duration) * 1000000).toLong()
        if (format.containsKey(MediaFormat.KEY_DURATION)) {
          val total = format.getLong(MediaFormat.KEY_DURATION)
          require(startUs < total && endUs <= total + 100000) { "Invalid segment" }
        }
        extractor.selectTrack(track)
        extractor.seekTo(startUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)
        val writer = MediaMuxer(output.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
        muxer = writer
        val target = writer.addTrack(format)
        writer.start()
        val buffer = ByteBuffer.allocate(1024 * 1024)
        val info = MediaCodec.BufferInfo()
        var origin = -1L
        var count = 0
        while (extractor.sampleTime >= 0 && extractor.sampleTime < endUs) {
          val time = extractor.sampleTime
          if (time >= startUs) {
            buffer.clear()
            val size = extractor.readSampleData(buffer, 0)
            if (size < 0) break
            if (origin < 0) origin = time
            info.set(0, size, time - origin, 0)
            writer.writeSampleData(target, buffer, info)
            count++
          }
          if (!extractor.advance()) break
        }
        require(count > 0) { "Empty audio segment" }
        writer.stop()
        require(output.length() <= 2 * 1024 * 1024) { "Audio segment too large" }
        Uri.fromFile(output).toString()
      } catch (error: Throwable) {
        output.delete()
        throw error
      } finally {
        extractor.release()
        muxer?.release()
      }
    }
  }
}
