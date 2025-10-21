#!/usr/bin/env ruby
require 'xcodeproj'

project_path = File.join(__dir__, 'JewgoAppFinal.xcodeproj')
project = Xcodeproj::Project.open(project_path)

target = project.targets.find { |t| t.name == 'JewgoAppFinal' }
raise 'Target JewgoAppFinal not found' unless target

# Find or create the JewgoAppFinal group
group = project.main_group.groups.find { |g| g.display_name == 'JewgoAppFinal' }
group ||= project.main_group.new_group('JewgoAppFinal', 'JewgoAppFinal')

# Files we want to add
files_to_add = [
  { path: 'JewgoAppFinal/AppDelegate.h', type: :header },
  { path: 'JewgoAppFinal/AppDelegate.m', type: :source },
  { path: 'JewgoAppFinal/main.m', type: :source }
]

files_to_add.each do |file_info|
  # Check if file reference already exists
  existing_ref = project.files.find { |fr| fr.path&.end_with?(file_info[:path]) }
  
  unless existing_ref
    # Create new file reference
    file_ref = group.new_file(file_info[:path])
    puts "✅ Added file reference: #{file_info[:path]}"
    
    # Add to compile sources if it's a source file
    if file_info[:type] == :source
      target.add_file_references([file_ref])
      puts "✅ Added to compile sources: #{file_info[:path]}"
    end
  else
    puts "ℹ️  File reference already exists: #{file_info[:path]}"
    
    # Ensure it's in compile sources if it's a source file
    if file_info[:type] == :source
      unless target.source_build_phase.files_references.include?(existing_ref)
        target.add_file_references([existing_ref])
        puts "✅ Added to compile sources: #{file_info[:path]}"
      end
    end
  end
end

# Remove Swift AppDelegate reference if it exists
swift_refs = project.files.select { |fr| fr.path&.include?('AppDelegate.swift') }
swift_refs.each do |swift_ref|
  # Remove from compile sources
  build_file = target.source_build_phase.files.find { |bf| bf.file_ref == swift_ref }
  if build_file
    build_file.remove_from_project
    puts "✅ Removed AppDelegate.swift from compile sources"
  end
  
  # Remove file reference
  swift_ref.remove_from_project
  puts "✅ Removed AppDelegate.swift file reference"
end

project.save
puts "\n🎉 SUCCESS! AppDelegate wired as Objective-C."
puts "Next: Clean Build Folder and Run in Xcode, or use 'npx react-native run-ios'"

