import fs from "fs";
let solverCode = fs.readFileSync("./solver.js", "utf-8");
solverCode = solverCode.replace(/score \+= entropy \* 1000;/g, "score += entropy * 8000;");
solverCode = solverCode.replace(/score \+= pTarget \* 30000;/g, "score += pTarget * 20000;");
solverCode = solverCode.replace(/if \(isLatticePoint\) score \+= 350 \* exploreWeight;/g, "if (isLatticePoint) score += 1000 * exploreWeight;");
fs.writeFileSync("./solver_test.js", solverCode);

import { generateRandomPracticeBoard, solveDesertGrid } from "./solver_test.js";
async function runSimulations() {
  let totalShovels = 0;
  let maxShovels = 0;
  let NUM_GAMES = 500;
  
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

