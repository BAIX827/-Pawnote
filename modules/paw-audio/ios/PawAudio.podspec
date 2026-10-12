Pod::Spec.new do |s|
  s.name = 'PawAudio'
  s.version = '1.0.0'
  s.summary = 'Local pet sound extraction'
  s.description = 'Exports a selected audio segment from a local video.'
  s.license = 'MIT'
  s.author = 'Pawnote'
  s.homepage = 'https://expo.dev'
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
