#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
@import GoogleMaps;

@implementation AppDelegate

// Required by RN 0.8x runtime: satisfies the Objective-C selector lookup
- (NSURL *)getBundleURL
{
#if DEBUG
  RCTBundleURLProvider *provider = [RCTBundleURLProvider sharedSettings];

  // Preferred (newer) 1-arg API
  if ([provider respondsToSelector:@selector(jsBundleURLForBundleRoot:)]) {
    return [provider jsBundleURLForBundleRoot:@"index"];
  }

  // Older 2-arg API, call via selector to avoid compile-time error
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  SEL sel = NSSelectorFromString(@"jsBundleURLForBundleRoot:fallbackResource:");
  if ([provider respondsToSelector:sel]) {
    return [provider performSelector:sel withObject:@"index" withObject:nil];
  }
#pragma clang diagnostic pop

  // Last-resort fallback: explicit Metro URL
  return [NSURL URLWithString:@"http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Initialize Google Maps with API key from Info.plist
  NSString *googleMapsApiKey = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"GoogleMapsAPIKey"];
  if (googleMapsApiKey && googleMapsApiKey.length > 0) {
    [GMSServices provideAPIKey:googleMapsApiKey];
    NSLog(@"✅ Google Maps initialized with API key from Info.plist");
  } else {
    NSLog(@"⚠️ GoogleMapsAPIKey not set - maps may not work correctly");
  }
  
  // Configure RN module name
  self.moduleName = @"JewgoAppFinal";
  self.initialProps = @{};

  // RCTAppDelegate handles setup for both New and Legacy Architecture
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Deep linking support
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:app openURL:url options:options];
}

@end

