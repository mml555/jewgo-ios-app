#!/usr/bin/env bash
# iOS build sanity checks - prevents regressions
set -euo pipefail

echo "🔍 Checking iOS build configuration..."

# 1. No rsync shim
test ! -f ios/rsync || { echo "❌ ios/rsync must not exist"; exit 1; }
echo "✅ No rsync shim"

# 2. Disallow wildcards and brew includes that break libc++ (but not in Podfile where we REMOVE them)
if grep -rn 'Headers/Public/\*\*\|Headers/Private/\*\*' ios 2>/dev/null | grep -v "\.log\|build/\|Pods/\|Podfile" | grep .; then
  echo "❌ Found poisonous wildcard header paths in iOS project"
  exit 1
fi
echo "✅ No wildcard paths"

# 3. Ensure C++17 across RN pods (check Podfile)
grep -q 'gnu++17' ios/Podfile || {
  echo "❌ C++17 not enforced in Podfile"
  exit 1
}
echo "✅ C++17 enforced in Podfile"

# 4. Verify glog config will be generated
grep -q 'ios-configure-glog.sh' ios/Podfile || {
  echo "❌ glog config generation missing from Podfile"
  exit 1
}
echo "✅ glog config generation present"

# 5. Verify rsync guard
grep -q 'rsync shim' ios/Podfile || {
  echo "❌ rsync guard missing from Podfile"
  exit 1
}
echo "✅ rsync guard present"

echo ""
echo "✅ iOS build settings look sane!"
echo "Ready to build with: npx react-native run-ios"

