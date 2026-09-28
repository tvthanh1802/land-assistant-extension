import { solveDesertGrid, getPatternDefinitions } from "./solver.js";


const payload = {
  grid: [{x: 0, y: 0, items: {Sand: 1}}],
  patterns: ["ARTEFACT_TWENTY", "ARTEFACT_TWENTY_ONE", "ARTEFACT_TWENTY_TWO"],
  completedPatterns: []
};

try {
  const result = solveDesertGrid(payload, "Ascension Age");
  console.log("SUCCESS! Best Next Dig:", result.bestNextDig);
} catch (e) {
  console.error("ERROR:", e);
}
