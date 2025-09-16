/**
 * Device Test Matrix for iOS Compatibility Testing
 * Defines test configurations for various iPhone models and iOS versions
 */

export interface DeviceConfiguration {
  deviceId: string;
  model: string;
  screenSize: string;
  resolution: string;
  iosVersion: string;
  supportedFeatures: string[];
  testPriority: 'high' | 'medium' | 'low';
  notes: string;
}

export interface TestConfiguration {
  device: DeviceConfiguration;
  accessibilitySettings: AccessibilityTestSettings;
  testScenarios: string[];
}

export interface AccessibilityTestSettings {
  voiceOver: boolean;
  dynamicType: 'default' | 'large' | 'extraLarge' | 'accessibility1' | 'accessibility2' | 'accessibility3';
  highContrast: boolean;
  reduceMotion: boolean;
  buttonShapes: boolean;
  boldText: boolean;
  increaseContrast: boolean;
}

export class DeviceTestMatrix {
  private static readonly DEVICE_CONFIGURATIONS: DeviceConfiguration[] = [
    {
      deviceId: 'iphone-16',
      model: 'iPhone 16',
      screenSize: '6.1"',
      resolution: '1179x2556',
      iosVersion: '17.0+',
      supportedFeatures: ['Dynamic Island', 'Face ID', 'Haptic Feedback', 'Voice Control'],
      testPriority: 'high',
      notes: 'Primary test device - latest model with all features'
    },
    {
      deviceId: 'iphone-16-pro-max',
      model: 'iPhone 16 Pro Max',
      screenSize: '6.9"',
      resolution: '1320x2868',
      iosVersion: '17.0+',
      supportedFeatures: ['Dynamic Island', 'Face ID', 'Haptic Feedback', 'Voice Control', 'ProMotion'],
      testPriority: 'high',
      notes: 'Largest screen - test layout scaling and touch targets'
    },
    {
      deviceId: 'iphone-15',
      model: 'iPhone 15',
      screenSize: '6.1"',
      resolution: '1179x2556',
      iosVersion: '17.0+',
      supportedFeatures: ['Dynamic Island', 'Face ID', 'Haptic Feedback', 'Voice Control'],
      testPriority: 'medium',
      notes: 'Previous generation - ensure backward compatibility'
    },
    {
      deviceId: 'iphone-14-pro-max',
      model: 'iPhone 14 Pro Max',
      screenSize: '6.7"',
      resolution: '1290x2796',
      iosVersion: '16.0+',
      supportedFeatures: ['Dynamic Island', 'Face ID', 'Haptic Feedback', 'Voice Control', 'ProMotion'],
      testPriority: 'medium',
      notes: 'Large screen with Dynamic Island - test UI adaptation'
    },
    {
      deviceId: 'iphone-13-mini',
      model: 'iPhone 13 mini',
      screenSize: '5.4"',
      resolution: '1080x2340',
      iosVersion: '15.0+',
      supportedFeatures: ['Face ID', 'Haptic Feedback', 'Voice Control'],
      testPriority: 'high',
      notes: 'Smallest modern screen - critical for touch target testing'
    },
    {
      deviceId: 'iphone-se-3rd',
      model: 'iPhone SE (3rd generation)',
      screenSize: '4.7"',
      resolution: '750x1334',
      iosVersion: '15.0+',
      supportedFeatures: ['Touch ID', 'Haptic Feedback', 'Voice Control'],
      testPriority: 'medium',
      notes: 'Compact form factor with home button - test layout constraints'
    },
    {
      deviceId: 'iphone-12',
      model: 'iPhone 12',
      screenSize: '6.1"',
      resolution: '1170x2532',
      iosVersion: '14.0+',
      supportedFeatures: ['Face ID', 'Haptic Feedback', 'Voice Control'],
      testPriority: 'low',
      notes: 'Older generation - minimum compatibility testing'
    }
  ];

  private static readonly ACCESSIBILITY_CONFIGURATIONS: AccessibilityTestSettings[] = [
    {
      voiceOver: false,
      dynamicType: 'default',
      highContrast: false,
      reduceMotion: false,
      buttonShapes: false,
      boldText: false,
      increaseContrast: false
    },
    {
      voiceOver: true,
      dynamicType: 'default',
      highContrast: false,
      reduceMotion: false,
      buttonShapes: true,
      boldText: false,
      increaseContrast: false
    },
    {
      voiceOver: false,
      dynamicType: 'accessibility3',
      highContrast: true,
      reduceMotion: true,
      buttonShapes: true,
      boldText: true,
      increaseContrast: true
    },
    {
      voiceOver: true,
      dynamicType: 'accessibility2',
      highContrast: true,
      reduceMotion: true,
      buttonShapes: true,
      boldText: true,
      increaseContrast: true
    }
  ];

  /**
   * Get all device configurations
   */
  static getAllDevices(): DeviceConfiguration[] {
    return [...this.DEVICE_CONFIGURATIONS];
  }

  /**
   * Get devices by priority
   */
  static getDevicesByPriority(priority: 'high' | 'medium' | 'low'): DeviceConfiguration[] {
    return this.DEVICE_CONFIGURATIONS.filter(device => device.testPriority === priority);
  }

  /**
   * Get high priority test configurations
   */
  static getHighPriorityConfigurations(): TestConfiguration[] {
    const highPriorityDevices = this.getDevicesByPriority('high');
    const configurations: TestConfiguration[] = [];

    highPriorityDevices.forEach(device => {
      this.ACCESSIBILITY_CONFIGURATIONS.forEach(accessibilitySettings => {
        configurations.push({
          device,
          accessibilitySettings,
          testScenarios: this.getRecommendedScenarios(device, accessibilitySettings)
        });
      });
    });

    return configurations;
  }

  /**
   * Get comprehensive test matrix
   */
  static getComprehensiveTestMatrix(): TestConfiguration[] {
    const configurations: TestConfiguration[] = [];

    this.DEVICE_CONFIGURATIONS.forEach(device => {
      // For high priority devices, test all accessibility configurations
      if (device.testPriority === 'high') {
        this.ACCESSIBILITY_CONFIGURATIONS.forEach(accessibilitySettings => {
          configurations.push({
            device,
            accessibilitySettings,
            testScenarios: this.getRecommendedScenarios(device, accessibilitySettings)
          });
        });
      } else {
        // For medium/low priority devices, test default and one accessibility configuration
        configurations.push({
          device,
          accessibilitySettings: this.ACCESSIBILITY_CONFIGURATIONS[0], // Default
          testScenarios: this.getRecommendedScenarios(device, this.ACCESSIBILITY_CONFIGURATIONS[0])
        });

        if (device.testPriority === 'medium') {
          configurations.push({
            device,
            accessibilitySettings: this.ACCESSIBILITY_CONFIGURATIONS[1], // VoiceOver
            testScenarios: this.getRecommendedScenarios(device, this.ACCESSIBILITY_CONFIGURATIONS[1])
          });
        }
      }
    });

    return configurations;
  }

  /**
   * Get recommended test scenarios based on device and accessibility settings
   */
  private static getRecommendedScenarios(
    device: DeviceConfiguration,
    accessibilitySettings: AccessibilityTestSettings
  ): string[] {
    const baseScenarios = [
      'basic-hours-setup',
      'complex-hours-configuration',
      'error-recovery',
      'form-navigation'
    ];

    const scenarios = [...baseScenarios];

    // Add device-specific scenarios
    if (device.screenSize === '5.4"' || device.screenSize === '4.7"') {
      scenarios.push('small-screen-usability');
    }

    if (device.screenSize === '6.7"' || device.screenSize === '6.9"') {
      scenarios.push('large-screen-optimization');
    }

    if (device.model.includes('SE')) {
      scenarios.push('home-button-navigation');
    }

    // Add accessibility-specific scenarios
    if (accessibilitySettings.voiceOver) {
      scenarios.push('voiceover-navigation', 'screen-reader-form-completion');
    }

    if (accessibilitySettings.dynamicType !== 'default') {
      scenarios.push('large-text-usability');
    }

    if (accessibilitySettings.highContrast) {
      scenarios.push('high-contrast-visibility');
    }

    if (accessibilitySettings.reduceMotion) {
      scenarios.push('reduced-motion-experience');
    }

    return scenarios;
  }

  /**
   * Generate test plan for specific device
   */
  static generateDeviceTestPlan(deviceId: string): {
    device: DeviceConfiguration;
    testConfigurations: TestConfiguration[];
    estimatedTime: number; // minutes
    criticalTests: string[];
  } | null {
    const device = this.DEVICE_CONFIGURATIONS.find(d => d.deviceId === deviceId);
    if (!device) return null;

    const testConfigurations: TestConfiguration[] = [];
    
    // Always test default configuration
    testConfigurations.push({
      device,
      accessibilitySettings: this.ACCESSIBILITY_CONFIGURATIONS[0],
      testScenarios: this.getRecommendedScenarios(device, this.ACCESSIBILITY_CONFIGURATIONS[0])
    });

    // Add accessibility configurations based on priority
    if (device.testPriority === 'high') {
      this.ACCESSIBILITY_CONFIGURATIONS.slice(1).forEach(accessibilitySettings => {
        testConfigurations.push({
          device,
          accessibilitySettings,
          testScenarios: this.getRecommendedScenarios(device, accessibilitySettings)
        });
      });
    } else if (device.testPriority === 'medium') {
      testConfigurations.push({
        device,
        accessibilitySettings: this.ACCESSIBILITY_CONFIGURATIONS[1], // VoiceOver
        testScenarios: this.getRecommendedScenarios(device, this.ACCESSIBILITY_CONFIGURATIONS[1])
      });
    }

    // Calculate estimated time (5 minutes per scenario)
    const totalScenarios = testConfigurations.reduce(
      (sum, config) => sum + config.testScenarios.length, 0
    );
    const estimatedTime = totalScenarios * 5;

    // Identify critical tests
    const criticalTests = [
      'basic-hours-setup',
      'form-navigation',
      'error-recovery'
    ];

    if (device.screenSize === '5.4"' || device.screenSize === '4.7"') {
      criticalTests.push('small-screen-usability');
    }

    return {
      device,
      testConfigurations,
      estimatedTime,
      criticalTests
    };
  }

  /**
   * Get testing recommendations based on available time
   */
  static getTestingRecommendations(availableHours: number): {
    recommendedDevices: string[];
    priorityOrder: string[];
    estimatedCoverage: number;
    criticalTestsOnly: boolean;
  } {
    const availableMinutes = availableHours * 60;
    let totalTime = 0;
    const recommendedDevices: string[] = [];
    const priorityOrder: string[] = [];

    // Sort devices by priority
    const sortedDevices = [...this.DEVICE_CONFIGURATIONS].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.testPriority] - priorityOrder[a.testPriority];
    });

    // Add devices until time limit reached
    for (const device of sortedDevices) {
      const testPlan = this.generateDeviceTestPlan(device.deviceId);
      if (!testPlan) continue;

      if (totalTime + testPlan.estimatedTime <= availableMinutes) {
        recommendedDevices.push(device.deviceId);
        totalTime += testPlan.estimatedTime;
      }
      priorityOrder.push(device.deviceId);
    }

    const totalDevices = this.DEVICE_CONFIGURATIONS.length;
    const estimatedCoverage = (recommendedDevices.length / totalDevices) * 100;
    const criticalTestsOnly = availableHours < 8; // Less than full day

    return {
      recommendedDevices,
      priorityOrder,
      estimatedCoverage,
      criticalTestsOnly
    };
  }

  /**
   * Generate comprehensive testing report template
   */
  static generateTestingReportTemplate(): string {
    let report = `# Device Compatibility Testing Report\n\n`;
    
    report += `## Test Matrix Overview\n`;
    report += `| Device | Screen Size | iOS Version | Priority | Test Scenarios |\n`;
    report += `|--------|-------------|-------------|----------|----------------|\n`;
    
    this.DEVICE_CONFIGURATIONS.forEach(device => {
      const scenarios = this.getRecommendedScenarios(device, this.ACCESSIBILITY_CONFIGURATIONS[0]);
      report += `| ${device.model} | ${device.screenSize} | ${device.iosVersion} | ${device.testPriority} | ${scenarios.length} |\n`;
    });
    
    report += `\n## Accessibility Test Configurations\n`;
    this.ACCESSIBILITY_CONFIGURATIONS.forEach((config, index) => {
      report += `### Configuration ${index + 1}\n`;
      report += `- VoiceOver: ${config.voiceOver ? 'Enabled' : 'Disabled'}\n`;
      report += `- Dynamic Type: ${config.dynamicType}\n`;
      report += `- High Contrast: ${config.highContrast ? 'Enabled' : 'Disabled'}\n`;
      report += `- Reduce Motion: ${config.reduceMotion ? 'Enabled' : 'Disabled'}\n`;
      report += `- Button Shapes: ${config.buttonShapes ? 'Enabled' : 'Disabled'}\n\n`;
    });

    report += `## Test Results Template\n`;
    report += `### Device: [Device Name]\n`;
    report += `### Configuration: [Accessibility Settings]\n`;
    report += `### Test Date: [Date]\n`;
    report += `### Tester: [Name]\n\n`;
    
    report += `#### Scenario Results\n`;
    report += `| Scenario | Completed | Time (min) | Errors | Rating | Notes |\n`;
    report += `|----------|-----------|------------|--------|--------|-------|\n`;
    report += `| Basic Hours Setup | ✅/❌ | X.X | X | X/5 | Notes |\n`;
    report += `| Complex Configuration | ✅/❌ | X.X | X | X/5 | Notes |\n`;
    report += `| Error Recovery | ✅/❌ | X.X | X | X/5 | Notes |\n`;
    report += `| Form Navigation | ✅/❌ | X.X | X | X/5 | Notes |\n\n`;

    report += `#### Overall Assessment\n`;
    report += `- **Usability Rating**: X/5\n`;
    report += `- **Performance**: Excellent/Good/Fair/Poor\n`;
    report += `- **Accessibility**: Fully Compliant/Mostly Compliant/Needs Work\n`;
    report += `- **Critical Issues**: [List any blocking issues]\n`;
    report += `- **Recommendations**: [Improvement suggestions]\n\n`;

    return report;
  }
}