/**
 * Utility functions for generating emojis based on ingredients and meal types
 */

// Mapping of common ingredients to emojis
const ingredientEmojiMap: Record<string, string> = {
  // Fruits
  'apple': '🍎',
  'banana': '🍌',
  'orange': '🍊',
  'lemon': '🍋',
  'strawberry': '🍓',
  'blueberry': '🫐',
  'avocado': '🥑',
  'coconut': '🥥',
  'watermelon': '🍉',
  'grape': '🍇',
  'raisin': '🍇',
  'raisins': '🍇',
  'kiwi': '🥝',
  'mango': '🥭',
  'pear': '🍐',
  'peach': '🍑',
  'pineapple': '🍍',
  'fruit': '🍎',
  'berries': '🍓',

  // Vegetables
  'carrot': '🥕',
  'broccoli': '🥦',
  'tomato': '🍅',
  'potato': '🥔',
  'sweet potato': '🍠',
  'corn': '🌽',
  'maize': '🌽',
  'sadza': '🌽',
  'cucumber': '🥒',
  'leafy green': '🥬',
  'spinach': '🥬',
  'kale': '🥬',
  'lettuce': '🥬',
  'pepper': '🫑',
  'eggplant': '🍆',
  'mushroom': '🍄',
  'onion': '🧅',
  'garlic': '🧄',
  'pumpkin': '🎃',
  'vegetable': '🥦',
  'vegetables': '🥦',

  // Proteins
  'egg': '🥚',
  'chicken': '🍗',
  'meat': '🥩',
  'beef': '🥩',
  'pork': '🥓',
  'bacon': '🥓',
  'fish': '🐟',
  'salmon': '🐟',
  'shrimp': '🦐',
  'tofu': '🧊',
  'beans': '🫘',
  'lentils': '🫘',
  'protein': '🥩',

  // Dairy
  'milk': '🥛',
  'cheese': '🧀',
  'butter': '🧈',
  'yogurt': '🥣',
  'dairy': '🥛',

  // Grains
  'bread': '🍞',
  'rice': '🍚',
  'pasta': '🍝',
  'noodle': '🍜',
  'cereal': '🥣',
  'oats': '🥣',
  'oatmeal': '🥣',
  'porridge': '🥣',
  'quinoa': '🌾',
  'millet': '🌾',
  'grain': '🌾',
  'grains': '🌾',
  'wheat': '🌾',
  'barley': '🌾',

  // Nuts and Seeds
  'nut': '🥜',
  'peanut': '🥜',
  'almond': '🥜',
  'cashew': '🥜',
  'seed': '🌱',
  'flaxseed': '🌱',
  'chia': '🌱',

  // Beverages
  'water': '💧',
  'tea': '🍵',
  'coffee': '☕',
  'juice': '🧃',
  'smoothie': '🥤',

  // Sweets
  'honey': '🍯',
  'sugar': '🧂',
  'chocolate': '🍫',
  'cookie': '🍪',
  'cake': '🍰',
  'ice cream': '🍦',

  // Oils and Condiments
  'oil': '🫗',
  'olive oil': '🫒',
  'vinegar': '🧪',
  'sauce': '🧂',
  'salt': '🧂',
  'spice': '🌶️',

  // Cooking methods
  'boiled': '♨️',
  'baked': '🔥',
  'roasted': '🔥',
  'fried': '🍳',
  'steamed': '♨️',

  // Meal types
  'bowl': '🥣',
  'soup': '🍲',
  'stew': '🍲',
};

// Mapping of meal types to emojis
const mealTypeEmojiMap: Record<string, string> = {
  'breakfast': '🍳',
  'lunch': '🍲',
  'dinner': '🍽️',
  'snack': '🥨',
  'dessert': '🍰',
  'baby': '👶',
  'mother': '🤱',
  'drink': '🥤',
  'soup': '🍜',
  'salad': '🥗',
  'sandwich': '🥪',
  'pizza': '🍕',
  'pasta': '🍝',
  'rice': '🍚',
  'seafood': '🦞',
  'vegetarian': '🥬',
  'vegan': '🌱',
  'gluten-free': '🌾',
  'dairy-free': '🥛',
  'low-carb': '📉',
  'high-protein': '💪',
};

/**
 * Scans ingredients and generates appropriate emojis
 * @param ingredients Array of ingredients
 * @param mealName Name of the meal
 * @param mealType Type of meal (breakfast, lunch, dinner, snack)
 * @param tags Array of tags associated with the meal
 * @returns Array of emojis representing the meal
 */
export const generateMealEmojis = (
  ingredients: string[],
  mealName: string,
  mealType?: string,
  tags?: string[]
): string[] => {
  const emojis: string[] = [];
  const usedEmojis = new Set<string>();

  // Add meal type emoji if available
  if (mealType && mealTypeEmojiMap[mealType.toLowerCase()]) {
    const emoji = mealTypeEmojiMap[mealType.toLowerCase()];
    emojis.push(emoji);
    usedEmojis.add(emoji);
  }

  // Scan ingredients for matching emojis
  for (const ingredient of ingredients) {
    // Check for exact matches first
    if (ingredientEmojiMap[ingredient.toLowerCase()]) {
      const emoji = ingredientEmojiMap[ingredient.toLowerCase()];
      if (!usedEmojis.has(emoji)) {
        emojis.push(emoji);
        usedEmojis.add(emoji);
      }
      continue;
    }

    // Check for partial matches
    for (const [key, emoji] of Object.entries(ingredientEmojiMap)) {
      if (ingredient.toLowerCase().includes(key) && !usedEmojis.has(emoji)) {
        emojis.push(emoji);
        usedEmojis.add(emoji);
        break;
      }
    }
  }

  // Scan meal name for additional context
  for (const [key, emoji] of Object.entries(ingredientEmojiMap)) {
    if (mealName.toLowerCase().includes(key) && !usedEmojis.has(emoji)) {
      emojis.push(emoji);
      usedEmojis.add(emoji);
    }
  }

  // Add emojis based on tags
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      if (mealTypeEmojiMap[tag.toLowerCase()] && !usedEmojis.has(mealTypeEmojiMap[tag.toLowerCase()])) {
        emojis.push(mealTypeEmojiMap[tag.toLowerCase()]);
        usedEmojis.add(mealTypeEmojiMap[tag.toLowerCase()]);
      }
    }
  }

  // Ensure we have at least one emoji
  if (emojis.length === 0) {
    emojis.push('🍽️'); // Default food emoji
  }

  // Limit to 5 emojis maximum to avoid cluttering
  return emojis.slice(0, 5);
};

/**
 * Generates an emoji banner string from an array of emojis
 * @param emojis Array of emojis
 * @returns String of emojis for display
 */
export const createEmojiBanner = (emojis: string[]): string => {
  return emojis.join(' ');
};

/**
 * Generates a random emoji banner for a meal when no ingredients are available
 * @param mealType Type of meal
 * @returns Array of emojis
 */
export const generateRandomMealEmojis = (mealType?: string): string[] => {
  const defaultEmojis: Record<string, string[]> = {
    'breakfast': ['🍳', '🥞', '🥐', '☕', '🥓'],
    'lunch': ['🥪', '🍲', '🥗', '🍱', '🥙'],
    'dinner': ['🍽️', '🍛', '🥘', '🍖', '🍝'],
    'snack': ['🍎', '🥨', '🧀', '🥜', '🍇'],
    'baby': ['👶', '🍼', '🥣', '🍌', '🥕'],
    'default': ['🍽️', '🍴', '🥄', '🍲', '🥗']
  };

  if (mealType && defaultEmojis[mealType.toLowerCase()]) {
    return defaultEmojis[mealType.toLowerCase()];
  }

  return defaultEmojis.default;
};
