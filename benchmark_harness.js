import { generateRandomPracticeBoard, solveDesertGrid } from './solver.js';

export async function runBenchmark(numGames = 300, label = 'Current solver.js') {
  console.log(`\n============================================================`);
  console.log(`🚀 RUNNING BENCHMARK: ${label} (${numGames} games)`);
  console.log(`============================================================`);

  const shovelsArray = [];
  const t0 = Date.now();

  for (let i = 0; i < numGames; i++) {
    const game = generateRandomPracticeBoard('Ascension Age');
    let digs = [];
    let shovels = 0;
    while (true) {
      const payload = { grid: digs, patterns: game.allPatternsToday, completedPatterns: [] };
      const res = solveDesertGrid(payload, 'Ascension Age');
      if (res.isAllCompleted) {
        shovelsArray.push(shovels);
        break;
      }
      const next = res.bestNextDig;
      if (!next) {
        console.warn(`[WARN] No next dig suggested at shovel ${shovels}`);
        shovelsArray.push(shovels);
        break;
      }
      const item = game.secretBoard[next.key] || 'Sand';
      digs.push({ x: next.x, y: next.y, items: { [item]: 1 } });
      shovels++;
    }

    if ((i + 1) % 50 === 0 || (i + 1) === numGames) {
      const curAvg = (shovelsArray.reduce((a, b) => a + b, 0) / shovelsArray.length).toFixed(2);
      process.stdout.write(`Progress: ${i + 1}/${numGames} games | Current Avg: ${curAvg}\r`);
    }
  }

  const durationMs = Date.now() - t0;
  console.log(`\nCompleted ${numGames} games in ${(durationMs / 1000).toFixed(1)}s (${(durationMs / numGames).toFixed(1)}ms/game)`);

  shovelsArray.sort((a, b) => a - b);
  const n = shovelsArray.length;
  const sum = shovelsArray.reduce((acc, v) => acc + v, 0);
  const avg = sum / n;
  const min = shovelsArray[0];
  const max = shovelsArray[n - 1];
  const median = n % 2 === 0 ? (shovelsArray[n / 2 - 1] + shovelsArray[n / 2]) / 2 : shovelsArray[Math.floor(n / 2)];
  const p90 = shovelsArray[Math.floor(n * 0.90)];
  const p95 = shovelsArray[Math.floor(n * 0.95)];

  const buckets = {
    '<= 15': shovelsArray.filter(s => s <= 15).length,
    '16 - 20': shovelsArray.filter(s => s >= 16 && s <= 20).length,
    '21 - 25': shovelsArray.filter(s => s >= 21 && s <= 25).length,
    '26 - 30': shovelsArray.filter(s => s >= 26 && s <= 30).length,
    '31 - 35': shovelsArray.filter(s => s >= 31 && s <= 35).length,
    '> 35': shovelsArray.filter(s => s > 35).length,
  };

  console.log(`\n--- STATISTICAL RESULTS [${label}] ---`);
  console.log(`Min:    ${min}`);
  console.log(`Median: ${median}`);
  console.log(`Mean:   ${avg.toFixed(2)}`);
  console.log(`P90:    ${p90}`);
  console.log(`P95:    ${p95}`);
  console.log(`Max:    ${max}`);
  console.log(`\n--- DISTRIBUTION ---`);
  for (const [k, count] of Object.entries(buckets)) {
    const pct = ((count / n) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / n * 30));
    console.log(`${k.padEnd(8)}: ${count.toString().padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  }
  console.log(`============================================================\n`);

  return { n, min, median, avg, p90, p95, max, buckets };
}

// Run if called directly
const numGames = parseInt(process.argv[2] || '300', 10);
runBenchmark(numGames, 'Baseline solver.js');
