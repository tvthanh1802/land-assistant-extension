import { generateRandomPracticeBoard, solveDesertGrid } from "./solver_test.js";
async function runSimulations() {
  let totalShovels = 0;
  let maxShovels = 0;
  let NUM_GAMES = 50;
  
  for (let i = 0; i < NUM_GAMES; i++) {
    const game = generateRandomPracticeBoard("Ascension Age");
    let digs = [];
    let shovels = 0;
    while(true) {
      const completed = [];
      for (const form of game.secretBoardPlacements) {
        const allDug = form.tiles.every(t => digs.some(d => d.x === t.x && d.y === t.y));
        if (allDug) completed.push(form.patternName);
      }
      
      const payload = { grid: digs, patterns: game.allPatternsToday, completedPatterns: completed };
      const res = solveDesertGrid(payload, "Ascension Age");
      
      if (res.isAllCompleted) {
        totalShovels += shovels;
        if (shovels > maxShovels) maxShovels = shovels;
        break;
      }
      
      const next = res.bestNextDig;
      if (!next) break;
      const item = game.secretBoard[next.key] || "Sand";
      digs.push({ x: next.x, y: next.y, items: { [item]: 1 } });
      shovels++;
    }
  }
  console.log(`Avg: ${(totalShovels/NUM_GAMES).toFixed(2)}, Max: ${maxShovels}`);
}
runSimulations();

