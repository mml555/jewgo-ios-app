#!/bin/bash
# Quick reload script for JewgoAppFinal

echo "🔄 Reloading JewgoAppFinal..."
xcrun simctl terminate booted org.reactjs.native.example.JewgoAppFinal 2>/dev/null
sleep 1
xcrun simctl launch booted org.reactjs.native.example.JewgoAppFinal
echo "✅ App reloaded!"

