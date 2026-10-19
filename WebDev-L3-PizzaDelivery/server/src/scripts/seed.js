import { Pizza } from '../models/Pizza.js';
import { Ingredient } from '../models/Ingredient.js';

export const SAMPLE_PIZZAS = [
  {
    name: 'Margherita Classica',
    description: 'Campania buffalo mozzarella, hand-crushed San Marzano tomatoes, fresh sweet basil, and Ligurian cold-pressed extra virgin olive oil on 48h sourdough.',
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    basePricePaise: 29900, // ₹299
    isAvailable: true,
    category: 'Classic',
    isFeatured: true,
    isVegetarian: true,
    isSpicy: false,
    ingredients: ['San Marzano Sauce', 'Buffalo Mozzarella', 'Fresh Basil', 'Ligurian Olive Oil'],
    isSampleData: true,
  },
  {
    name: 'Farmhouse Rustic Harvest',
    description: 'Crisp green bell peppers, sliced button mushrooms, sun-ripened tomatoes, sweet corn, and shredded mozzarella cheese.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    basePricePaise: 39900, // ₹399
    isAvailable: true,
    category: 'Veg Feast',
    isFeatured: true,
    isVegetarian: true,
    isSpicy: false,
    ingredients: ['Capsicum', 'Mushroom', 'Sweet Corn', 'Roma Tomato', 'Mozzarella'],
    isSampleData: true,
  },
  {
    name: 'Spicy Paneer Tikka Feast',
    description: 'Tandoori-spiced cottage cheese cubes, pickled jalapeños, charred red onions, and fiery spicy marinara drizzle.',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    basePricePaise: 44900, // ₹449
    isAvailable: true,
    category: 'Spicy',
    isFeatured: true,
    isVegetarian: true,
    isSpicy: true,
    ingredients: ['Spicy Marinara', 'Cottage Cheese Tikka', 'Red Onion', 'Pickled Jalapeño', 'Mozzarella'],
    isSampleData: true,
  },
  {
    name: 'Garden Delight Symphony',
    description: 'Golden sweet corn, crisp English capsicum, Kalamata black olives, and juicy Roma tomatoes with fragrant Italian herbs.',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    basePricePaise: 34900, // ₹349
    isAvailable: true,
    category: 'Veg Feast',
    isFeatured: false,
    isVegetarian: true,
    isSpicy: false,
    ingredients: ['Sweet Corn', 'Capsicum', 'Black Olives', 'Tomato', 'Mozzarella'],
    isSampleData: true,
  },
  {
    name: 'Four Cheese Al Forno',
    description: 'Artisanal quartet of aged Cheddar, Parmigiano Reggiano, smoked provola, and molten mozzarella with a hint of wild mountain thyme.',
    imageUrl: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=800&q=80',
    basePricePaise: 49900, // ₹499
    isAvailable: true,
    category: 'Artisanal',
    isFeatured: true,
    isVegetarian: true,
    isSpicy: false,
    ingredients: ['Mozzarella', 'Aged Cheddar', 'Parmigiano Reggiano', 'Smoked Provola', 'Thyme'],
    isSampleData: true,
  },
  {
    name: 'Mediterranean Veg Sun-Blush',
    description: 'Artisan sun-dried tomatoes, Greek black olives, tender spinach leaves, and crumbled feta cheese with extra virgin olive oil.',
    imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
    basePricePaise: 42900, // ₹429
    isAvailable: false, // OUT OF STOCK test case for requirements
    category: 'Artisanal',
    isFeatured: false,
    isVegetarian: true,
    isSpicy: false,
    ingredients: ['Sun-dried Tomatoes', 'Black Olives', 'Baby Spinach', 'Feta', 'Olive Oil'],
    isSampleData: true,
  },
  {
    name: 'Peri-Peri Veg Dynamite',
    description: 'Crushed bird’s eye chili peri-peri glaze, crunchy red onions, spicy jalapeños, and bell peppers over a bubbly cheese crust.',
    imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    basePricePaise: 37900, // ₹379
    isAvailable: true,
    category: 'Spicy',
    isFeatured: false,
    isVegetarian: true,
    isSpicy: true,
    ingredients: ['Peri-Peri Sauce', 'Red Onion', 'Capsicum', 'Jalapeños', 'Mozzarella'],
    isSampleData: true,
  },
  {
    name: 'Signature Green Pesto & Burrata',
    description: 'Aromatic Ligurian basil and pine nut pesto base topped with whole burrata tear, baby spinach, and roasted pine nuts.',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    basePricePaise: 46900, // ₹469
    isAvailable: true,
    category: 'Signature',
    isFeatured: true,
    isVegetarian: true,
    isSpicy: false,
    ingredients: ['Basil Pesto', 'Pugliese Burrata', 'Baby Spinach', 'Pine Nuts', 'Olive Oil'],
    isSampleData: true,
  },
];

export const SAMPLE_INGREDIENTS = [
  // STEP 1: BASE (5 Options)
  {
    name: 'Classic Thin Crust',
    category: 'base',
    description: 'Crisp, lightweight European-style thin crust baked to a golden snap.',
    priceAdjustmentPaise: 0,
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Hand-Tossed Sourdough',
    category: 'base',
    description: 'Authentic 48h cold fermented sourdough with an airy, blistered crust.',
    priceAdjustmentPaise: 3000, // ₹30
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Golden Pan Crust',
    category: 'base',
    description: 'Fluffy, thick-crust base fried in extra virgin olive oil for a deep crunch.',
    priceAdjustmentPaise: 4000, // ₹40
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Whole Wheat Organic',
    category: 'base',
    description: 'Nutritious stone-ground 100% whole wheat dough with an earthy nutty aroma.',
    priceAdjustmentPaise: 5000, // ₹50
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Molten Cheese Burst',
    category: 'base',
    description: 'Double-crust filled with molten cheese that gushes with every single bite.',
    priceAdjustmentPaise: 8000, // ₹80
    isAvailable: true,
    isSampleData: true,
  },

  // STEP 2: SAUCE (5 Options)
  {
    name: 'Classic Tomato',
    category: 'sauce',
    description: 'Slow-simmered San Marzano tomatoes infused with sea salt and sweet Genovese basil.',
    priceAdjustmentPaise: 0,
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Spicy Marinara',
    category: 'sauce',
    description: 'Robust garlic and crushed red chili pepper flakes blended with ripe plum tomatoes.',
    priceAdjustmentPaise: 2000, // ₹20
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Creamy Alfredo White',
    category: 'sauce',
    description: 'Velvety butter, rich cream, and Parmigiano reduction with cracked black pepper.',
    priceAdjustmentPaise: 3000, // ₹30
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Aromatic Basil Pesto',
    category: 'sauce',
    description: 'Fresh Ligurian sweet basil, toasted pine nuts, extra virgin olive oil, and aged Pecorino.',
    priceAdjustmentPaise: 4000, // ₹40
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Smoky Barbecue',
    category: 'sauce',
    description: 'Oak-smoked tomato sauce with sweet molasses, hickory vinegar, and black pepper.',
    priceAdjustmentPaise: 3000, // ₹30
    isAvailable: true,
    isSampleData: true,
  },

  // STEP 3: CHEESE (4 Options)
  {
    name: 'Fresh Fior di Latte Mozzarella',
    category: 'cheese',
    description: 'Classic artisanal mozzarella with creamy texture and supreme golden blister melt.',
    priceAdjustmentPaise: 0,
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Sharp Aged Cheddar',
    category: 'cheese',
    description: 'English farm cheddar aged 12 months with bold, tangy, savory depth.',
    priceAdjustmentPaise: 4000, // ₹40
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Parmigiano Reggiano DOP',
    category: 'cheese',
    description: 'Finely grated authentic 24-month Italian Parmesan offering intense nutty umami.',
    priceAdjustmentPaise: 5000, // ₹50
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Plant-Based Vegan Cheese',
    category: 'cheese',
    description: 'Cultured cashew and coconut milk based mozzarella alternative with zero dairy.',
    priceAdjustmentPaise: 6000, // ₹60
    isAvailable: true,
    isSampleData: true,
  },

  // STEP 4: VEGETABLES (9 Options)
  {
    name: 'Red Onion Rings',
    category: 'veggie',
    description: 'Crisp, sweet red onions with sharp caramelized flavor.',
    priceAdjustmentPaise: 2500, // ₹25
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Crunchy Capsicum',
    category: 'veggie',
    description: 'Fresh green bell peppers sliced into juicy ribbons.',
    priceAdjustmentPaise: 2500, // ₹25
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Wild Button Mushrooms',
    category: 'veggie',
    description: 'Earthy sliced button mushrooms pan-roasted with fresh thyme.',
    priceAdjustmentPaise: 3500, // ₹35
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Golden Sweet Corn',
    category: 'veggie',
    description: 'Sweet American corn kernels that pop with crisp natural sweetness.',
    priceAdjustmentPaise: 3000, // ₹30
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Ripe Roma Tomatoes',
    category: 'veggie',
    description: 'Fresh diced Roma tomatoes with bright, balanced acidity.',
    priceAdjustmentPaise: 2000, // ₹20
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Kalamata Black Olives',
    category: 'veggie',
    description: 'Pitted Mediterranean black olives delivering rich salty brine.',
    priceAdjustmentPaise: 3500, // ₹35
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Pickled Fiery Jalapeños',
    category: 'veggie',
    description: 'Spicy pepper rings pickled with vinegary tartness and heat.',
    priceAdjustmentPaise: 3000, // ₹30
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Tender Baby Spinach',
    category: 'veggie',
    description: 'Organic young spinach leaves with delicate fresh iron taste.',
    priceAdjustmentPaise: 2500, // ₹25
    isAvailable: true,
    isSampleData: true,
  },
  {
    name: 'Hawaiian Honey Pineapple',
    category: 'veggie',
    description: 'Juicy roasted pineapple chunks for the adventurous sweet-savory palate.',
    priceAdjustmentPaise: 3000, // ₹30
    isAvailable: true,
    isSampleData: true,
  },
];

/**
 * Seed initial pizzas and ingredients if not already seeded
 */
export const seedInitialData = async () => {
  try {
    const pizzaCount = await Pizza.countDocuments();
    if (pizzaCount === 0) {
      console.log('[SEED] Seeding 8 sample pizzas into catalog...');
      await Pizza.insertMany(SAMPLE_PIZZAS);
      console.log('[SEED] Sample pizzas successfully seeded.');
    } else {
      console.log(`[SEED] Pizza catalog already initialized (${pizzaCount} records).`);
    }

    const ingredientCount = await Ingredient.countDocuments();
    if (ingredientCount === 0) {
      console.log('[SEED] Seeding 23 customizable ingredients across 4 categories...');
      await Ingredient.insertMany(SAMPLE_INGREDIENTS);
      console.log('[SEED] Ingredients successfully seeded.');
    } else {
      console.log(`[SEED] Ingredient repository already initialized (${ingredientCount} records).`);
    }
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed initial data:', error);
  }
};
