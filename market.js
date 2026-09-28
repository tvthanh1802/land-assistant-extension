/*!
 * Sunflower Land Assistant - Market & Economy Engine
 * Real-time direct Google Sheets integration, DexScreener rates & P2P Engine:
 * 1. Live Google Sheets CSV synchronization (Crops, Minerals, Animals, Emblems, NFTs)
 * 2. Multi-directory smart image resolver (delivery, food, cakes, plaza, resources, tools, treasures)
 * 3. Tasks / Delivery orders profit analyzer
 * 4. Coin to SFL conversion rates (Best Rate)
 * 5. Farm inventory valuation
 * 6. Resource mining & woodcutting profit calculator
 */

export const BASE_CROPS = [
  { name: "Apple", img: "img/delivery/Apple.png", baseSale: 25, skillBonusApplies: false, category: "fruit" },
  { name: "Banana", img: "img/delivery/Banana.png", baseSale: 25, skillBonusApplies: false, category: "fruit" },
  { name: "Orange", img: "img/delivery/Orange.png", baseSale: 18, skillBonusApplies: false, category: "fruit" },
  { name: "Blueberry", img: "img/delivery/Blueberry.png", baseSale: 12, skillBonusApplies: true, category: "fruit" },
  { name: "Tomato", img: "img/delivery/Tomato.png", baseSale: 2, skillBonusApplies: false, category: "fruit" },
  { name: "Lemon", img: "img/delivery/Lemon.png", baseSale: 6, skillBonusApplies: false, category: "fruit" },
  { name: "Grape", img: "img/delivery/Grape.webp", baseSale: 240, skillBonusApplies: false, category: "greenhouse" },
  { name: "Rice", img: "img/delivery/Rice.png", baseSale: 320, skillBonusApplies: false, category: "greenhouse" },
  { name: "Olive", img: "img/delivery/Olive.png", baseSale: 400, skillBonusApplies: false, category: "greenhouse" },
  { name: "Duskberry", img: "img/delivery/Duskberry.png", baseSale: 1000, skillBonusApplies: false, category: "flower" },
  { name: "Lunara", img: "img/delivery/Lunara.png", baseSale: 500, skillBonusApplies: false, category: "flower" },
  { name: "Celestine", img: "img/delivery/Celestine.png", baseSale: 200, skillBonusApplies: false, category: "flower" },
  { name: "Sunflower", img: "img/delivery/Sunflower.png", baseSale: 0.02, skillBonusApplies: true, category: "crop" },
  { name: "Potato", img: "img/delivery/Potato.png", baseSale: 0.14, skillBonusApplies: true, category: "crop" },
  { name: "Pumpkin", img: "img/delivery/Pumpkin.png", baseSale: 0.4, skillBonusApplies: true, category: "crop" },
  { name: "Carrot", img: "img/delivery/Carrot.png", baseSale: 0.8, skillBonusApplies: true, category: "crop" },
  { name: "Cabbage", img: "img/delivery/Cabbage.png", baseSale: 1.5, skillBonusApplies: true, category: "crop" },
  { name: "Beetroot", img: "img/delivery/Beetroot.png", baseSale: 2.8, skillBonusApplies: true, category: "crop" },
  { name: "Cauliflower", img: "img/delivery/Cauliflower.png", baseSale: 4.25, skillBonusApplies: true, category: "crop" },
  { name: "Parsnip", img: "img/delivery/Parsnip.png", baseSale: 6.5, skillBonusApplies: true, category: "crop" },
  { name: "Eggplant", img: "img/delivery/Eggplant.png", baseSale: 8, skillBonusApplies: true, category: "crop" },
  { name: "Corn", img: "img/delivery/Corn.png", baseSale: 9, skillBonusApplies: true, category: "crop" },
  { name: "Radish", img: "img/delivery/Radish.png", baseSale: 9.5, skillBonusApplies: true, category: "crop" },
  { name: "Wheat", img: "img/delivery/Wheat.png", baseSale: 7, skillBonusApplies: true, category: "crop" },
  { name: "Kale", img: "img/delivery/Kale.png", baseSale: 10, skillBonusApplies: true, category: "crop" },
  { name: "Soybean", img: "img/delivery/Soybean.png", baseSale: 2.3, skillBonusApplies: true, category: "crop" },
  { name: "Barley", img: "img/delivery/Barley.png", baseSale: 12, skillBonusApplies: true, category: "crop" },
  { name: "Rhubarb", img: "img/delivery/Rhubarb.png", baseSale: 0.24, skillBonusApplies: true, category: "crop" },
  { name: "Zucchini", img: "img/delivery/Zucchini.png", baseSale: 0.4, skillBonusApplies: true, category: "crop" },
  { name: "Yam", img: "img/delivery/Yam.png", baseSale: 0.8, skillBonusApplies: true, category: "crop" },
  { name: "Broccoli", img: "img/delivery/Broccoli.png", baseSale: 1.5, skillBonusApplies: true, category: "crop" },
  { name: "Pepper", img: "img/delivery/Pepper.png", baseSale: 3, skillBonusApplies: true, category: "crop" },
  { name: "Onion", img: "img/delivery/Onion.png", baseSale: 10, skillBonusApplies: true, category: "crop" },
  { name: "Turnip", img: "img/delivery/Turnip.png", baseSale: 8, skillBonusApplies: true, category: "crop" },
  { name: "Artichoke", img: "img/delivery/Artichoke.png", baseSale: 12, skillBonusApplies: true, category: "crop" }
];

// Complete Official Sunflower Land cooking recipes and ingredients
export const COOKING_RECIPES = {
  "Furikake Sprinkle": { "Fish Flake": 1, "Seaweed": 1 },
  "Mashed Potato": { "Potato": 8 },
  "Pumpkin Soup": { "Pumpkin": 10 },
  "Reindeer Carrot": { "Carrot": 5 },
  "Mushroom Soup": { "Wild Mushroom": 5 },
  "Popcorn": { "Sunflower": 100, "Corn": 5 },
  "Bumpkin Broth": { "Carrot": 10, "Cabbage": 5 },
  "Cabbers n Mash": { "Mashed Potato": 10, "Cabbage": 20 },
  "Boiled Eggs": { "Egg": 10 },
  "Kale Stew": { "Kale": 10 },
  "Kale Omelette": { "Egg": 40, "Kale": 5 },
  "Gumbo": { "Potato": 50, "Pumpkin": 30, "Carrot": 20, "Red Snapper": 3 },
  "Rapid Roast": { "Magic Mushroom": 1, "Pumpkin": 40 },
  "Saltbite": { "Saltwort": 10 },
  "Fried Tofu": { "Soybean": 15, "Sunflower": 200 },
  "Rice Bun": { "Rice": 2, "Wheat": 50 },
  "Antipasto": { "Olive": 2, "Grape": 2 },
  "Pizza Margherita": { "Tomato": 30, "Cheese": 5, "Wheat": 20 },
  "Rhubarb Tart": { "Rhubarb": 3 },
  "Surimi Rice Bowl": { "Fish Stick": 1, "Rice": 1, "Onion": 1 },
  "Creamy Crab Bite": { "Crab Stick": 1, "Cheese": 3 },
  "Crimstone Infused Fish Oil": { "Fish Oil": 1, "Crimstone": 1 },
  "Sunflower Crunch": { "Sunflower": 300 },
  "Mushroom Jacket Potatoes": { "Wild Mushroom": 10, "Potato": 5 },
  "Fruit Salad": { "Apple": 1, "Orange": 1, "Blueberry": 1 },
  "Pancakes": { "Wheat": 10, "Egg": 10, "Honey": 6 },
  "Roast Veggies": { "Cauliflower": 15, "Carrot": 10 },
  "Cauliflower Burger": { "Cauliflower": 15, "Wheat": 5 },
  "Club Sandwich": { "Sunflower": 100, "Carrot": 25, "Wheat": 5 },
  "Bumpkin Salad": { "Beetroot": 20, "Parsnip": 10 },
  "Bumpkin ganoush": { "Eggplant": 30, "Potato": 50, "Parsnip": 10 },
  "Goblin's Treat": { "Pumpkin": 10, "Radish": 20, "Cabbage": 10 },
  "Chowder": { "Beetroot": 10, "Wheat": 10, "Parsnip": 5, "Anchovy": 3 },
  "Bumpkin Roast": { "Mashed Potato": 20, "Roast Veggies": 5 },
  "Goblin Brunch": { "Boiled Eggs": 5 },
  "Beetroot Blaze": { "Magic Mushroom": 2, "Beetroot": 50 },
  "Steamed Red Rice": { "Rice": 3, "Beetroot": 50 },
  "Tofu Scramble": { "Soybean": 20, "Egg": 20, "Cauliflower": 10 },
  "Fried Calamari": { "Sunflower": 200, "Wheat": 15, "Squid": 1 },
  "Fish Burger": { "Beetroot": 10, "Wheat": 10, "Horse Mackerel": 1 },
  "Fish Omelette": { "Egg": 40, "Surgeonfish": 1, "Butterflyfish": 2 },
  "Ocean's Olive": { "Olive Flounder": 1, "Olive": 2 },
  "Seafood Basket": { "Blowfish": 2, "Napoleanfish": 2, "Sunfish": 2 },
  "Fish n Chips": { "Fancy Fries": 1, "Halibut": 1 },
  "Sushi Roll": { "Angelfish": 1, "Seaweed": 1, "Rice": 2 },
  "Caprese Salad": { "Cheese": 1, "Tomato": 25, "Kale": 20 },
  "Spaghetti al Limone": { "Wheat": 10, "Lemon": 15, "Cheese": 3 },
  "Apple Pie": { "Apple": 5, "Wheat": 10, "Egg": 20 },
  "Orange Cake": { "Orange": 5, "Egg": 30, "Wheat": 10 },
  "Kale & Mushroom Pie": { "Wild Mushroom": 10, "Kale": 5, "Wheat": 5 },
  "Sunflower Cake": { "Sunflower": 1000, "Wheat": 10, "Egg": 30 },
  "Honey Cake": { "Honey": 10, "Wheat": 10, "Egg": 20 },
  "Potato Cake": { "Potato": 500, "Wheat": 10, "Egg": 30 },
  "Pumpkin Cake": { "Pumpkin": 130, "Wheat": 10, "Egg": 30 },
  "Cornbread": { "Corn": 15, "Wheat": 5, "Egg": 10 },
  "Carrot Cake": { "Carrot": 120, "Wheat": 10, "Egg": 30 },
  "Cabbage Cake": { "Cabbage": 90, "Wheat": 10, "Egg": 30 },
  "Beetroot Cake": { "Beetroot": 100, "Wheat": 10, "Egg": 30 },
  "Cauliflower Cake": { "Cauliflower": 60, "Wheat": 10, "Egg": 30 },
  "Parsnip Cake": { "Parsnip": 45, "Wheat": 10, "Egg": 30 },
  "Eggplant Cake": { "Eggplant": 30, "Wheat": 10, "Egg": 30 },
  "Radish Cake": { "Radish": 25, "Wheat": 10, "Egg": 30 },
  "Wheat Cake": { "Wheat": 35, "Egg": 30 },
  "Lemon Cheesecake": { "Lemon": 20, "Cheese": 5, "Egg": 40 },
  "Blueberry Jam": { "Blueberry": 5 },
  "Fermented Carrots": { "Carrot": 20 },
  "Sauerkraut": { "Cabbage": 20 },
  "Fancy Fries": { "Sunflower": 500, "Potato": 500 },
  "Fermented Fish": { "Tuna": 6 },
  "Shroom Syrup": { "Magic Mushroom": 3, "Honey": 20 },
  "Cheese": { "Milk": 3 },
  "Blue Cheese": { "Cheese": 2, "Blueberry": 10 },
  "Honey Cheddar": { "Cheese": 3, "Honey": 5 },
  "Purple Smoothie": { "Blueberry": 5, "Cabbage": 10 },
  "Orange Juice": { "Orange": 5 },
  "Apple Juice": { "Apple": 5 },
  "Power Smoothie": { "Blueberry": 10, "Kale": 5 },
  "Bumpkin Detox": { "Apple": 5, "Orange": 5, "Carrot": 10 },
  "Banana Blast": { "Banana": 10, "Egg": 10 },
  "Grape Juice": { "Grape": 5, "Radish": 20 },
  "The Lot": { "Blueberry": 1, "Orange": 1, "Grape": 1, "Apple": 1, "Banana": 1 },
  "Carrot Juice": { "Carrot": 30 },
  "Quick Juice": { "Sunflower": 50, "Pumpkin": 40 },
  "Slow Juice": { "Grape": 10, "Kale": 100 },
  "Sour Shake": { "Lemon": 20 },
};

const ITEM_LOOKUP = {
  "ammoniteshell": "img/treasures/Ammonite Shell.png",
  "anchovy": "img/fish/anchovy.png",
  "ancientclock": "img/treasures/Ancient Clock.png",
  "angelfish": "img/fish/angel_fish.png",
  "angry": "img/potion/angry.png",
  "antipasto": "img/food/antipasto.webp",
  "apple": "img/delivery/Apple.png",
  "applejuice": "img/food/apple_juice.png",
  "applepie": "img/food/apple_pie.png",
  "artichoke": "img/delivery/Artichoke.png",
  "axe": "img/tools/axe.png",
  "banana": "img/delivery/Banana.png",
  "bananablast": "img/food/banana_blast.png",
  "barley": "img/delivery/Barley.png",
  "barredknifejaw": "img/fish/barred_knifejaw.png",
  "battlefish": "img/fish/battle_fish.webp",
  "beetroot": "img/delivery/Beetroot.png",
  "beetrootblaze": "img/food/beetroot_blaze.png",
  "beetrootcake": "img/food/cakes/beetroot_cake.png",
  "betty": "img/plaza/betty.png",
  "blackbottle": "img/potion/black_bottle.webp",
  "blacksmith": "img/plaza/blacksmith.png",
  "bloomseed": "img/flowers/bloom_seed.webp",
  "blowfish": "img/fish/blowfish.png",
  "blueballoonflower": "img/delivery/Blue Balloon Flower.png",
  "blueberry": "img/delivery/Blueberry.png",
  "blueberryjam": "img/food/blueberry_jam.png",
  "bluebottle": "img/potion/blue_bottle.webp",
  "bluecarnation": "img/flowers/Blue Carnation.png",
  "bluecheese": "img/food/blue_cheese.webp",
  "blueclover": "img/flowers/Blue Clover.png",
  "bluecosmos": "img/delivery/Blue Cosmos.png",
  "bluedaffodil": "img/flowers/Blue Daffodil.png",
  "blueedelweiss": "img/flowers/Blue Edelweiss.png",
  "bluegladiolus": "img/flowers/Blue Gladiolus.png",
  "bluelavender": "img/flowers/Blue Lavender.png",
  "bluelotus": "img/flowers/Blue Lotus.png",
  "bluemarlin": "img/fish/blue_marlin.png",
  "bluepansy": "img/flowers/Blue Pansy.png",
  "boiledeggs": "img/food/boiled_eggs.png",
  "broccoli": "img/delivery/Broccoli.png",
  "brokenpillar": "img/treasures/Broken Pillar.png",
  "bumpkinbroth": "img/food/bumpkin_broth.png",
  "bumpkindetox": "img/food/bumpkin_detox.png",
  "bumpkinganoush": "img/food/bumpkin_ganoush.png",
  "bumpkinroast": "img/food/bumpkin_roast.png",
  "bumpkinsalad": "img/food/bumpkin_salad.png",
  "butterflyfish": "img/delivery/Butterflyfish.png",
  "cabbage": "img/delivery/Cabbage.png",
  "cabbagecake": "img/food/cakes/cabbage_cake.png",
  "cabbersnmash": "img/food/cabbers_n_mash.png",
  "camelbone": "img/resources/camel_bone.webp",
  "caponata": "img/food/caponata.webp",
  "capresesalad": "img/food/caprese_salad.webp",
  "carrot": "img/delivery/Carrot.png",
  "carrotcake": "img/food/cakes/carrot_cake.png",
  "carrotjuice": "img/food/carrot_juice.webp",
  "carrotsandwich": "img/food/carrot_sandwich.png",
  "cauliflower": "img/delivery/Cauliflower.png",
  "cauliflowerburger": "img/food/cauliflower_burger.png",
  "cauliflowercake": "img/food/cakes/cauliflower_cake.png",
  "celestialfrostbloom": "img/flowers/Celestial Frostbloom.png",
  "celestine": "img/delivery/Celestine.png",
  "chamomile": "img/flowers/chamomile.webp",
  "cheese": "img/food/cheese.webp",
  "chickendrumstick": "img/food/chicken_drumstick.png",
  "chowder": "img/food/chowder.png",
  "clamshell": "img/treasures/Clam Shell.png",
  "cloverseed": "img/flowers/clover_seed.webp",
  "clownfish": "img/fish/clownfish.png",
  "clubsandwich": "img/food/club_sandwich.png",
  "cockleshell": "img/resources/cockle_shell.webp",
  "coelacanth": "img/fish/coelacanth.png",
  "coin": "img/coin.png",
  "copia": "img/fish/copia.png",
  "coprolite": "img/treasures/Coprolite.png",
  "coral": "img/treasures/Coral.png",
  "corale": "img/plaza/corale.png",
  "corn": "img/delivery/Corn.png",
  "cornbread": "img/food/corn_bread.png",
  "cowfish": "img/fish/cow_fish.webp",
  "cowfishtrophy": "img/fish/cow_fish_trophy.webp",
  "cowskull": "img/resources/cow_skull.png",
  "crab": "img/delivery/Crab.png",
  "crimsoncarp": "img/fish/crimson_carp.png",
  "crimsoncarptrophy": "img/fish/crimson_carp_trophy.png",
  "crimstone": "img/delivery/Crimstone.png",
  "duskberry": "img/delivery/Duskberry.png",
  "edelweissseed": "img/flowers/edelweiss_seed.webp",
  "egg": "img/delivery/Egg.png",
  "eggplant": "img/delivery/Eggplant.png",
  "eggplantcake": "img/food/cakes/eggplant_cake.png",
  "empty": "img/flowers/empty.webp",
  "emptyflowerbed": "img/flowers/empty_flowerbed.webp",
  "fancyfries": "img/food/fancy_fries.png",
  "feather": "img/resources/feather.png",
  "fermentedcarrots": "img/food/fermented_carrots.png",
  "fermentedfish": "img/food/fermented_fish.png",
  "fishandchips": "img/food/fish_and_chips.webp",
  "fishburger": "img/food/fish_burger.webp",
  "fishomelette": "img/food/fish_omelette.webp",
  "flower": "img/Flower.png",
  "flowerbedmodal": "img/flowers/flower_bed_modal.png",
  "footballfish": "img/fish/football_fish.png",
  "friedcalamari": "img/food/fried_calamari.webp",
  "friedtofu": "img/food/fried_tofu.png",
  "fruitsalad": "img/food/fruit_salad.png",
  "gambit": "img/plaza/gambit.png",
  "gildedswordfish": "img/fish/gilded_swordfish.png",
  "gildedswordfishtrophy": "img/fish/gilded_swordfish_trophy.png",
  "gladiolusseed": "img/flowers/gladiolus_seed.webp",
  "glazedcarrots": "img/food/glazed_carrots.webp",
  "goblinbrunch": "img/food/goblin_brunch.png",
  "goblinstreat": "img/food/goblins_treat.png",
  "gold": "img/delivery/Gold.png",
  "goldpickaxe": "img/tools/gold_pickaxe.png",
  "gordo": "img/plaza/gordo.png",
  "grape": "img/delivery/Grape.webp",
  "grapejuice": "img/food/grape_juice.webp",
  "grapeseed": "img/greenhouse/grape_seed.webp",
  "grayborder": "img/ui/gray_border.png",
  "greenbottle": "img/potion/green_bottle.webp",
  "grimbly": "img/plaza/grimbly.png",
  "grimtooth": "img/plaza/grimtooth.png",
  "grubnuk": "img/plaza/grubnuk.png",
  "gumbo": "img/food/gumbo.png",
  "guria": "img/plaza/guria.png",
  "halibut": "img/fish/halibut.png",
  "hammerheadshark": "img/fish/hammerhead_shark.png",
  "happy": "img/potion/happy.png",
  "hieroglyph": "img/resources/hieroglyph.webp",
  "honey": "img/delivery/Honey.png",
  "honeycake": "img/food/cakes/honey_cake.png",
  "honeychedder": "img/food/honey_chedder.webp",
  "honeycheddar": "img/food/honey_chedder.webp",
  "horsemackerel": "img/fish/horse_mackerel.png",
  "iron": "img/delivery/Iron.png",
  "ironpickaxe": "img/tools/iron_pickaxe.png",
  "jellyfish": "img/fish/jellyfish.webp",
  "kale": "img/delivery/Kale.png",
  "kaleomelette": "img/food/kale_omelette.png",
  "kalestew": "img/food/kale_stew.png",
  "lavenderseed": "img/flowers/lavender_seed.webp",
  "leather": "img/delivery/Leather.png",
  "lemon": "img/delivery/Lemon.png",
  "lemoncheesecake": "img/food/lemon_cheesecake.webp",
  "lemonshark": "img/fish/lemon_shark.webp",
  "lilyseed": "img/flowers/lily_seed.webp",
  "lunalist": "img/flowers/lunalist.webp",
  "lunara": "img/delivery/Lunara.png",
  "mahimahi": "img/fish/mahi_mahi.png",
  "mashedpotato": "img/food/mashed_potato.png",
  "mooncrystal": "img/treasures/Moon Crystal.png",
  "morayeel": "img/fish/moray_eel.png",
  "mushroomjacketpotato": "img/food/mushroom_jacket_potato.png",
  "mushroomjacketpotatoes": "img/food/mushroom_jacket_potato.png",
  "mushroomkalepie": "img/food/mushroom_kale_pie.png",
  "kale&mushroompie": "img/food/mushroom_kale_pie.png",
  "kalemushroompie": "img/food/mushroom_kale_pie.png",
  "mushroomsoup": "img/food/mushroom_soup.png",
  "muskellunge": "img/fish/muskellunge.png",
  "mustardbottle": "img/potion/mustard_bottle.webp",
  "napoleonfish": "img/fish/napoleonfish.png",
  "neutral": "img/potion/neutral.png",
  "oarfish": "img/fish/oarfish.png",
  "obsidian": "img/resources/obsidian.webp",
  "oceansolive": "img/food/oceans_olive.webp",
  "oil": "img/resources/oil.webp",
  "oilbarrel": "img/resources/oil_barrel.webp",
  "oldbottle": "img/treasures/Old Bottle.png",
  "oldsalty": "img/plaza/old-salty.png",
  "olive": "img/delivery/Olive.png",
  "oliveflounder": "img/fish/olive_flounder.png",
  "oliveseed": "img/greenhouse/olive_seed.webp",
  "onion": "img/delivery/Onion.png",
  "orange": "img/delivery/Orange.png",
  "orangebottle": "img/potion/orange_bottle.webp",
  "orangecake": "img/food/cakes/orange_cake.png",
  "orangejuice": "img/food/orange_juice.png",
  "otterpebble": "img/treasures/Otter Pebble.png",
  "paella": "img/food/paella.webp",
  "pancakes": "img/food/pancakes.png",
  "parrotfish": "img/fish/parrot_fish.png",
  "parsnip": "img/delivery/Parsnip.png",
  "parsnipcake": "img/food/cakes/parsnip_cake.png",
  "pearl": "img/treasures/Pearl.png",
  "peggy": "img/plaza/peggy.png",
  "pepper": "img/delivery/Pepper.png",
  "phantombarracuda": "img/fish/phantom_barracuda.png",
  "phantombarracudatrophy": "img/fish/phantom_barracuda_trophy.png",
  "pickaxe": "img/tools/wood_pickaxe.png",
  "pinkbottle": "img/potion/pink_bottle.webp",
  "pinkdolphin": "img/fish/pink_dolphin.webp",
  "pipi": "img/treasures/Pipi.png",
  "piratecake": "img/food/cakes/pirate_cake.webp",
  "pizzamarguerita": "img/food/pizza_marguerita.webp",
  "pizzamargherita": "img/food/pizza_marguerita.webp",
  "polygon": "img/polygon.png",
  "popcorn": "img/food/popcorn.png",
  "porgy": "img/fish/porgy.png",
  "potato": "img/delivery/Potato.png",
  "potatocake": "img/food/cakes/potato_cake.png",
  "potionnpc": "img/potion/potion_npc.png",
  "powersmoothie": "img/food/power_smoothie.png",
  "primulaenigma": "img/flowers/Primula Enigma.png",
  "prismpetal": "img/flowers/Prism Petal.png",
  "pumpkin": "img/delivery/Pumpkin.png",
  "pumpkincake": "img/food/cakes/pumpkin_cake.png",
  "pumpkinsoup": "img/food/pumpkin_soup.png",
  "purpleballoonflower": "img/flowers/Purple Balloon Flower.png",
  "purplecarnation": "img/flowers/Purple Carnation.png",
  "purpleclover": "img/flowers/Purple Clover.png",
  "purplecosmos": "img/flowers/Purple Cosmos.png",
  "purpledaffodil": "img/flowers/Purple Daffodil.png",
  "purpleedelweiss": "img/flowers/Purple Edelweiss.png",
  "purplegladiolus": "img/flowers/Purple Gladiolus.png",
  "purplelavender": "img/flowers/Purple Lavender.png",
  "purplelotus": "img/flowers/Purple Lotus.png",
  "purplepansy": "img/flowers/Purple Pansy.png",
  "purplesmoothie": "img/food/purple_smoothie.png",
  "quickjuice": "img/food/quick_juice.webp",
  "radiantray": "img/fish/radiant_ray.png",
  "radiantraytrophy": "img/fish/radiant_ray_trophy.png",
  "radish": "img/delivery/Radish.png",
  "radishcake": "img/delivery/Radish Cake.png",
  "radishpie": "img/food/radish_pie.png",
  "rapidroast": "img/food/rapid_roast.png",
  "ray": "img/fish/ray.png",
  "redballoonflower": "img/delivery/Red Balloon Flower.png",
  "redcarnation": "img/flowers/Red Carnation.png",
  "redclover": "img/flowers/Red Clover.png",
  "redcosmos": "img/flowers/Red Cosmos.png",
  "reddaffodil": "img/flowers/Red Daffodil.png",
  "rededelweiss": "img/flowers/Red Edelweiss.png",
  "redgladiolus": "img/flowers/Red Gladiolus.png",
  "redlavender": "img/flowers/Red Lavender.png",
  "redlotus": "img/flowers/Red Lotus.png",
  "redpansy": "img/flowers/Red Pansy.png",
  "redrice": "img/food/red_rice.webp",
  "steamedredrice": "img/food/red_rice.webp",
  "redsnapper": "img/fish/red_snapper.png",
  "reindeercarrot": "img/food/reindeer_carrot.png",
  "rhubarb": "img/delivery/Rhubarb.png",
  "rhubarbtart": "img/food/rhubarb_tart.webp",
  "rice": "img/delivery/Rice.png",
  "ricebun": "img/food/rice_bun.webp",
  "riceseed": "img/greenhouse/rice_seed.webp",
  "roastedcauliflower": "img/food/roasted_cauliflower.png",
  "roastveggies": "img/food/roast_veggies.png",
  "rockblackfish": "img/fish/rock_blackfish.png",
  "ronin": "img/ronin.png",
  "sad": "img/potion/sad.png",
  "saltbite": "img/food/antipasto.webp",
  "saltdinoegg": "img/treasures/Salt Dino Egg.png",
  "sand": "img/resources/sand.webp",
  "sanddrill": "img/treasures/Sand Drill.png",
  "sandshovel": "img/treasures/Sand Shovel.png",
  "sauerkraut": "img/food/sauerkraut.png",
  "sawshark": "img/fish/saw_shark.png",
  "scarab": "img/resources/scarab.webp",
  "seabass": "img/fish/sea_bass.png",
  "seacucumber": "img/treasures/Sea Cucumber.png",
  "seafoodbasket": "img/food/seafood_basket.webp",
  "seahorse": "img/fish/seahorse.png",
  "seaweed": "img/treasures/Seaweed.png",
  "shroomsyrup": "img/food/shroom_syrup.png",
  "slowjuice": "img/food/slow_juice.webp",
  "sourshake": "img/food/sour_shake.webp",
  "soybean": "img/delivery/Soybean.png",
  "spaghettiallimone": "img/food/spaghetti_al_limone2.webp",
  "spaghettiallimone2": "img/food/spaghetti_al_limone2.webp",
  "squid": "img/fish/squid.png",
  "starfish": "img/treasures/Starfish.png",
  "starlighttuna": "img/fish/starlight_tuna.png",
  "starlighttunatrophy": "img/fish/starlight_tuna_trophy.png",
  "stone": "img/resources/stone.png",
  "stonepickaxe": "img/tools/stone_pickaxe.png",
  "stopwatch": "img/ui/stopwatch.png",
  "sunfish": "img/fish/sunfish.png",
  "sunflower": "img/delivery/Sunflower.png",
  "sunflowercake": "img/food/cakes/sunflower_cake.png",
  "sunflowercrunch": "img/food/sunflower_crunch.png",
  "sunpetalseed": "img/flowers/sunpetal_seed.webp",
  "surgeonfish": "img/fish/surgeonfish.png",
  "sushiroll": "img/food/sushi_roll.webp",
  "tango": "img/plaza/tango.png",
  "thelot": "img/food/the_lot.webp",
  "tilapia": "img/fish/tilapia.png",
  "tofuscramble": "img/food/tofu_scramble.png",
  "tomato": "img/delivery/Tomato.png",
  "tradecake": "img/food/trade_cake.webp",
  "treasuremap": "img/treasure_map.png",
  "trout": "img/fish/trout.png",
  "tuna": "img/fish/tuna.png",
  "turnip": "img/delivery/Turnip.png",
  "twilightanglerfish": "img/fish/twilight_anglerfish.png",
  "twilightanglerfishtrophy": "img/fish/twilight_anglerfish_trophy.png",
  "usdc": "img/usdc.png",
  "vase": "img/resources/vase.webp",
  "venusbumpkintrap": "img/flowers/venus_bumpkin_trap.webp",
  "victoria": "img/plaza/victoria.png",
  "walleye": "img/fish/walleye.png",
  "weakfish": "img/fish/weak_fish.png",
  "whaleshark": "img/fish/whale_shark.png",
  "wheat": "img/delivery/Wheat.png",
  "wheatcake": "img/food/cakes/wheat_cake.png",
  "whiteballoonflower": "img/flowers/White Balloon Flower.png",
  "whitebottle": "img/potion/white_bottle.webp",
  "whitecarnation": "img/flowers/White Carnation.png",
  "whiteclover": "img/flowers/White Clover.png",
  "whitecosmos": "img/flowers/White Cosmos.png",
  "whitedaffodil": "img/flowers/White Daffodil.png",
  "whiteedelweiss": "img/flowers/White Edelweiss.png",
  "whitegladiolus": "img/flowers/White Gladiolus.png",
  "whitelavender": "img/flowers/White Lavender.png",
  "whitelotus": "img/flowers/White Lotus.png",
  "whitepansy": "img/flowers/White Pansy.png",
  "whiteshark": "img/fish/white_shark.png",
  "wood": "img/delivery/Wood.png",
  "woodencompass": "img/treasures/Wooden Compass.png",
  "woodpickaxe": "img/tools/wood_pickaxe.png",
  "yam": "img/delivery/Yam.png",
  "yellowballoonflower": "img/flowers/Yellow Balloon Flower.png",
  "yellowcarnation": "img/flowers/Yellow Carnation.png",
  "yellowclover": "img/flowers/Yellow Clover.png",
  "yellowcosmos": "img/flowers/Yellow Cosmos.png",
  "yellowdaffodil": "img/flowers/Yellow Daffodil.png",
  "yellowedelweiss": "img/flowers/Yellow Edelweiss.png",
  "yellowgladiolus": "img/flowers/Yellow Gladiolus.png",
  "yellowlavender": "img/flowers/Yellow Lavender.png",
  "yellowlotus": "img/flowers/Yellow Lotus.png",
  "yellowpansy": "img/delivery/Yellow Pansy.png",
  "zebraturkeyfish": "img/fish/zebra_turkeyfish.png",
  "zucchini": "img/delivery/Zucchini.png",
};

const NPC_LOOKUP = {
  "betty": "img/plaza/betty.png",
  "blacksmith": "img/plaza/blacksmith.png",
  "corale": "img/plaza/corale.png",
  "gambit": "img/plaza/gambit.png",
  "gordo": "img/plaza/gordo.png",
  "grimbly": "img/plaza/grimbly.png",
  "grimtooth": "img/plaza/grimtooth.png",
  "grubnuk": "img/plaza/grubnuk.png",
  "guria": "img/plaza/guria.png",
  "oldsalty": "img/plaza/old-salty.png",
  "peggy": "img/plaza/peggy.png",
  "tango": "img/plaza/tango.png",
  "victoria": "img/plaza/victoria.png",
  "potion": "img/potion/potion_npc.png"
};

export const NPC_LOCATIONS = {
  // Plaza (Thị trấn chính)
  "betty": "Plaza (Chợ nông sản)",
  "blacksmith": "Plaza (Lò rèn)",
  "peggy": "Plaza (Bếp nấu)",
  "bert": "Plaza (Đài nước)",
  "timmy": "Plaza (Cửa hàng)",
  "raven": "Plaza (Sunflorian)",
  "tywin": "Plaza (Cổng thành)",
  "pumpkinpete": "Plaza / Farm",
  "pumpkin_pete": "Plaza / Farm",
  "cornelis": "Plaza / Farm",
  "grimbly": "Plaza (Góc Goblin)",
  "grimtooth": "Plaza (Góc Goblin)",

  // Beach (Bãi biển Lvl 4+)
  "corale": "Beach (Cầu cảng)",
  "oldsalty": "Beach (Cầu cảng)",
  "old_salty": "Beach (Cầu cảng)",
  "tango": "Beach (Bờ biển khỉ)",
  "finn": "Beach (Trại cá)",
  "miranda": "Beach (Bờ biển)",
  "finley": "Beach (Bờ biển)",

  // Desert (Sa mạc Lvl 10+)
  "pharaoh": "Desert (Kim tự tháp)",
  "digby": "Desert (Bãi đào)",
  "mirage": "Desert (Ốc đảo)",

  // Kingdom / Faction (Lâu đài Lvl 7+)
  "victoria": "Kingdom (Lâu đài)",
  "jester": "Kingdom (Cung điện)",
  "gambit": "Kingdom (Bàn cờ vua)",
  "billy": "Kingdom (Khu Faction)",
  "eldric": "Kingdom (Khu Faction)",
  "nyx": "Kingdom (Khu Faction)",
  "reginald": "Kingdom (Khu Faction)",
  "barlow": "Kingdom (Khu Faction)",
  "graxle": "Kingdom (Khu Faction)",

  // Retreat (Đảo Goblin Lvl 5+)
  "gordo": "Retreat (Đảo Goblin)",
  "grubnuk": "Retreat (Đảo Goblin)",
  "guria": "Retreat (Đảo Goblin)",
  "garbo": "Retreat (Đảo Goblin)",
  "goblet": "Retreat (Đảo Goblin)",

  // Infernos (Đảo Núi Lửa Lvl 30+)
  "gunter": "Infernos (Núi lửa)",
  "gilda": "Infernos (Núi lửa)",
  "gorga": "Infernos (Núi lửa)"
};

export function resolveNpcPosition(npcName, ord) {
  const norm = cleanAlphaNum(npcName);
  const baseLoc = NPC_LOCATIONS[norm] || "Plaza";
  if (ord?.position) {
    if (typeof ord.position === "object" && ord.position.x !== undefined) {
      return `${baseLoc} (${ord.position.x}, ${ord.position.y})`;
    }
    return `${baseLoc} (${ord.position})`;
  }
  if (ord?.coordinates) {
    return `${baseLoc} [${ord.coordinates.x}, ${ord.coordinates.y}]`;
  }
  return baseLoc;
}

export function normalizeKey(name) {
  if (!name) return "";
  return String(name).toLowerCase().trim().replace(/ /g, "_").replace(/'/g, "").replace(/-/g, "_");
}

function cleanAlphaNum(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getItemIcon(name) {
  if (!name) return "img/sunflower.png";
  const key = cleanAlphaNum(name);
  if (ITEM_LOOKUP[key]) return ITEM_LOOKUP[key];

  // Fallback check BASE_CROPS
  const crop = BASE_CROPS.find(c => cleanAlphaNum(c.name) === key);
  if (crop) return crop.img;

  // Fallback check NPC
  if (NPC_LOOKUP[key]) return NPC_LOOKUP[key];

  return "img/sunflower.png";
}

export function getNpcIcon(npcName) {
  if (!npcName) return "img/plaza/betty.png";
  const key = cleanAlphaNum(npcName);
  if (NPC_LOOKUP[key]) return NPC_LOOKUP[key];
  if (ITEM_LOOKUP[key]) return ITEM_LOOKUP[key];
  return "img/plaza/betty.png";
}

// -------------------------------------------------------------
// LIVE API & GOOGLE SHEETS FETCHING
// -------------------------------------------------------------
const GOOGLE_SHEET_CSV_BASE = "https://docs.google.com/spreadsheets/d/1Hx7RI8NKIsOAbke7zqaN-j9ieR3RCiWe3MNatDZu7jc/export?format=csv";
const P2P_CACHE_KEY = "SFL_P2P_LIVE_CACHE";
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

function parseCsvNumber(val) {
  if (!val) return 0;
  const clean = String(val).replace(/["'\s]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

function parseCsvLine(line) {
  const cols = [];
  let inQuote = false;
  let curr = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cols.push(curr.trim());
      curr = "";
    } else {
      curr += ch;
    }
  }
  cols.push(curr.trim());
  return cols;
}

export async function fetchGoogleSheetPrices() {
  const priceMap = {};
  const rawP2P = {};

  // 1. Fetch crops, resources, animals, minerals (GID 559827946)
  const resCrops = await fetch(`${GOOGLE_SHEET_CSV_BASE}&gid=559827946`, { cache: "no-cache" });
  if (!resCrops.ok) throw new Error(`Google Sheet crops HTTP ${resCrops.status}`);
  const csvCrops = await resCrops.text();
  const linesCrops = csvCrops.split("\n");

  for (const line of linesCrops) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*"?([^",\r\n]+)"?\s*,\s*"?([0-9.,]+)"?/);
    if (match) {
      const name = match[1].trim();
      const price = parseCsvNumber(match[2]);
      if (name && price > 0) {
        priceMap[name] = price;
        priceMap[normalizeKey(name)] = price;
        rawP2P[name] = price;
      }
    }
  }

  // 2. Fetch Collectibles & Wearables (GID 1336733719)
  try {
    const resNFTs = await fetch(`${GOOGLE_SHEET_CSV_BASE}&gid=1336733719`, { cache: "no-cache" });
    if (resNFTs.ok) {
      const csvNFTs = await resNFTs.text();
      const linesNFTs = csvNFTs.split("\n");
      for (let i = 1; i < linesNFTs.length; i++) {
        const cols = parseCsvLine(linesNFTs[i]);
        if (cols[0] && cols[3]) {
          const name = cols[0];
          const norm = normalizeKey(name);
          // Do not overwrite base commodity if collision occurs
          if (priceMap[name] === undefined && priceMap[norm] === undefined) {
            const p = parseCsvNumber(cols[3]);
            if (p > 0) {
              priceMap[name] = p;
              priceMap[norm] = p;
              rawP2P[name] = p;
            }
          }
        }
        if (cols[5] && cols[8]) {
          const name = cols[5];
          const norm = normalizeKey(name);
          if (priceMap[name] === undefined && priceMap[norm] === undefined) {
            const p = parseCsvNumber(cols[8]);
            if (p > 0) {
              priceMap[name] = p;
              priceMap[norm] = p;
              rawP2P[name] = p;
            }
          }
        }
      }
    }
  } catch (nftErr) {
    console.warn("[SFL Market] Non-critical: Could not load NFTs sheet:", nftErr);
  }

  return { priceMap, rawP2P };
}

export async function fetchLiveP2PPrices(force = false) {
  // Check local storage cache first if not forced
  if (!force && typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      const cached = await new Promise(resolve => {
        chrome.storage.local.get([P2P_CACHE_KEY], res => resolve(res?.[P2P_CACHE_KEY] || null));
      });
      if (cached && cached.updatedAt && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
        return cached;
      }
    } catch (_) {}
  }

  // 1. Primary Source: Google Sheet (Direct from User's Sheet)
  try {
    const { priceMap, rawP2P } = await fetchGoogleSheetPrices();
    if (Object.keys(rawP2P).length > 0) {
      const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const cacheData = {
        prices: priceMap,
        rawP2P: rawP2P,
        updatedAt: Date.now(),
        updatedText: `Google Sheets (${timeStr})`,
        source: "google_sheet"
      };

      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [P2P_CACHE_KEY]: cacheData });
      }

      return cacheData;
    }
  } catch (sheetErr) {
    console.warn("[SFL Market] Google Sheet fetch failed, trying fallback sfl.world:", sheetErr);
  }

  // 2. Secondary Fallback Source: sfl.world API
  try {
    const res = await fetch("https://sfl.world/api/v1/prices", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const p2pRaw = json?.data?.p2p || {};

    const priceMap = {};
    for (const [k, v] of Object.entries(p2pRaw)) {
      priceMap[normalizeKey(k)] = typeof v === "number" ? v : parseFloat(v) || 0;
      priceMap[k] = priceMap[normalizeKey(k)];
    }

    const cacheData = {
      prices: priceMap,
      rawP2P: p2pRaw,
      updatedAt: json.updatedAt || Date.now(),
      updatedText: json.updated_text ? `sfl.world (${json.updated_text})` : "sfl.world",
      source: "sfl_world"
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [P2P_CACHE_KEY]: cacheData });
    }

    return cacheData;
  } catch (err) {
    console.warn("[SFL Market] Fallback sfl.world also failed, using cached storage:", err);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      const fallback = await new Promise(resolve => {
        chrome.storage.local.get([P2P_CACHE_KEY], res => resolve(res?.[P2P_CACHE_KEY] || null));
      });
      if (fallback) return fallback;
    }
    return { prices: {}, rawP2P: {}, updatedAt: Date.now(), updatedText: "Lỗi kết nối", source: "error" };
  }
}

export async function fetchLiveExchangeRates() {
  const result = {
    sflUsd: 0.168,
    polUsd: 0.107,
    coinsPerSfl: 160,
    dexPriceChange24h: 0
  };

  try {
    const res = await fetch("https://sfl.world/api/v1.1/exchange", { cache: "no-cache" });
    if (res.ok) {
      const ex = await res.json();
      if (ex.sfl?.usd) result.sflUsd = parseFloat(ex.sfl.usd);
      if (ex.pol?.usd) result.polUsd = parseFloat(ex.pol.usd);
      if (ex.coins?.["160"]?.coin) result.coinsPerSfl = 160;
    }
  } catch (_) {}

  try {
    const dexRes = await fetch("https://api.dexscreener.com/latest/dex/tokens/0x3E12b9d6A4D12cd9b4a6d613872d0Eb32f68b380");
    if (dexRes.ok) {
      const dexJson = await dexRes.json();
      const pair = dexJson?.pairs?.[0];
      if (pair?.priceUsd) result.sflUsd = parseFloat(pair.priceUsd);
      if (pair?.priceChange?.h24) result.dexPriceChange24h = parseFloat(pair.priceChange.h24);
    }
  } catch (_) {}

  return result;
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// PRICE & COOKING COST HELPERS
// -------------------------------------------------------------
export const DEFAULT_P2P_PRICES = {
  // Crops
  "sunflower": 0.00020535,
  "potato": 0.0002034,
  "pumpkin": 0.0005725,
  "carrot": 0.001768,
  "cabbage": 0.001517,
  "beetroot": 0.00417949,
  "cauliflower": 0.0050,
  "parsnip": 0.00968,
  "eggplant": 0.0073,
  "corn": 0.0160,
  "radish": 0.0095,
  "wheat": 0.014867,
  "kale": 0.0168,
  "soybean": 0.001806,
  "barley": 0.0180,
  "rhubarb": 0.0005024,
  "zucchini": 0.0020,
  "yam": 0.0030,
  "broccoli": 0.0060,
  "pepper": 0.0100,
  "onion": 0.0150,
  "turnip": 0.0120,
  "artichoke": 0.0180,

  // Fruits
  "apple": 0.01778,
  "banana": 0.01748,
  "orange": 0.01502667,
  "blueberry": 0.01933571,
  "tomato": 0.00638379,
  "lemon": 0.0075964,

  // Greenhouse & Animal & Barn
  "grape": 0.198428,
  "rice": 0.2178,
  "olive": 0.3240,
  "egg": 0.020252,
  "honey": 0.1070,
  "milk": 0.12796,
  "cheese": 0.38388,

  // Foraged & Mushrooms
  "wild_mushroom": 0.0250,
  "magic_mushroom": 0.0800,
  "saltwort": 0.0200,

  // Fish & Marine
  "anchovy": 0.0150,
  "butterflyfish": 0.0200,
  "blowfish": 0.0400,
  "clownfish": 0.0200,
  "seaweed": 0.0100,
  "red_snapper": 0.0450,
  "tuna": 0.0800,
  "squid": 0.0400,
  "horse_mackerel": 0.0200,
  "halibut": 0.0400,
  "surgeonfish": 0.0300,
  "olive_flounder": 0.0300,
  "angelfish": 0.0300,
  "napoleanfish": 0.0500,
  "napoleonfish": 0.0500,
  "sunfish": 0.0500,
  "fish_flake": 0.0100,
  "fish_oil": 0.0200,
  "fish_stick": 0.0200,
  "crab_stick": 0.0300,
  "crimstone": 0.0500
};

export function computeAllCookingCosts(priceMap) {
  const costs = {};

  function getCost(name, depth = 0) {
    if (depth > 6) return 0;
    const key = normalizeKey(name);
    if (costs[key] !== undefined) return costs[key];
    
    // Check in live priceMap
    if (priceMap && priceMap[key] !== undefined && priceMap[key] > 0) return priceMap[key];
    if (priceMap && priceMap[name] !== undefined && priceMap[name] > 0) return priceMap[name];
    
    // Check in default baseline prices
    if (DEFAULT_P2P_PRICES[key] !== undefined) return DEFAULT_P2P_PRICES[key];

    // Find recipe (case-insensitive)
    const recipe = COOKING_RECIPES[name] || Object.entries(COOKING_RECIPES).find(([rName]) => normalizeKey(rName) === key)?.[1];
    if (recipe) {
      let sum = 0;
      for (const [ingName, qty] of Object.entries(recipe)) {
        sum += getCost(ingName, depth + 1) * qty;
      }
      costs[key] = sum;
      return sum;
    }
    return 0;
  }

  for (const name of Object.keys(COOKING_RECIPES)) {
    getCost(name);
  }
  return costs;
}

export function getItemPrice(itemName, priceMap, cookingCosts = null, depth = 0) {
  if (!itemName) return 0;
  const norm = normalizeKey(itemName);

  if (cookingCosts && cookingCosts[norm] !== undefined && cookingCosts[norm] > 0) {
    return cookingCosts[norm];
  }
  if (priceMap && priceMap[norm] !== undefined && priceMap[norm] > 0) {
    return priceMap[norm];
  }
  if (priceMap && priceMap[itemName] !== undefined && priceMap[itemName] > 0) {
    return priceMap[itemName];
  }
  if (DEFAULT_P2P_PRICES[norm] !== undefined) {
    return DEFAULT_P2P_PRICES[norm];
  }

  if (depth > 6) return 0;
  // If item is a cooked recipe, calculate dynamically from ingredients
  const recipe = COOKING_RECIPES[itemName] || Object.entries(COOKING_RECIPES).find(([rName]) => normalizeKey(rName) === norm)?.[1];
  if (recipe) {
    let sum = 0;
    for (const [ingName, qty] of Object.entries(recipe)) {
      sum += getItemPrice(ingName, priceMap, cookingCosts, depth + 1) * qty;
    }
    return sum;
  }

  return 0;
}

// -------------------------------------------------------------
// BEST RATE & COIN RATE ENGINE
// -------------------------------------------------------------
export function calculateBestCropRates(priceMap, withSkill = false) {
  const list = [];
  let best = { name: "Banana", rate: 1200 };

  for (const crop of BASE_CROPS) {
    const price = getItemPrice(crop.name, priceMap);
    if (!price || price <= 0) continue;

    const baseCoin = crop.baseSale;
    const finalCoin = (crop.skillBonusApplies && withSkill) ? baseCoin * 1.1 : baseCoin;
    const rate = finalCoin / price; // Coins per 1 SFL spent

    const entry = {
      name: crop.name,
      img: crop.img,
      category: crop.category,
      baseSale: baseCoin,
      finalSale: finalCoin,
      p2pPrice: price,
      rate: rate,
      sflPer100Coins: (100 / rate)
    };
    list.push(entry);

    if (rate > best.rate) {
      best = { name: crop.name, rate };
    }
  }

  list.sort((a, b) => b.rate - a.rate);
  return { list, bestRate: best };
}

// -------------------------------------------------------------
// TASKS / DELIVERY ORDERS ANALYZER (Matching Original Mod Logic)
// -------------------------------------------------------------
export function analyzeDeliveryOrders(deliveryData, inventory, priceMap, bestRateValue = 1200) {
  const orders = deliveryData?.orders || [];
  if (!orders.length) return [];

  const invMap = {};
  for (const [k, v] of Object.entries(inventory || {})) {
    invMap[k] = parseFloat(v) || 0;
    invMap[normalizeKey(k)] = parseFloat(v) || 0;
  }

  const sflPerCoin = 1 / (bestRateValue || 1200);
  const cookingCosts = computeAllCookingCosts(priceMap);
  const COMMODITY_NPCS = ["victoria", "betty", "blacksmith", "tango"];

  return orders.map(ord => {
    const npcName = ord.from || "Bumpkin";
    const normNpc = normalizeKey(npcName);
    const isCommodityNpc = COMMODITY_NPCS.includes(normNpc);

    const reqItems = [];
    let totalP2PCostSfl = 0;
    let allReady = true;

    for (const [itemName, requiredQty] of Object.entries(ord.items || {})) {
      const haveQty = invMap[itemName] ?? invMap[normalizeKey(itemName)] ?? 0;
      const isReady = haveQty >= requiredQty;
      if (!isReady) allReady = false;

      const normItem = normalizeKey(itemName);
      let unitPrice = 0;

      if (isCommodityNpc) {
        unitPrice = priceMap[normItem] ?? priceMap[itemName] ?? 0;
      } else if (normNpc === "old_salty" || normNpc === "oldsalty") {
        unitPrice = cookingCosts[normItem] ?? priceMap[normItem] ?? priceMap[itemName] ?? 0;
      } else {
        unitPrice = cookingCosts[normItem] ?? priceMap[normItem] ?? priceMap[itemName] ?? 0;
      }

      const itemCost = unitPrice * requiredQty;
      totalP2PCostSfl += itemCost;

      reqItems.push({
        name: itemName,
        required: requiredQty,
        have: haveQty,
        unitPrice: unitPrice,
        totalCost: itemCost,
        status: isReady ? "READY" : "MISSING",
        icon: getItemIcon(itemName)
      });
    }

    // Determine Reward in SFL
    let rewardSfl = 0;
    let rewardCoin = 0;
    let rewardItems = [];

    if (ord.reward?.sfl) {
      rewardSfl = parseFloat(ord.reward.sfl) || 0;
    }
    if (ord.reward?.coins) {
      rewardCoin = parseFloat(ord.reward.coins) || 0;
      rewardSfl += rewardCoin * sflPerCoin;
    }
    if (ord.reward?.items) {
      for (const [rName, rQty] of Object.entries(ord.reward.items)) {
        const p = getItemPrice(rName, priceMap);
        rewardSfl += p * (parseFloat(rQty) || 1);
        rewardItems.push({ name: rName, qty: rQty });
      }
    }

    const isCompleted = ord.completedAt || ord.readyAt > Date.now();
    const netProfitSfl = rewardSfl - totalP2PCostSfl;
    const isLoss = !isCompleted && netProfitSfl < 0;

    return {
      id: ord.id,
      npcName: npcName,
      npcIcon: getNpcIcon(npcName),
      position: resolveNpcPosition(npcName, ord),
      createdAt: ord.createdAt,
      readyAt: ord.readyAt,
      isCompleted: isCompleted,
      allReady: allReady,
      reqItems: reqItems,
      rewardSfl: rewardSfl,
      rewardCoin: rewardCoin,
      rewardItems: rewardItems,
      totalP2PCostSfl: totalP2PCostSfl,
      netProfitSfl: netProfitSfl,
      isLoss: isLoss
    };
  }).sort((a, b) => {
    // 1. Ready to fulfill first
    if (a.allReady !== b.allReady) return a.allReady ? -1 : 1;
    // 2. Highest profit first
    return b.netProfitSfl - a.netProfitSfl;
  });
}

// -------------------------------------------------------------
// INVENTORY VALUATION ENGINE
// -------------------------------------------------------------
export function calculateInventoryValuation(inventory, priceMap, applyTax = false) {
  if (!inventory) return { items: [], totalSfl: 0, totalUsd: 0 };
  const taxMultiplier = applyTax ? 0.9 : 1.0;
  const items = [];
  let totalSfl = 0;

  for (const [name, rawAmount] of Object.entries(inventory)) {
    const amount = parseFloat(rawAmount) || 0;
    if (amount <= 0) continue;

    const price = getItemPrice(name, priceMap);
    if (price <= 0) continue; // Skip non-tradeable or free items

    const value = amount * price * taxMultiplier;
    totalSfl += value;

    items.push({
      name: name,
      amount: amount,
      unitPrice: price,
      totalValue: value,
      icon: getItemIcon(name)
    });
  }

  items.sort((a, b) => b.totalValue - a.totalValue);
  return {
    items,
    totalSfl
  };
}

// -------------------------------------------------------------
// PROFIT CALCULATOR FOR RESOURCES & CROPS
// -------------------------------------------------------------
export function calculateResourceProfits(farm, priceMap, bestRateSfl = 1200) {
  const bumpkinSkills = farm?.bumpkin?.skills || {};
  const coinSflRate = 1 / (bestRateSfl || 1200);

  const hasFellersDiscount = !!bumpkinSkills["Feller's Discount"];
  const hasFrugalMiner = !!bumpkinSkills["Frugal Miner"];

  const woodPrice = getItemPrice("wood", priceMap);
  const stonePrice = getItemPrice("stone", priceMap);
  const ironPrice = getItemPrice("iron", priceMap);
  const goldPrice = getItemPrice("gold", priceMap);
  const crimstonePrice = getItemPrice("crimstone", priceMap);
  const honeyPrice = getItemPrice("honey", priceMap);

  // Tool Crafting Costs in SFL
  const axeCostCoins = hasFellersDiscount ? 16 : 20;
  const axeCostSfl = axeCostCoins * coinSflRate;

  const pickCostCoins = hasFrugalMiner ? 16 : 20;
  const pickCostSfl = (3 * woodPrice) + (pickCostCoins * coinSflRate);

  const stonePickCostCoins = hasFrugalMiner ? 16 : 20;
  const stonePickCostSfl = (3 * woodPrice) + (5 * stonePrice) + (stonePickCostCoins * coinSflRate);

  const ironPickCostCoins = hasFrugalMiner ? 64 : 80;
  const ironPickCostSfl = (3 * woodPrice) + (5 * ironPrice) + (ironPickCostCoins * coinSflRate);

  const goldPickCostCoins = hasFrugalMiner ? 80 : 100;
  const goldPickCostSfl = (3 * woodPrice) + (3 * goldPrice) + (goldPickCostCoins * coinSflRate);

  // Average yields per node (with basic skills)
  const resources = [
    {
      name: "Chặt Cây (Trees)",
      icon: getItemIcon("Wood"),
      toolName: "Rìu (Axe)",
      toolIcon: getItemIcon("Axe"),
      toolCostSfl: axeCostSfl,
      nodeYield: 3.5,
      yieldItem: "Gỗ (Wood)",
      yieldPrice: woodPrice,
      grossRevenue: 3.5 * woodPrice,
      netProfit: (3.5 * woodPrice) - axeCostSfl
    },
    {
      name: "Đập Đá (Stones)",
      icon: getItemIcon("Stone"),
      toolName: "Cuốc Gỗ (Pickaxe)",
      toolIcon: getItemIcon("Pickaxe"),
      toolCostSfl: pickCostSfl,
      nodeYield: 2,
      yieldItem: "Đá (Stone)",
      yieldPrice: stonePrice,
      grossRevenue: 2 * stonePrice,
      netProfit: (2 * stonePrice) - pickCostSfl
    },
    {
      name: "Đào Sắt (Iron)",
      icon: getItemIcon("Iron"),
      toolName: "Cuốc Đá (Stone Pickaxe)",
      toolIcon: getItemIcon("Stone Pickaxe"),
      toolCostSfl: stonePickCostSfl,
      nodeYield: 2,
      yieldItem: "Sắt (Iron)",
      yieldPrice: ironPrice,
      grossRevenue: 2 * ironPrice,
      netProfit: (2 * ironPrice) - stonePickCostSfl
    },
    {
      name: "Đào Vàng (Gold)",
      icon: getItemIcon("Gold"),
      toolName: "Cuốc Sắt (Iron Pickaxe)",
      toolIcon: getItemIcon("Iron Pickaxe"),
      toolCostSfl: ironPickCostSfl,
      nodeYield: 2,
      yieldItem: "Vàng (Gold)",
      yieldPrice: goldPrice,
      grossRevenue: 2 * goldPrice,
      netProfit: (2 * goldPrice) - ironPickCostSfl
    },
    {
      name: "Đào Crimstone",
      icon: getItemIcon("Crimstone"),
      toolName: "Cuốc Vàng (Gold Pickaxe)",
      toolIcon: getItemIcon("Gold Pickaxe"),
      toolCostSfl: goldPickCostSfl,
      nodeYield: 1.5,
      yieldItem: "Crimstone",
      yieldPrice: crimstonePrice,
      grossRevenue: 1.5 * crimstonePrice,
      netProfit: (1.5 * crimstonePrice) - goldPickCostSfl
    },
    {
      name: "Nuôi Ong Lấy Mật (Honey)",
      icon: getItemIcon("Honey"),
      toolName: "Tổ Ong (Beehive)",
      toolIcon: getItemIcon("Honey"),
      toolCostSfl: 0,
      nodeYield: 1,
      yieldItem: "Mật Ong (Honey)",
      yieldPrice: honeyPrice,
      grossRevenue: honeyPrice,
      netProfit: honeyPrice
    }
  ];

  return resources;
}
