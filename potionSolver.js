/**
 * Sunflower Land - Potion House Mastermind Solver
 * Information-Theoretic Entropy & Minimax Optimization Engine
 */

export const POTIONS = [
  { id: 0, name: "Bloom Boost", color: "orange", viName: "Tăng Trưởng Hoa", iconUrl: "img/potion/orange_bottle.webp" },
  { id: 1, name: "Dream Drip", color: "mustard", viName: "Giọt Mơ Mộng", iconUrl: "img/potion/mustard_bottle.webp" },
  { id: 2, name: "Earth Essence", color: "pink", viName: "Tinh Hoa Đất", iconUrl: "img/potion/pink_bottle.webp" },
  { id: 3, name: "Flower Power", color: "black", viName: "Sức Mạnh Hoa", iconUrl: "img/potion/black_bottle.webp" },
  { id: 4, name: "Silver Syrup", color: "white", viName: "Siro Bạc", iconUrl: "img/potion/white_bottle.webp" },
  { id: 5, name: "Happy Hooch", color: "blue", viName: "Rượu Vui Vẻ", iconUrl: "img/potion/blue_bottle.webp" },
  { id: 6, name: "Organic Oasis", color: "green", viName: "Ốc Đảo Hữu Cơ", iconUrl: "img/potion/green_bottle.webp" }
];

export const POTION_NAME_TO_ID = {};
POTIONS.forEach(p => {
  POTION_NAME_TO_ID[p.name] = p.id;
  POTION_NAME_TO_ID[p.name.toLowerCase()] = p.id;
});

export const STATUS_ICONS = {
  bomb: "img/potion/angry.png",
  incorrect: "img/potion/sad.png",
  almost: "img/potion/neutral.png",
  correct: "img/potion/happy.png"
};

export const STATUS_LABELS = {
  correct: "Đúng vị trí",
  almost: "Sai vị trí",
  incorrect: "Không có",
  bomb: "Nổ (Không có)"
};

// All 7^4 = 2401 combinations
export const ALL_COMBINATIONS = (function() {
  const combos = [];
  function recurse(curr) {
    if (curr.length === 4) {
      combos.push([...curr]);
      return;
    }
    for (let i = 0; i < 7; i++) {
      curr.push(i);
      recurse(curr);
      curr.pop();
    }
  }
  recurse([]);
  return combos;
})();

/**
 * Checks if a candidate secret combination is compatible with a previous guess and its feedback statuses
 */
export function isCandidateCompatible(candidate, guess, statuses) {
  for (let l = 0; l < 4; l++) {
    const st = statuses[l];
    if ((st === "bomb" || st === "incorrect") && candidate.includes(guess[l])) {
      return false;
    }
  }
  for (let l = 0; l < 4; l++) {
    if (statuses[l] === "correct" && candidate[l] !== guess[l]) {
      return false;
    }
  }
  for (let l = 0; l < 4; l++) {
    if (statuses[l] === "almost") {
      const bottle = guess[l];
      if (candidate[l] === bottle) return false;
      if (!candidate.includes(bottle)) return false;
    }
  }
  return true;
}

/**
 * Simulate game feedback between a secret code and a guess
 */
export function simulateFeedback(guess, secret) {
  const res = [];
  for (let l = 0; l < 4; l++) {
    if (guess[l] === secret[l]) {
      res.push("correct");
    } else if (secret.includes(guess[l])) {
      res.push("almost");
    } else {
      res.push("incorrect");
    }
  }
  return res;
}

/**
 * Filter down remaining candidates given a guess and feedback
 */
export function filterCandidates(candidates, guess, statuses) {
  return candidates.filter(cand => isCandidateCompatible(cand, guess, statuses));
}

/**
 * Evaluates how effectively a test guess partitions the candidate space (Minimax + Shannon Entropy)
 */
export function evaluateGuess(guess, remainingCandidates) {
  if (remainingCandidates.length === 0) return { maxPart: 0, entropy: 0 };
  
  const partitionMap = {};
  const sampleLimit = Math.min(remainingCandidates.length, 500);
  const step = Math.max(1, Math.floor(remainingCandidates.length / sampleLimit));
  
  for (let s = 0; s < remainingCandidates.length; s += step) {
    const key = simulateFeedback(guess, remainingCandidates[s]).join("|");
    partitionMap[key] = (partitionMap[key] || 0) + 1;
  }
  
  const counts = Object.values(partitionMap);
  const total = counts.reduce((a, b) => a + b, 0);
  const maxPart = Math.max(...counts);
  let entropy = 0;
  for (const c of counts) {
    const p = c / total;
    entropy -= p * Math.log2(p);
  }
  return { maxPart, entropy };
}

/**
 * Select the mathematically optimal next guess
 */
export function getOptimalNextGuess(remainingCandidates) {
  if (remainingCandidates.length === ALL_COMBINATIONS.length) {
    // Round 1 optimal opening: 4 distinct potions [0, 1, 2, 3]
    return [0, 1, 2, 3];
  }
  if (remainingCandidates.length === 1) {
    return remainingCandidates[0];
  }
  
  const pool = remainingCandidates.length > 50 ? ALL_COMBINATIONS : remainingCandidates;
  let sample = [];
  if (pool.length <= 400) {
    sample = pool;
  } else {
    for (let i = 0; i < 400; i++) {
      sample.push(pool[Math.floor(Math.random() * pool.length)]);
    }
  }
  
  let bestGuess = sample[0];
  let bestScore = { maxPart: 99999, entropy: -99999 };
  
  for (const g of sample) {
    const score = evaluateGuess(g, remainingCandidates);
    if (score.maxPart < bestScore.maxPart || (score.maxPart === bestScore.maxPart && score.entropy > bestScore.entropy)) {
      bestScore = score;
      bestGuess = g;
    }
  }
  
  return bestGuess;
}

/**
 * Solve or update current Potion House state from game attempts
 */
export function solvePotionHouse(attempts = [], gameStatus = "in_progress") {
  if (gameStatus === "finished") {
    return {
      status: "finished",
      round: attempts.length,
      candidates: [],
      suggestedGuess: null,
      message: "Xuất sắc! Thí nghiệm Potion House đã hoàn thành thành công."
    };
  }

  let candidates = [...ALL_COMBINATIONS];

  for (const attempt of attempts) {
    if (!Array.isArray(attempt) || attempt.length !== 4) continue;
    
    // Map bottle names to IDs
    const guess = attempt.map(item => {
      if (typeof item === "number") return item;
      if (typeof item?.potion === "string") return POTION_NAME_TO_ID[item.potion] ?? 0;
      if (typeof item?.name === "string") return POTION_NAME_TO_ID[item.name] ?? 0;
      return 0;
    });

    const statuses = attempt.map(item => item?.status || "incorrect");
    candidates = filterCandidates(candidates, guess, statuses);
  }

  const round = attempts.length + 1;

  if (candidates.length === 0) {
    return {
      status: "error",
      round,
      candidates: [],
      suggestedGuess: null,
      message: "Không tìm thấy tổ hợp nào phù hợp với lịch sử pha chế! Hãy kiểm tra lại dữ liệu."
    };
  }

  const suggestedGuess = getOptimalNextGuess(candidates);

  return {
    status: "in_progress",
    round,
    candidates,
    suggestedGuess,
    message: `Mục tiêu Lượt ${round}. Hãy dùng 4 bình gợi ý tối ưu bên dưới!`
  };
}

/**
 * Demo / Practice mode helper
 */
export function createDemoGame() {
  // Pick random secret combination of 4 potions
  const secret = [
    Math.floor(Math.random() * 7),
    Math.floor(Math.random() * 7),
    Math.floor(Math.random() * 7),
    Math.floor(Math.random() * 7)
  ];

  return {
    secret,
    attempts: [],
    status: "in_progress",
    reward: 100,
    multiplier: 1
  };
}

export function playDemoTurn(demoGame, guess) {
  if (demoGame.status === "finished") return demoGame;

  const statuses = simulateFeedback(guess, demoGame.secret);
  const attempt = guess.map((pid, idx) => ({
    potion: POTIONS[pid].name,
    status: statuses[idx]
  }));

  demoGame.attempts.push(attempt);

  const isWin = statuses.every(s => s === "correct");
  if (isWin || demoGame.attempts.length >= 3) {
    demoGame.status = "finished";
    demoGame.reward = isWin ? (4 - demoGame.attempts.length) * 100 : 0;
  }

  return demoGame;
}
