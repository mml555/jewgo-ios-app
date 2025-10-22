#!/bin/bash

# Script to add main.jsbundle to Xcode project
# This ensures the bundle is included in the app bundle for release builds

BUNDLE_FILE="main.jsbundle"
PROJECT_FILE="ios/JewgoAppFinal.xcodeproj/project.pbxproj"
BUNDLE_PATH="ios/$BUNDLE_FILE"

# Check if bundle file exists
if [ ! -f "$BUNDLE_PATH" ]; then
    echo "❌ Bundle file $BUNDLE_PATH not found!"
    exit 1
fi

echo "✅ Bundle file found: $BUNDLE_PATH"

# Generate unique IDs for the bundle file
BUNDLE_FILE_REF_ID=$(openssl rand -hex 8 | tr '[:lower:]' '[:upper:]')
BUNDLE_BUILD_FILE_ID=$(openssl rand -hex 8 | tr '[:lower:]' '[:upper:]')

echo "Generated IDs:"
echo "  File Reference: $BUNDLE_FILE_REF_ID"
echo "  Build File: $BUNDLE_BUILD_FILE_ID"

# Add file reference to PBXFileReference section
sed -i.bak "/^\/\* End PBXFileReference section \*\//i\\
		$BUNDLE_FILE_REF_ID /* $BUNDLE_FILE */ = {isa = PBXFileReference; lastKnownFileType = text; name = \"$BUNDLE_FILE\"; path = \"$BUNDLE_FILE\"; sourceTree = \"<group>\"; };\\
" "$PROJECT_FILE"

# Add build file to PBXBuildFile section
sed -i.bak "/^\/\* End PBXBuildFile section \*\//i\\
		$BUNDLE_BUILD_FILE_ID /* $BUNDLE_FILE in Resources */ = {isa = PBXBuildFile; fileRef = $BUNDLE_FILE_REF_ID /* $BUNDLE_FILE */; };\\
" "$PROJECT_FILE"

# Add to JewgoAppFinal group
sed -i.bak "/^		13B07FAE1A68108700A75B9A \/\* JewgoAppFinal \*\/ = {/,/^		};/{
    /^		};/i\\
				$BUNDLE_FILE_REF_ID /* $BUNDLE_FILE */,
}" "$PROJECT_FILE"

# Add to Resources build phase
sed -i.bak "/^		825057DA9CF1D942A00C7AEC \/\* Frameworks \*\/ = {/,/^		};/{
    /^		};/i\\
			runOnlyForDeploymentPostprocessing = 0;
		};
		F0A1B2C3D4E5F60718293B02 /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				$BUNDLE_BUILD_FILE_ID /* $BUNDLE_FILE in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
}" "$PROJECT_FILE"

echo "✅ Bundle file added to Xcode project"
echo "📱 You can now build the release version of your app"
