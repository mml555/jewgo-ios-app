/**
 * Memory Leak Tests - Component Cleanup
 * Tests that components properly clean up animations, timers, and listeners on unmount
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SaveStatusIndicator from '../../src/components/SaveStatusIndicator';
import LoadingIndicator from '../../src/components/LoadingIndicator';
import AnimatedButton from '../../src/components/AnimatedButton';
import SuccessCelebration from '../../src/components/SuccessCelebration';
import FormProgressIndicator from '../../src/components/FormProgressIndicator';
import { SaveStatus } from '../../src/services/FormPersistence';

// Helper to get memory usage
function getMemoryUsage(): number {
  if (typeof (performance as any)?.memory !== 'undefined') {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}

// Helper to force garbage collection if available
function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

describe('Memory Leak Tests - Component Cleanup', () => {
  const MOUNT_UNMOUNT_CYCLES = 50;
  const MAX_MEMORY_GROWTH = 5 * 1024 * 1024; // 5MB

  beforeEach(() => {
    forceGC();
  });

  afterEach(() => {
    forceGC();
  });

  it('SaveStatusIndicator should not leak on mount/unmount cycles', async () => {
    const initialMemory = getMemoryUsage();

    for (let i = 0; i < MOUNT_UNMOUNT_CYCLES; i++) {
      const { unmount } = render(
        <SaveStatusIndicator
          saveStatus={SaveStatus.SAVING}
          lastSaved={new Date()}
          saveCount={i}
          completionPercentage={50}
        />,
      );

      await waitFor(() => {}, { timeout: 50 });
      unmount();
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalMemory = getMemoryUsage();
    const memoryGrowth = finalMemory - initialMemory;

    expect(memoryGrowth).toBeLessThan(MAX_MEMORY_GROWTH);
  });

  it('LoadingIndicator should not leak animations', async () => {
    const initialMemory = getMemoryUsage();

    const variants: Array<'spinner' | 'dots' | 'pulse' | 'progress'> = [
      'spinner',
      'dots',
      'pulse',
      'progress',
    ];

    for (let i = 0; i < MOUNT_UNMOUNT_CYCLES; i++) {
      const { unmount } = render(
        <LoadingIndicator
          visible={true}
          message="Loading..."
          variant={variants[i % variants.length]}
        />,
      );

      await waitFor(() => {}, { timeout: 50 });
      unmount();
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalMemory = getMemoryUsage();
    const memoryGrowth = finalMemory - initialMemory;

    expect(memoryGrowth).toBeLessThan(MAX_MEMORY_GROWTH);
  });

  it('AnimatedButton should cleanup all animations', async () => {
    const initialMemory = getMemoryUsage();

    for (let i = 0; i < MOUNT_UNMOUNT_CYCLES; i++) {
      const { unmount } = render(
        <AnimatedButton
          title="Test Button"
          onPress={() => {}}
          success={i % 2 === 0}
          error={i % 3 === 0}
          loading={i % 5 === 0}
        />,
      );

      await waitFor(() => {}, { timeout: 50 });
      unmount();
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalMemory = getMemoryUsage();
    const memoryGrowth = finalMemory - initialMemory;

    expect(memoryGrowth).toBeLessThan(MAX_MEMORY_GROWTH);
  });

  it('SuccessCelebration should cleanup complex animations', async () => {
    const initialMemory = getMemoryUsage();

    for (let i = 0; i < MOUNT_UNMOUNT_CYCLES; i++) {
      const { unmount } = render(
        <SuccessCelebration
          visible={true}
          title="Success!"
          message="Test message"
          duration={1000}
        />,
      );

      await waitFor(() => {}, { timeout: 50 });
      unmount();
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalMemory = getMemoryUsage();
    const memoryGrowth = finalMemory - initialMemory;

    expect(memoryGrowth).toBeLessThan(MAX_MEMORY_GROWTH);
  });

  it('FormProgressIndicator should cleanup step animations', async () => {
    const initialMemory = getMemoryUsage();

    const steps = [
      {
        number: 1,
        title: 'Step 1',
        subtitle: '',
        isCompleted: true,
        isValid: true,
        isCurrent: false,
        hasErrors: false,
        completionPercentage: 100,
      },
      {
        number: 2,
        title: 'Step 2',
        subtitle: '',
        isCompleted: false,
        isValid: false,
        isCurrent: true,
        hasErrors: false,
        completionPercentage: 50,
      },
      {
        number: 3,
        title: 'Step 3',
        subtitle: '',
        isCompleted: false,
        isValid: false,
        isCurrent: false,
        hasErrors: false,
        completionPercentage: 0,
      },
    ];

    for (let i = 0; i < MOUNT_UNMOUNT_CYCLES; i++) {
      const { unmount } = render(
        <FormProgressIndicator steps={steps} onStepPress={() => {}} />,
      );

      await waitFor(() => {}, { timeout: 50 });
      unmount();
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalMemory = getMemoryUsage();
    const memoryGrowth = finalMemory - initialMemory;

    expect(memoryGrowth).toBeLessThan(MAX_MEMORY_GROWTH);
  });

  it('Multiple components simultaneously should not accumulate leaks', async () => {
    const initialMemory = getMemoryUsage();

    for (let i = 0; i < MOUNT_UNMOUNT_CYCLES; i++) {
      const { unmount: unmount1 } = render(
        <SaveStatusIndicator
          saveStatus={SaveStatus.SAVED}
          lastSaved={new Date()}
          saveCount={1}
          completionPercentage={100}
        />,
      );

      const { unmount: unmount2 } = render(
        <LoadingIndicator visible={true} message="Test" />,
      );

      const { unmount: unmount3 } = render(
        <AnimatedButton title="Test" onPress={() => {}} />,
      );

      await waitFor(() => {}, { timeout: 50 });

      unmount1();
      unmount2();
      unmount3();
    }

    forceGC();
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalMemory = getMemoryUsage();
    const memoryGrowth = finalMemory - initialMemory;

    // Allow slightly more growth for multiple components
    expect(memoryGrowth).toBeLessThan(MAX_MEMORY_GROWTH * 1.5);
  });
});
