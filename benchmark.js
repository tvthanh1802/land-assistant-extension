import { generateRandomPracticeBoard, solveDesertGrid } from './solver.js';

/**
 * Simulates a complete game playout on a given board using a chosen strategy
 */
export function simulatePlayout(boardData = null, strategy = 'infogain', maxShovels = 50) {
  const board = boardData || generateRandomPracticeBoard('Ascension Age');
  const secretBoard = board.secretBoard;
  const targetArtifact = board.seasonArtifact;
  const patterns = board.allPatternsToday;

  const diggingGrid = [];
  const dugCoords = new Set();
  let shovelsUsed = 0;
  let targetsFound = 0;
  const startTime = Date.now();
  let totalSolverTimeMs = 0;
  let moveCount = 0;

  while (targetsFound < 3 && shovelsUsed < maxShovels) {
    const diggingData = {
      grid: diggingGrid,
      patterns
    };

    const t0 = performance.now();
    const solverRes = solveDesertGrid(diggingData, board.season, strategy);
    const t1 = performance.now();
    totalSolverTimeMs += (t1 - t0);
    moveCount++;

    if (solverRes.isAllCompleted) break;

    let targetCoord = solverRes.bestNextDig;
    if (!targetCoord || dugCoords.has(`${targetCoord.x},${targetCoord.y}`)) {
      // Fallback: pick any undug cell if solver didn't provide one or provided dug cell
      let foundUndug = null;
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const k = `${x},${y}`;
          if (!dugCoords.has(k)) {
            foundUndug = { x, y, key: k };
            break;
          }
        }
        if (foundUndug) break;
      }
      targetCoord = foundUndug;
    }

    if (!targetCoord) break;

    const key = `${targetCoord.x},${targetCoord.y}`;
    dugCoords.add(key);
    shovelsUsed++;

    const item = secretBoard[key] || 'Sand';
    diggingGrid.push({
      x: targetCoord.x,
      y: targetCoord.y,
      items: { [item]: 1 }
    });

    if (item === targetArtifact) {
      targetsFound++;
    }
  }

  const durationMs = Date.now() - startTime;
  const avgSolverTimePerMoveMs = moveCount > 0 ? (totalSolverTimeMs / moveCount) : 0;

  return {
    success: targetsFound >= 3,
    targetsFound,
    shovelsUsed,
    durationMs,
    avgSolverTimePerMoveMs,
    boardId: board.id
  };
}

/**
 * Computes statistical metrics over an array of playout results
 */
export function computeStats(results) {
  if (results.length === 0) return null;

  const shovels = results.map(r => r.shovelsUsed).sort((a, b) => a - b);
  const n = shovels.length;
  const sum = shovels.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const median = n % 2 === 0
    ? (shovels[n / 2 - 1] + shovels[n / 2]) / 2
    : shovels[Math.floor(n / 2)];

  const p90Index = Math.min(n - 1, Math.floor(n * 0.9));
  const p90 = shovels[p90Index];

  const min = shovels[0];
  const max = shovels[n - 1];

  const variance = shovels.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const wins = results.filter(r => r.success).length;
  const winRate = (wins / n) * 100;

  const avgMoveTime = results.reduce((acc, r) => acc + r.avgSolverTimePerMoveMs, 0) / n;

  // Distribution histogram
  const bins = {
    "<= 15 cuốc": shovels.filter(s => s <= 15).length,
    "16 - 20 cuốc": shovels.filter(s => s >= 16 && s <= 20).length,
    "21 - 25 cuốc": shovels.filter(s => s >= 21 && s <= 25).length,
    "26 - 30 cuốc": shovels.filter(s => s >= 26 && s <= 30).length,
    "31 - 35 cuốc": shovels.filter(s => s >= 31 && s <= 35).length,
    "> 35 cuốc": shovels.filter(s => s > 35).length,
  };

  return {
    trials: n,
    winRate,
    mean: mean.toFixed(2),
    median: median.toFixed(1),
    p90,
    min,
    max,
    stdDev: stdDev.toFixed(2),
    avgMoveTimeMs: avgMoveTime.toFixed(2),
    bins
  };
}

function printStatsTable(title, stats) {
  console.log(`\n======================================================`);
  console.log(`  📊 KẾT QUẢ BENCHMARK: ${title.toUpperCase()}`);
  console.log(`======================================================`);
  console.log(`  Số ván chạy (Trials):       ${stats.trials}`);
  console.log(`  Tỷ lệ thắng (Win Rate):     ${stats.winRate.toFixed(1)}%`);
  console.log(`  ----------------------------------------------------`);
  console.log(`  Số cuốc trung bình (Mean):  ${stats.mean} cuốc`);
  console.log(`  Số cuốc trung vị (Median):  ${stats.median} cuốc`);
  console.log(`  Mốc P90 (90% ván dưới mốc): ${stats.p90} cuốc`);
  console.log(`  Min / Max cuốc:             ${stats.min} / ${stats.max} cuốc`);
  console.log(`  Độ lệch chuẩn (Std Dev):    ${stats.stdDev}`);
  console.log(`  Thời gian tính/nước (Avg):  ${stats.avgMoveTimeMs} ms`);
  console.log(`  ----------------------------------------------------`);
  console.log(`  Phân bổ số cuốc đào:`);
  for (const [bin, count] of Object.entries(stats.bins)) {
    const pct = ((count / stats.trials) * 100).toFixed(1);
    const bar = "█".repeat(Math.round(count / stats.trials * 25));
    console.log(`    ${bin.padEnd(14)}: ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  }
  console.log(`======================================================\n`);
}

// CLI Execution
async function main() {
  const args = process.argv.slice(2);
  let trials = 50;
  let strategy = 'infogain';
  let compare = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--trials' && args[i + 1]) {
      trials = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--strategy' && args[i + 1]) {
      strategy = args[i + 1];
      i++;
    } else if (args[i] === '--compare') {
      compare = true;
    }
  }

  if (compare) {
    console.log(`🚀 Bắt đầu Benchmark Đối đầu A/B (${trials} ván trên cùng các bàn cờ)...`);
    const baselineResults = [];
    const infogainResults = [];

    for (let i = 0; i < trials; i++) {
      const board = generateRandomPracticeBoard('Ascension Age');
      const resBase = simulatePlayout(board, 'baseline');
      const resInfo = simulatePlayout(board, 'infogain');
      baselineResults.push(resBase);
      infogainResults.push(resInfo);

      if ((i + 1) % 10 === 0 || i + 1 === trials) {
        process.stdout.write(`\rĐang chạy: ${i + 1}/${trials} ván...`);
      }
    }
    console.log('\nHoàn thành!');

    const baseStats = computeStats(baselineResults);
    const infoStats = computeStats(infogainResults);

    printStatsTable('BASELINE (Hệ điểm cũ)', baseStats);
    printStatsTable('INFOGAIN (Expected Information Gain)', infoStats);

    const diff = (parseFloat(infoStats.mean) - parseFloat(baseStats.mean)).toFixed(2);
    const diffPct = (((parseFloat(infoStats.mean) - parseFloat(baseStats.mean)) / parseFloat(baseStats.mean)) * 100).toFixed(1);
    console.log(`\n>>> 🏆 KẾT LUẬN SO SÁNH:`);
    if (parseFloat(diff) < 0) {
      console.log(`  ✅ Thuật toán mới GIẢM ${Math.abs(diff)} cuốc/ván (${Math.abs(diffPct)}%) so với baseline!`);
    } else if (parseFloat(diff) > 0) {
      console.log(`  ⚠️ Thuật toán mới TĂNG ${diff} cuốc/ván so với baseline.`);
    } else {
      console.log(`  ⚖️ Hai thuật toán có hiệu năng tương đương (${baseStats.mean} cuốc).`);
    }
  } else {
    console.log(`🚀 Bắt đầu Benchmark chiến lược [${strategy}] trên ${trials} ván ngẫu nhiên...`);
    const results = [];

    for (let i = 0; i < trials; i++) {
      const res = simulatePlayout(null, strategy);
      results.push(res);

      if ((i + 1) % 10 === 0 || i + 1 === trials) {
        process.stdout.write(`\rĐang chạy: ${i + 1}/${trials} ván...`);
      }
    }
    console.log('\nHoàn thành!');

    const stats = computeStats(results);
    printStatsTable(strategy, stats);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('benchmark.js')) {
  main().catch(console.error);
}
