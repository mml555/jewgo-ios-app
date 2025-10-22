#!/usr/bin/env bash

set -euo pipefail

# Fast iOS Pods/Xcode configuration validation for React Native projects
# Checks:
#  - Workspace and Pods presence
#  - Pod xcconfig integrity and suspicious flags
#  - Project xcconfig overrides that drop $(inherited)
#  - Header symlink structure
#  - Podfile.lock -> Pods/ presence consistency
#  - Optional: quick per-scheme build to isolate failing pods

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$REPO_ROOT/ios"
WORKSPACE="$IOS_DIR/JewgoAppFinal.xcworkspace"
XCODEPROJ="$IOS_DIR/JewgoAppFinal.xcodeproj"
PODS_DIR="$IOS_DIR/Pods"
PODFILE_LOCK="$IOS_DIR/Podfile.lock"

DESTINATION_DEFAULT="generic/platform=iOS Simulator"

BLUE="\033[1;34m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
NC="\033[0m"

errors=0
warns=0

say() { echo -e "$1"; }
info() { say "${BLUE}▶${NC} $1"; }
ok()   { say "${GREEN}✓${NC} $1"; }
warn() { say "${YELLOW}!${NC} $1"; warns=$((warns+1)); }
fail() { say "${RED}✗${NC} $1"; errors=$((errors+1)); }

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --build-scheme <SCHEME>   Attempt a quick build of a given scheme (e.g., RCT-Folly)
  --destination <DEST>      xcodebuild destination (default: "$DESTINATION_DEFAULT")
  --list-schemes            List workspace schemes
  --preset <mode>           Quick preset of schemes: classic | fabric
  -q, --quiet               Minimal output
  -v, --verbose             Verbose output; show full xcodebuild logs
  --no-fail-fast            Do not fail the script when a scheme build fails
  -h, --help                Show this help

By default, runs static validations only (no build).
EOF
}

QUIET=0
VERBOSE=0
FAIL_FAST=1
SCHEME=""
SCHEMES=()
DESTINATION="$DESTINATION_DEFAULT"
LIST_ONLY=0
PRESET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-scheme)
      if [[ -n "${2:-}" ]]; then SCHEMES+=("$2"); shift 2; else warn "--build-scheme requires a value"; shift; fi ;;
    --destination)
      DESTINATION="${2:-}"; shift 2 ;;
    --list-schemes)
      LIST_ONLY=1; shift ;;
    --preset)
      PRESET="${2:-}"; shift 2 ;;
    -q|--quiet)
      QUIET=1; shift ;;
    -v|--verbose)
      VERBOSE=1; QUIET=0; shift ;;
    --no-fail-fast)
      FAIL_FAST=0; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      warn "Unknown arg: $1"; shift ;;
  esac
done

section() {
  if [[ $QUIET -eq 0 ]]; then
    echo ""
    say "${BLUE}===${NC} $1"
  fi
}

list_schemes() {
  if [[ ! -d "$WORKSPACE" ]]; then
    fail "Workspace not found: $WORKSPACE"
    return 1
  fi
  info "Listing schemes in workspace..."
  xcodebuild -workspace "$WORKSPACE" -list 2>/dev/null || xcodebuild -workspace "$WORKSPACE" -list -json || true
}

preflight() {
  section "Preflight"
  if command -v xcodebuild >/dev/null 2>&1; then
    ok "xcodebuild found ($(xcodebuild -version | head -n1))"
  else
    warn "xcodebuild not found in PATH"
  fi
  if command -v pod >/dev/null 2>&1; then
    ok "CocoaPods found (pod $(pod --version))"
  else
    warn "CocoaPods (pod) not found in PATH"
  fi
}

check_workspace_and_pods() {
  section "Workspace & Pods presence"
  if [[ -d "$WORKSPACE" ]]; then
    ok "Workspace present: $WORKSPACE"
  else
    fail "Workspace missing: $WORKSPACE (open the .xcworkspace, not .xcodeproj)"
  fi
  if [[ -d "$XCODEPROJ" ]]; then
    ok "Xcode project present: $XCODEPROJ"
  fi
  if [[ -d "$PODS_DIR" ]]; then
    ok "Pods directory present: $PODS_DIR"
  else
    fail "Pods directory missing. Run: (cd ios && pod install)"
  fi
  if [[ -f "$PODFILE_LOCK" ]]; then
    ok "Podfile.lock present"
  else
    fail "Podfile.lock missing. Run: (cd ios && pod install)"
  fi
}

scan_xcconfig_flags() {
  section "Scan xcconfig flags (Pods + project)"
  local findings=0
  local targets=(
    "$IOS_DIR/Pods/Target Support Files"
    "$IOS_DIR/Config"
  )
  local files=()
  for t in "${targets[@]}"; do
    if [[ -d "$t" ]]; then
      while IFS= read -r -d $'\0' f; do files+=("$f"); done < <(find "$t" -type f -name "*.xcconfig" -print0)
    fi
  done

  if [[ ${#files[@]} -eq 0 ]]; then
    warn "No .xcconfig files found under Target Support Files or ios/Config"
    return
  fi

  info "Scanning ${#files[@]} .xcconfig files"

  # Aggregate scanning with awk to avoid grep crashes on macOS
  # 1) Detect -fmodule-map-file usage
  awk 'BEGIN{OFS=":"} /-fmodule-map-file/ {print FILENAME, FNR, $0}' "${files[@]}" || true | while IFS= read -r line; do
    findings=$((findings+1)); warn "-fmodule-map-file present (verify correctness): $line"; done

  # 2) Detect PODS_BUILD_DIR in OTHER_* flags
  awk 'BEGIN{OFS=":"} {
    if ($0 ~ /OTHER_CFLAGS/ && $0 ~ /PODS_BUILD_DIR/) { print FILENAME, FNR, $0 }
    else if ($0 ~ /OTHER_CPLUSPLUSFLAGS/ && $0 ~ /PODS_BUILD_DIR/) { print FILENAME, FNR, $0 }
    else if ($0 ~ /OTHER_SWIFT_FLAGS/ && $0 ~ /PODS_BUILD_DIR/) { print FILENAME, FNR, $0 }
  }' "${files[@]}" || true | while IFS= read -r line; do
    findings=$((findings+1)); fail "PODS_BUILD_DIR referenced in OTHER_*: $line"; done

  # 3) HEADER_SEARCH_PATHS or FRAMEWORK_SEARCH_PATHS missing $(inherited)
  awk 'BEGIN{OFS=":"}
    /^[[:space:]]*(HEADER_SEARCH_PATHS|FRAMEWORK_SEARCH_PATHS)[[:space:]]*=/ {
      if ($0 !~ /\(inherited\)/) { print FILENAME, FNR, $0 }
    }' "${files[@]}" || true | while IFS= read -r line; do
      findings=$((findings+1)); fail "Missing $(inherited) in: $line"; done

  # 4) OTHER_LDFLAGS missing $(inherited)
  awk 'BEGIN{OFS=":"}
    /^[[:space:]]*OTHER_LDFLAGS[[:space:]]*=/ {
      if ($0 !~ /\(inherited\)/) { print FILENAME, FNR, $0 }
    }' "${files[@]}" || true | while IFS= read -r line; do
      findings=$((findings+1)); fail "Missing $(inherited) in OTHER_LDFLAGS: $line"; done

  if [[ $findings -eq 0 ]]; then
    ok "No suspicious xcconfig flags detected"
  fi
}

check_headers_symlinks() {
  section "Pod headers symlink structure"
  local headers_root="$PODS_DIR/Headers"
  if [[ -d "$headers_root" ]]; then
    ok "Headers directory exists: $headers_root"
    local public="$headers_root/Public"
    local private="$headers_root/Private"
    if [[ -d "$public" ]]; then
      ok "Public headers present"
    else
      warn "Public headers directory not found (may be fine with modular frameworks)"
    fi
    if [[ -d "$private" ]]; then
      ok "Private headers present"
    fi
  else
    warn "Pods/Headers directory not found; modern CocoaPods may not create this for some setups"
  fi
}

validate_podfile_vs_pods() {
  section "Podfile.lock vs Pods/ presence"
  if [[ ! -f "$PODFILE_LOCK" ]]; then
    warn "Skipping: Podfile.lock not found"
    return
  fi

  # Extract top-level pod names under PODS:
  # Lines start with two spaces and a dash: "  - PodName (x.y.z)"
  local pods=()
  while IFS= read -r base; do
    [[ -n "$base" ]] && pods+=("$base")
  done < <(
    awk 'BEGIN{inpods=0} /^PODS:/{inpods=1;next} /^DEPENDENCIES:/{inpods=0} inpods && $0 ~ /^  - / { sub(/^  - /, ""); print }' "$PODFILE_LOCK" \
      | sed -E 's/ \(.*$//' \
      | sed -E 's|/.*$||' \
      | sort -u
  )

  if [[ ${#pods[@]} -eq 0 ]]; then
    warn "No pods parsed from Podfile.lock (unexpected format?)"
    return
  fi

  info "Found ${#pods[@]} pods in Podfile.lock"
  local missing=0
  for p in "${pods[@]}"; do
    local installed=0

    # 1) Top-level directory or files matching pod name
    if compgen -G "$PODS_DIR/$p*" > /dev/null; then
      installed=1
    fi

    # 2) Target Support Files directory named after pod
    if [[ $installed -eq 0 && -d "$PODS_DIR/Target Support Files/$p" ]]; then
      installed=1
    fi

    # 3) Local Podspec present (for path-based pods)
    if [[ $installed -eq 0 ]] && compgen -G "$PODS_DIR/Local Podspecs/$p*.json" > /dev/null; then
      installed=1
    fi

    if [[ $installed -eq 1 ]]; then
      ok "Pod registered: $p"
    else
      missing=$((missing+1))
      fail "Pod appears in Podfile.lock but not resolved in Pods project: $p"
    fi
  done

  if [[ $missing -eq 0 ]]; then
    ok "All pods from Podfile.lock are present under Pods/"
  fi
}

quick_build_scheme() {
  local scheme="$1"
  section "Quick build: $scheme"
  if [[ -z "$scheme" ]]; then
    fail "No scheme specified"
    return 1
  fi
  if [[ ! -d "$WORKSPACE" ]]; then
    fail "Workspace missing: $WORKSPACE"
    return 1
  fi
  info "Destination: $DESTINATION"
  local rc=0
  local xc_quiet_flag=""
  if [[ $QUIET -eq 1 ]]; then xc_quiet_flag="-quiet"; fi
  if [[ $VERBOSE -eq 0 ]] && command -v xcpretty >/dev/null 2>&1; then
    set +e
    xcodebuild -workspace "$WORKSPACE" \
               -scheme "$scheme" \
               -configuration Debug \
               -destination "$DESTINATION" \
               $xc_quiet_flag \
               build | xcpretty
    rc=${PIPESTATUS[0]}
    set -e
  else
    set +e
    xcodebuild -workspace "$WORKSPACE" \
               -scheme "$scheme" \
               -configuration Debug \
               -destination "$DESTINATION" \
               $xc_quiet_flag \
               build
    rc=$?
    set -e
  fi
  if [[ $rc -eq 0 ]]; then
    ok "Scheme '$scheme' built successfully"
  else
    if [[ $FAIL_FAST -eq 1 ]]; then
      fail "Scheme '$scheme' build failed (see logs above)"
      exit 1
    else
      warn "Scheme '$scheme' build failed (non-fatal due to --no-fail-fast)"
    fi
  fi
  return $rc
}

quick_build_schemes() {
  local any_fail=0
  for scheme in "${SCHEMES[@]}"; do
    if ! quick_build_scheme "$scheme"; then
      any_fail=1
    fi
  done
  return $any_fail
}

main() {
  if [[ $LIST_ONLY -eq 1 ]]; then
    list_schemes; exit 0
  fi

  # Preset scheme batches for convenience
  if [[ -n "$PRESET" ]]; then
    case "$PRESET" in
      classic)
        SCHEMES+=(
          "React" "React-Core" "React-CoreModules" "React-jsi" "React-jsiexecutor" "ReactCommon" "Yoga"
          "react-native-safe-area-context" "RNScreens" "RNSVG" "RNVectorIcons"
        )
        ;;
      fabric)
        SCHEMES+=(
          "React-Fabric" "React-RCTFabric" "React-graphics" "React-ImageManager" "React-Mapbuffer" "React-FabricComponents" "React-FabricImage"
        )
        ;;
      *)
        warn "Unknown preset: $PRESET" ;;
    esac
  fi

  preflight
  check_workspace_and_pods
  scan_xcconfig_flags
  check_headers_symlinks
  validate_podfile_vs_pods

  if [[ ${#SCHEMES[@]} -gt 0 ]]; then
    quick_build_schemes || true
  fi

  echo ""
  if [[ $errors -eq 0 ]]; then
    ok "Validation completed with $warns warning(s), no errors"
    exit 0
  else
    fail "Validation completed with $errors error(s) and $warns warning(s)"
    exit 1
  fi
}

main "$@"


