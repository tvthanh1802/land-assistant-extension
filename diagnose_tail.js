import { generateRandomPracticeBoard, solveDesertGrid, coordToLabel } from './solver.js';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE C: Targeted tail-elimination telemetry
//  Bước 1 – Decode 'Other' reasons
//  Bước 2 – Sparse-clue vs dense-clue pattern isolation
//  Bước 5/6 – Report + 500-game benchmark
// ─────────────────────────────────────────────────────────────────────────────

// Patterns classified by number of Camel Bone clues
const SPARSE_CLUE_PATTERNS = new Set([
  'ARTEFACT_THREE',     // 0 bones
  'ARTEFACT_SEVEN',     // 1 bone (diagonal)
  'ARTEFACT_THIRTEEN',  // 1 bone (x+2)
  'ARTEFACT_FOURTEEN',  // 1 bone (y+2)
  'ARTEFACT_ELEVEN',    // 2 bones
  'ARTEFACT_SIXTEEN',   // 2 bones
  'ARTEFACT_SEVENTEEN', // 2 bones
  'ARTEFACT_EIGHT',     // 2 bones (spread)
  'ARTEFACT_TWO',       // 2 bones (spread)
]);

const DENSE_CLUE_PATTERNS = new Set([
  'ARTEFACT_FOUR',         // 3 bones
  'ARTEFACT_NINE',         // 3 bones
  'ARTEFACT_TWELVE',       // 3 bones
  'ARTEFACT_EIGHTEEN',     // 3 bones
  'ARTEFACT_TWENTY',       // 3 bones
  'ARTEFACT_TWENTY_ONE',   // 4 bones
  'ARTEFACT_TWENTY_TWO',   // 4 bones
  'ARTEFACT_TWENTY_THREE', // 4 bones
  'ARTEFACT_TWENTY_FOUR',  // 4 bones
  'ARTEFACT_ONE',          // 2 close bones
  'ARTEFACT_TEN',          // 3 close bones
]);

function hasSparsePattern(patterns) {
  return patterns.some(p => SPARSE_CLUE_PATTERNS.has(p));
}

function hasDenseOnlyPatterns(patterns) {
  return patterns.every(p => DENSE_CLUE_PATTERNS.has(p) || !p.startsWith('ARTEFACT_'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Reason categorization (Bước 1: match ALL branches from solver.js)
// ─────────────────────────────────────────────────────────────────────────────
function categorizeReason(reason) {
  if (!reason) return 'No reason';
  if (reason.includes('Chắc chắn 100%'))        return 'Guaranteed 100%';
  if (reason.includes('cạnh Cua') && reason.includes('Chắc chắn')) return 'Crab Neighbor (Forced)';
  if (reason.includes('Khớp') && reason.includes('Camel Bone'))    return 'Camel Bone Clue';
  if (reason.includes('Giao điểm sát thủ'))      return 'Crab Intersect';
  if (reason.includes('Săn di vật cuối'))        return 'Final Target Hunt (2 found)';
  if (reason.includes('Phá thế bí'))             return 'Stuck-Detector Probe';
  if (reason.includes('Xác suất') && reason.includes('trúng Otter')) return 'High Probability Target';
  if (reason.includes('Xương Lạc Đà'))           return 'Bone Search (pBone)';
  if (reason.includes('Entropy') && reason.includes('thông tin tối đa')) return 'Max Entropy Probe';
  if (reason.includes('Lưới bước Mã'))           return 'Knight Lattice Probe';
  if (reason.includes('tập trung di vật'))       return 'Dynamic Target Probe (Pattern Coverage)';
  if (reason.includes('giảm thiểu kỳ vọng'))     return 'Min Expected Shovels';
  return `[Raw] ${reason.replace(/[🎯⚡🦴]/g,'').trim().slice(0, 60)}`;
}

export async function runTailDiagnosis(numGames = 500) {
  console.log(`\n============================================================`);
  console.log(`🔍 PHASE C TAIL DIAGNOSIS (${numGames} games)`);
  console.log(`============================================================`);

  const gamesData = [];
  const t0 = Date.now();

  for (let i = 0; i < numGames; i++) {
    const game = generateRandomPracticeBoard('Ascension Age');
    let digs = [];
    let shovels = 0;
    const turnsLog = [];

    while (true) {
      const payload = { grid: digs, patterns: game.allPatternsToday, completedPatterns: [] };
      const res = solveDesertGrid(payload, 'Ascension Age');

      if (res.isAllCompleted) break;

      const next = res.bestNextDig;
      if (!next) {
        console.warn(`[WARN] Game ${i + 1}: No next dig at shovel ${shovels}`);
        break;
      }

      const actualItem = game.secretBoard[next.key] || 'Sand';
      const patternSnapshots = (res.targetAnalysis || []).map(t => ({
        pattern: t.patternName,
        status: t.status,
        candidateCount: t.candidateKeys ? t.candidateKeys.length : 0,
        validPlacements: t.validPlacementsCount || 0
      }));

      turnsLog.push({
        turn: shovels + 1,
        key: next.key,
        label: next.label || coordToLabel(next.x, next.y),
        x: next.x, y: next.y,
        score: next.score,
        probability: next.probability || 0,
        boneProbability: next.boneProbability || 0,
        crabProbability: next.crabProbability || 0,
        sandProbability: next.sandProbability || 0,
        entropy: next.entropy || 0,
        secProb: next.secProb || 0,
        isStuck: !!next.isStuck,
        isGuaranteed: !!next.isGuaranteed,
        reason: next.reason || '',
        reasonCat: categorizeReason(next.reason || ''),
        breakdown: next.breakdown || null,
        targetPatterns: patternSnapshots,
        targetsFoundCount: res.targetPiecesFound ? res.targetPiecesFound.length : 0,
        validJointConfigsCount: res.validJointConfigsCount || 0,
        actualItem
      });

      digs.push({ x: next.x, y: next.y, items: { [actualItem]: 1 } });
      shovels++;
    }

    const targetPatterns = game.allPatternsToday.filter(p => p.startsWith('ARTEFACT_'));
    gamesData.push({
      gameId: i + 1,
      totalShovels: shovels,
      patterns: game.allPatternsToday,
      targetPatterns,
      hasSparse: hasSparsePattern(targetPatterns),
      hasDenseOnly: hasDenseOnlyPatterns(targetPatterns),
      turns: turnsLog
    });

    if ((i + 1) % 50 === 0 || (i + 1) === numGames) {
      const curAvg = (gamesData.reduce((acc, g) => acc + g.totalShovels, 0) / gamesData.length).toFixed(2);
      process.stdout.write(`Progress: ${i + 1}/${numGames} | Avg: ${curAvg}\r`);
    }
  }

  const durationMs = Date.now() - t0;
  console.log(`\nSimulation complete in ${(durationMs / 1000).toFixed(1)}s`);

  // ─── Group split ──────────────────────────────────────────────────────────
  const groupSub16  = gamesData.filter(g => g.totalShovels <= 15);
  const groupA      = gamesData.filter(g => g.totalShovels >= 16 && g.totalShovels <= 25);
  const groupB      = gamesData.filter(g => g.totalShovels >= 26 && g.totalShovels <= 35);
  const groupOver35 = gamesData.filter(g => g.totalShovels > 35);

  // Full stats
  const allShovels = gamesData.map(g => g.totalShovels).sort((a, b) => a - b);
  const n = allShovels.length;
  const mean = (allShovels.reduce((a,b)=>a+b,0)/n).toFixed(2);
  const p90  = allShovels[Math.floor(n*0.90)];
  const p95  = allShovels[Math.floor(n*0.95)];
  const maxV = allShovels[n-1];
  const minV = allShovels[0];
  const med  = n%2===0 ? (allShovels[n/2-1]+allShovels[n/2])/2 : allShovels[Math.floor(n/2)];

  console.log(`\n============================================================`);
  console.log(`📊 BENCHMARK RESULTS (${numGames} games):`);
  console.log(`   Min=${minV}  Median=${med}  Mean=${mean}  P90=${p90}  P95=${p95}  Max=${maxV}`);
  const buckets = { '<=15': groupSub16.length, '16-25': groupA.length, '26-35': groupB.length, '>35': groupOver35.length };
  for (const [k,v] of Object.entries(buckets)) {
    console.log(`   ${k.padEnd(6)}: ${v.toString().padStart(4)} / ${numGames} (${(v/numGames*100).toFixed(1)}%)`);
  }
  console.log(`============================================================`);

  // ─── BƯỚC 1: Decode 'Other' / all reason categories in Group B ───────────
  console.log(`\n--- BƯỚC 1: REASON CATEGORIES in GROUP B (26-35 shovels) ---`);
  const reasonCountsB = {};
  const reasonSamples  = {};   // store a few raw strings per category
  const totalDigsB = groupB.reduce((a,g)=>a+g.totalShovels, 0);

  for (const g of groupB) {
    for (const t of g.turns) {
      const cat = t.reasonCat;
      reasonCountsB[cat] = (reasonCountsB[cat] || 0) + 1;
      if (!reasonSamples[cat]) reasonSamples[cat] = [];
      if (reasonSamples[cat].length < 3) reasonSamples[cat].push(t.reason);
    }
  }
  console.log(`Total digs in Group B: ${totalDigsB}`);
  const sortedReasons = Object.entries(reasonCountsB).sort((a,b) => b[1]-a[1]);
  for (const [cat, cnt] of sortedReasons) {
    const pct = (cnt/totalDigsB*100).toFixed(1);
    const bar = '█'.repeat(Math.min(30, Math.round(cnt/totalDigsB*40)));
    console.log(`  ${cat.padEnd(38)}: ${cnt.toString().padStart(5)} (${pct.padStart(5)}%) ${bar}`);
    if (cat.startsWith('[Raw]') || (!cat.includes('%') && cnt > 10)) {
      for (const s of (reasonSamples[cat]||[]).slice(0,2)) {
        console.log(`      Sample: "${s}"`);
      }
    }
  }

  // ─── BƯỚC 2: Sparse-clue vs Dense-clue game isolation ────────────────────
  console.log(`\n--- BƯỚC 2: SPARSE-CLUE PATTERN ISOLATION ---`);
  const sparseGames = gamesData.filter(g => g.hasSparse);
  const denseGames  = gamesData.filter(g => g.hasDenseOnly);
  const mixedGames  = gamesData.filter(g => !g.hasSparse && !g.hasDenseOnly);

  function groupStats(games, label) {
    if (games.length === 0) return;
    const shovArr = games.map(g=>g.totalShovels).sort((a,b)=>a-b);
    const nn = shovArr.length;
    const avg = (shovArr.reduce((a,b)=>a+b,0)/nn).toFixed(2);
    const p95v = shovArr[Math.floor(nn*0.95)];
    const maxv = shovArr[nn-1];
    const b26  = shovArr.filter(s=>s>=26).length;
    const b26pct = (b26/nn*100).toFixed(1);
    console.log(`  ${label.padEnd(22)}: n=${nn.toString().padStart(4)}  Mean=${avg}  P95=${p95v}  Max=${maxv}  >25: ${b26}/${nn} (${b26pct}%)`);
  }

  groupStats(sparseGames, 'Has Sparse Pattern');
  groupStats(denseGames,  'Dense Only');
  groupStats(mixedGames,  'Mixed');

  // Breakdown: which sparse patterns most over-represented in Group B
  console.log(`\n  Sparse pattern B/A ratios:`);
  const sparsePatternStats = {};
  for (const g of gamesData) {
    const isB = g.totalShovels >= 26 && g.totalShovels <= 35;
    const isA = g.totalShovels >= 16 && g.totalShovels <= 25;
    for (const p of g.targetPatterns) {
      if (!SPARSE_CLUE_PATTERNS.has(p)) continue;
      if (!sparsePatternStats[p]) sparsePatternStats[p] = { total: 0, countA: 0, countB: 0 };
      sparsePatternStats[p].total++;
      if (isA) sparsePatternStats[p].countA++;
      if (isB) sparsePatternStats[p].countB++;
    }
  }
  for (const [p, st] of Object.entries(sparsePatternStats).sort((a,b) =>
    (b[1].countB/Math.max(1,groupB.length)) - (a[1].countB/Math.max(1,groupB.length)))) {
    const pctA = (st.countA/Math.max(1,groupA.length)*100).toFixed(1);
    const pctB = (st.countB/Math.max(1,groupB.length)*100).toFixed(1);
    const ratio = (st.countA > 0 ? (st.countB/groupB.length)/(st.countA/groupA.length) : 0).toFixed(2);
    console.log(`    ${p.padEnd(28)}: Grp-A=${pctA}%  Grp-B=${pctB}%  B/A=${ratio}x`);
  }

  // ─── BƯỚC 3: "Sparse-clue" explanation coverage ──────────────────────────
  console.log(`\n--- BƯỚC 3: HOW MUCH OF GROUP B IS EXPLAINED BY SPARSE PATTERNS ---`);
  const bSparse = groupB.filter(g => g.hasSparse).length;
  const bDense  = groupB.filter(g => g.hasDenseOnly).length;
  const bMixed  = groupB.filter(g => !g.hasSparse && !g.hasDenseOnly).length;
  console.log(`  Group B total: ${groupB.length} games`);
  console.log(`    With sparse pattern : ${bSparse} (${(bSparse/Math.max(1,groupB.length)*100).toFixed(1)}%)`);
  console.log(`    Dense only          : ${bDense}  (${(bDense/Math.max(1,groupB.length)*100).toFixed(1)}%)`);
  console.log(`    Mixed               : ${bMixed}  (${(bMixed/Math.max(1,groupB.length)*100).toFixed(1)}%)`);

  // ─── BƯỚC 4: jointTargetHits=0 occurrence (zero-joint check) ─────────────
  console.log(`\n--- BƯỚC 4: ZERO JOINT CONFIGS (validJointConfigsCount=0) ---`);
  function countZeroJoint(games) {
    let turnsTotal = 0, turnsZero = 0;
    let with1t = 0, with1tZero = 0;
    let with2t = 0, with2tZero = 0;
    for (const g of games) {
      for (const t of g.turns) {
        turnsTotal++;
        if (t.validJointConfigsCount === 0) turnsZero++;
        if (t.targetsFoundCount === 1) {
          with1t++;
          if (t.validJointConfigsCount === 0) with1tZero++;
        }
        if (t.targetsFoundCount === 2) {
          with2t++;
          if (t.validJointConfigsCount === 0) with2tZero++;
        }
      }
    }
    return { turnsTotal, turnsZero, with1t, with1tZero, with2t, with2tZero };
  }
  const zjA = countZeroJoint(groupA);
  const zjB = countZeroJoint(groupB);
  console.log(`  Group A: zero-joint ${zjA.turnsZero}/${zjA.turnsTotal} (${(zjA.turnsZero/Math.max(1,zjA.turnsTotal)*100).toFixed(1)}%)`);
  console.log(`           1-target turns: ${zjA.with1tZero}/${zjA.with1t} (${(zjA.with1tZero/Math.max(1,zjA.with1t)*100).toFixed(1)}% zero)`);
  console.log(`           2-target turns: ${zjA.with2tZero}/${zjA.with2t} (${(zjA.with2tZero/Math.max(1,zjA.with2t)*100).toFixed(1)}% zero)`);
  console.log(`  Group B: zero-joint ${zjB.turnsZero}/${zjB.turnsTotal} (${(zjB.turnsZero/Math.max(1,zjB.turnsTotal)*100).toFixed(1)}%)`);
  console.log(`           1-target turns: ${zjB.with1tZero}/${zjB.with1t} (${(zjB.with1tZero/Math.max(1,zjB.with1t)*100).toFixed(1)}% zero)`);
  console.log(`           2-target turns: ${zjB.with2tZero}/${zjB.with2t} (${(zjB.with2tZero/Math.max(1,zjB.with2t)*100).toFixed(1)}% zero)`);

  // ─── BƯỚC 5: Pattern candidate floor — when does solver finally converge? ─
  console.log(`\n--- BƯỚC 5: CONVERGENCE TURNS (1st turn with pTarget >= 50%) ---`);
  function convergenceStats(games) {
    const turns1st = [];
    for (const g of games) {
      const found = g.turns.find(t => t.probability >= 0.5 && !t.isGuaranteed);
      if (found) turns1st.push(found.turn);
    }
    const avg = turns1st.length > 0
      ? (turns1st.reduce((a,b)=>a+b,0)/turns1st.length).toFixed(1) : 'N/A';
    return { avg, count: turns1st.length, total: games.length };
  }
  const convA = convergenceStats(groupA);
  const convB = convergenceStats(groupB);
  console.log(`  Group A: reached pTarget>=50% in turn ${convA.avg} avg (${convA.count}/${convA.total} games)`);
  console.log(`  Group B: reached pTarget>=50% in turn ${convB.avg} avg (${convB.count}/${convB.total} games)`);

  // ─── BƯỚC 6: Save + summary ───────────────────────────────────────────────
  console.log(`\n============================================================`);
  console.log(`📋 PHASE C SUMMARY & VERDICT`);
  console.log(`============================================================`);
  console.log(`Benchmark   : Mean=${mean}  P90=${p90}  P95=${p95}  Max=${maxV}`);
  console.log(`Group B     : ${groupB.length}/${numGames} (${(groupB.length/numGames*100).toFixed(1)}%)`);
  console.log(`Group >35   : ${groupOver35.length}/${numGames} (${(groupOver35.length/numGames*100).toFixed(1)}%)`);
  console.log(`Zero-joint B: ${zjB.turnsZero}/${zjB.turnsTotal} (${(zjB.turnsZero/Math.max(1,zjB.turnsTotal)*100).toFixed(1)}%)`);
  console.log(`Sparse→B    : ${bSparse}/${groupB.length} (${(bSparse/Math.max(1,groupB.length)*100).toFixed(1)}% of Group B have sparse pattern)`);
  console.log(`============================================================`);

  fs.writeFileSync('tail_telemetry.json', JSON.stringify({
    summary: { numGames, durationMs, mean, p90, p95, maxV, minV, med,
      groupSub16: groupSub16.length, groupA: groupA.length,
      groupB: groupB.length, groupOver35: groupOver35.length },
    bước1_reasons: reasonCountsB,
    bước2_sparse: { sparseGames: sparseGames.length, denseGames: denseGames.length,
      mixedGames: mixedGames.length, sparsePatternStats },
    bước3_coverage: { bSparse, bDense, bMixed, totalB: groupB.length },
    bước4_zeroJoint: { groupA: zjA, groupB: zjB },
    bước5_convergence: { groupA: convA, groupB: convB }
  }, null, 2));

  console.log(`Telemetry saved → tail_telemetry.json`);
  console.log(`============================================================\n`);
}

const count = parseInt(process.argv[2] || '500', 10);
runTailDiagnosis(count);
