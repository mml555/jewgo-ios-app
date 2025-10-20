#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

@implementation AppDelegate

// Required by RN 0.8x runtime: satisfies the Objective-C selector lookup
- (NSURL *)getBundleURL
{
#if DEBUG
  // Metro bundler URL for development
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  // Packaged bundle for production
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
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

