/*! SFL Assistant - Pet Food List Engine & Database */
import { COOKING_RECIPES, getItemPrice, computeAllCookingCosts, getItemIcon } from "./market.js";

export const PET_FOOD_CATEGORIES = {
  easy: {
    key: "easy",
    title: "EASY FOODS",
    energy: 20,
    xp: 20,
    foods: [
      "Rhubarb Tart",
      "Mashed Potato",
      "Pumpkin Soup",
      "Reindeer Carrot",
      "Bumpkin Broth",
      "Quick Juice",
      "Fruit Salad",
      "Carrot Juice",
      "Sunflower Crunch",
      "Roast Veggies",
      "Popcorn",
      "Purple Smoothie",
      "Club Sandwich",
      "Cheese"
    ]
  },
  medium: {
    key: "medium",
    title: "MEDIUM FOODS",
    energy: 100,
    xp: 100,
    foods: [
      "Sauerkraut",
      "Fermented Carrots",
      "Cabbers n Mash",
      "Fried Tofu",
      "Orange Juice",
      "Apple Juice",
      "Blueberry Jam",
      "Cauliflower Burger",
      "Sour Shake",
      "Bumpkin Detox",
      "Bumpkin Salad",
      "Kale Stew",
      "Fancy Fries",
      "Boiled Eggs",
      "Goblin's Treat",
      "Power Smoothie",
      "Bumpkin ganoush",
      "Tofu Scramble",
      "Cornbread",
      "Apple Pie",
      "Pumpkin Cake",
      "Orange Cake",
      "Potato Cake",
      "Sunflower Cake",
      "Carrot Cake",
      "Pancakes"
    ]
  },
  hard: {
    key: "hard",
    title: "HARD FOODS",
    energy: 300,
    xp: 300,
    foods: [
      "The Lot",
      "Banana Blast",
      "Bumpkin Roast",
      "Steamed Red Rice",
      "Cabbage Cake",
      "Kale Omelette",
      "Caprese Salad",
      "Blue Cheese",
      "Eggplant Cake",
      "Radish Cake",
      "Antipasto",
      "Cauliflower Cake",
      "Wheat Cake",
      "Grape Juice",
      "Beetroot Cake",
      "Parsnip Cake",
      "Rice Bun",
      "Goblin Brunch",
      "Spaghetti al Limone",
      "Honey Cake",
      "Honey Cheddar",
      "Pizza Margherita",
      "Lemon Cheesecake",
      "Slow Juice"
    ]
  }
};

const STORAGE_KEY_FOOD_SELECTED = "sfl_pet_food_selected";
const STORAGE_KEY_FOOD_SORT = "sfl_pet_food_sort";
const STORAGE_KEY_FOOD_MAX_COST = "sfl_pet_food_max_cost";

export function loadFoodSelections() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FOOD_SELECTED);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (_) {}
  
  // Default selections matching sfl-calculator.com:
  // Easy: first 10
  // Medium: first 16
  // Hard: first 4
  const defaults = {};
  PET_FOOD_CATEGORIES.easy.foods.forEach((name, idx) => {
    defaults[name] = idx < 10;
  });
  PET_FOOD_CATEGORIES.medium.foods.forEach((name, idx) => {
    defaults[name] = idx < 16;
  });
  PET_FOOD_CATEGORIES.hard.foods.forEach((name, idx) => {
    defaults[name] = idx < 4;
  });
  return defaults;
}

export function saveFoodSelections(selections) {
  try {
    localStorage.setItem(STORAGE_KEY_FOOD_SELECTED, JSON.stringify(selections));
  } catch (_) {}
}

export function loadFoodSort() {
  try {
    return localStorage.getItem(STORAGE_KEY_FOOD_SORT) || "lowest";
  } catch (_) {
    return "lowest";
  }
}

export function saveFoodSort(sort) {
  try {
    localStorage.setItem(STORAGE_KEY_FOOD_SORT, sort);
  } catch (_) {}
}

export function loadMaxCostInput() {
  try {
    return localStorage.getItem(STORAGE_KEY_FOOD_MAX_COST) || "";
  } catch (_) {
    return "";
  }
}

export function saveMaxCostInput(val) {
  try {
    localStorage.setItem(STORAGE_KEY_FOOD_MAX_COST, val);
  } catch (_) {}
}

export function getCalculatedFoodList(tierKey, priceMap, cookingCosts, selections, sortBy = "lowest") {
  const cat = PET_FOOD_CATEGORIES[tierKey];
  if (!cat) return [];

  const list = cat.foods.map(name => {
    const cost = getItemPrice(name, priceMap, cookingCosts) || 0;
    const costPerEnergy = cat.energy > 0 ? cost / cat.energy : 0;
    const isSelected = selections[name] !== undefined ? !!selections[name] : true;
    const image = getItemIcon(name);
    return {
      name,
      cost,
      costPerEnergy,
      energy: cat.energy,
      xp: cat.xp,
      isSelected,
      image
    };
  });

  // Sorting
  if (sortBy === "alphabetical") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "highest") {
    list.sort((a, b) => {
      if (a.costPerEnergy === 0 && b.costPerEnergy > 0) return 1;
      if (b.costPerEnergy === 0 && a.costPerEnergy > 0) return -1;
      return b.costPerEnergy - a.costPerEnergy;
    });
  } else {
    // "lowest" is default
    list.sort((a, b) => {
      if (a.costPerEnergy === 0 && b.costPerEnergy > 0) return 1;
      if (b.costPerEnergy === 0 && a.costPerEnergy > 0) return -1;
      return a.costPerEnergy - b.costPerEnergy;
    });
  }

  return list;
}
