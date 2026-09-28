import fs from "fs";
let solverCode = fs.readFileSync("./solver.js", "utf-8");
solverCode = solverCode.replace(/score \+= entropy \* 1000;/g, "score += entropy * 5000;");
solverCode = solverCode.replace(/score \+= pTarget \* 30000;/g, "score += pTarget * 20000;");
solverCode = solverCode.replace(/if \(isLatticePoint\) score \+= 350 \* exploreWeight;/g, "if (isLatticePoint) score += 1000 * exploreWeight;");
fs.writeFileSync("./solver_test.js", solverCode);

