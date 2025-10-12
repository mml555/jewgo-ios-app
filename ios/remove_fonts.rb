#!/usr/bin/env ruby
require 'xcodeproj'

project_path = 'JewgoAppFinal.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.first
resources_phase = target.resources_build_phase

# Find and remove font files
fonts_to_remove = ['Feather.ttf', 'Ionicons.ttf', 'MaterialCommunityIcons.ttf']

resources_phase.files.each do |file|
  if file.file_ref && fonts_to_remove.include?(file.file_ref.path)
    puts "Removing #{file.file_ref.path} from Copy Bundle Resources"
    resources_phase.remove_file_reference(file.file_ref)
  end
end

project.save
puts "Done! Removed font files from Xcode project."

