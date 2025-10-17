#!/usr/bin/env ruby
# Script to remove font file references from Xcode project

require 'xcodeproj'

project_path = './JewgoAppFinal.xcodeproj'
project = Xcodeproj::Project.open(project_path)

fonts_to_remove = ['Feather.ttf', 'Ionicons.ttf', 'MaterialCommunityIcons.ttf', 'MaterialIcons.ttf']

project.targets.each do |target|
  puts "Cleaning target: #{target.name}"
  
  # Remove from resources build phase
  target.resources_build_phase.files.each do |file|
    if file.file_ref && fonts_to_remove.include?(file.file_ref.path)
      puts "  Removing: #{file.file_ref.path}"
      file.remove_from_project
    end
  end
end

# Remove file references
project.files.each do |file|
  if fonts_to_remove.include?(file.path)
    puts "Removing file reference: #{file.path}"
    file.remove_from_project
  end
end

project.save

puts "✅ Font references removed successfully!"

