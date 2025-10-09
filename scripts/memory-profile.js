#!/usr/bin/env node

/**
 * Interactive Memory Profiler
 * Run with: node --expose-gc --inspect scripts/memory-profile.js
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');

class MemoryProfiler {
  constructor() {
    this.snapshots = [];
    this.baselineSnapshot = null;
  }

  /**
   * Take a heap snapshot
   */
  takeSnapshot(label = 'snapshot') {
    console.log(`📸 Taking heap snapshot: ${label}...`);

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    const snapshot = v8.writeHeapSnapshot();
    const stats = this.getHeapStats();

    const snapshotData = {
      label,
      timestamp: new Date().toISOString(),
      file: snapshot,
      stats,
    };

    this.snapshots.push(snapshotData);

    console.log(`✅ Snapshot saved: ${snapshot}`);
    console.log(`📊 Heap Stats:`, stats);

    return snapshotData;
  }

  /**
   * Get current heap statistics
   */
  getHeapStats() {
    const heapStats = v8.getHeapStatistics();
    const heapSpaceStats = v8.getHeapSpaceStatistics();

    return {
      totalHeapSize: this.formatBytes(heapStats.total_heap_size),
      usedHeapSize: this.formatBytes(heapStats.used_heap_size),
      heapSizeLimit: this.formatBytes(heapStats.heap_size_limit),
      usagePercent:
        ((heapStats.used_heap_size / heapStats.heap_size_limit) * 100).toFixed(
          2,
        ) + '%',
      spaces: heapSpaceStats.map(space => ({
        name: space.space_name,
        size: this.formatBytes(space.space_size),
        used: this.formatBytes(space.space_used_size),
        available: this.formatBytes(space.space_available_size),
      })),
    };
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(snapshot1, snapshot2) {
    console.log(`\n🔍 Comparing snapshots:`);
    console.log(`  Before: ${snapshot1.label} (${snapshot1.timestamp})`);
    console.log(`  After:  ${snapshot2.label} (${snapshot2.timestamp})`);

    const before = this.parseSize(snapshot1.stats.usedHeapSize);
    const after = this.parseSize(snapshot2.stats.usedHeapSize);
    const growth = after - before;
    const growthPercent = ((growth / before) * 100).toFixed(2);

    console.log(`\n📈 Memory Growth:`);
    console.log(`  Before: ${snapshot1.stats.usedHeapSize}`);
    console.log(`  After:  ${snapshot2.stats.usedHeapSize}`);
    console.log(`  Growth: ${this.formatBytes(growth)} (${growthPercent}%)`);

    if (growth > 10 * 1024 * 1024) {
      // 10MB
      console.log(`  ⚠️  WARNING: Significant memory growth detected!`);
    } else if (growth > 0) {
      console.log(`  ✅ Memory growth is within acceptable range`);
    } else {
      console.log(`  ✨ Memory usage decreased`);
    }

    return {
      before: snapshot1.stats.usedHeapSize,
      after: snapshot2.stats.usedHeapSize,
      growth: this.formatBytes(growth),
      growthPercent: growthPercent + '%',
      status: growth > 10 * 1024 * 1024 ? 'WARNING' : 'OK',
    };
  }

  /**
   * Generate comprehensive memory report
   */
  generateReport() {
    const reportPath = path.join(process.cwd(), 'memory-test-reports');

    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const report = {
      generatedAt: new Date().toISOString(),
      snapshots: this.snapshots.map(s => ({
        label: s.label,
        timestamp: s.timestamp,
        stats: s.stats,
      })),
      comparisons: [],
    };

    // Compare consecutive snapshots
    for (let i = 1; i < this.snapshots.length; i++) {
      const comparison = this.compareSnapshots(
        this.snapshots[i - 1],
        this.snapshots[i],
      );
      report.comparisons.push(comparison);
    }

    const reportFile = path.join(
      reportPath,
      `memory-report-${Date.now()}.json`,
    );
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📄 Report saved: ${reportFile}`);

    return report;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Parse formatted size back to bytes
   */
  parseSize(sizeStr) {
    const match = sizeStr.match(/^([\d.]+)\s*(\w+)$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2];

    const multipliers = {
      Bytes: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Clean up old snapshots
   */
  cleanup() {
    console.log('\n🧹 Cleaning up snapshots...');

    this.snapshots.forEach(snapshot => {
      if (fs.existsSync(snapshot.file)) {
        fs.unlinkSync(snapshot.file);
        console.log(`  Deleted: ${snapshot.file}`);
      }
    });

    this.snapshots = [];
    console.log('✅ Cleanup complete');
  }
}

// Main execution
async function main() {
  console.log('🔬 Memory Profiler Starting...\n');

  const profiler = new MemoryProfiler();

  // Take baseline snapshot
  profiler.takeSnapshot('Baseline');

  console.log('\n⏳ Waiting 5 seconds for app to settle...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Simulate memory-intensive operations
  console.log('🏃 Simulating memory-intensive operations...\n');

  const largeArrays = [];
  for (let i = 0; i < 100; i++) {
    largeArrays.push(new Array(10000).fill(Math.random()));
  }

  profiler.takeSnapshot('After Creating Arrays');

  // Clear arrays
  largeArrays.length = 0;

  if (global.gc) {
    console.log('🗑️  Running garbage collection...\n');
    global.gc();
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  profiler.takeSnapshot('After Cleanup');

  // Generate report
  console.log('\n📊 Generating Report...');
  profiler.generateReport();

  // Cleanup snapshots
  profiler.cleanup();

  console.log('\n✅ Memory profiling complete!');
  console.log('\nNext steps:');
  console.log('  1. Review the report in memory-test-reports/');
  console.log('  2. Compare snapshots using Chrome DevTools');
  console.log('  3. Identify any memory leaks');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MemoryProfiler;
