import { InventoryItem } from '../models/InventoryItem.js';
import { Ingredient } from '../models/Ingredient.js';
import { StockAdjustment } from '../models/StockAdjustment.js';

export const SAMPLE_INVENTORY_ITEMS = [
  // 1. PIZZA BASES
  {
    name: 'Classic Thin Crust',
    category: 'pizza_base',
    sku: 'BASE-THIN-01',
    currentStock: 45,
    lowStockThreshold: 10,
    unit: 'crusts',
    isActive: true,
    description: 'Crisp, lightweight European-style thin crust.',
    isSampleData: true,
  },
  {
    name: 'Hand-Tossed Base',
    category: 'pizza_base',
    sku: 'BASE-TOSS-01',
    currentStock: 60,
    lowStockThreshold: 15,
    unit: 'crusts',
    isActive: true,
    description: '48h cold fermented sourdough base with blistered crust.',
    isSampleData: true,
  },
  {
    name: 'Golden Pan Crust',
    category: 'pizza_base',
    sku: 'BASE-PAN-01',
    currentStock: 30,
    lowStockThreshold: 8,
    unit: 'crusts',
    isActive: true,
    description: 'Fluffy, thick-crust base pan-fried in extra virgin olive oil.',
    isSampleData: true,
  },
  {
    name: 'Whole Wheat Organic',
    category: 'pizza_base',
    sku: 'BASE-WHEAT-01',
    currentStock: 25,
    lowStockThreshold: 8,
    unit: 'crusts',
    isActive: true,
    description: '100% stone-ground whole wheat artisan dough.',
    isSampleData: true,
  },
  {
    name: 'Molten Cheese Burst',
    category: 'pizza_base',
    sku: 'BASE-BURST-01',
    currentStock: 20,
    lowStockThreshold: 5,
    unit: 'crusts',
    isActive: true,
    description: 'Double-crust filled with molten cheese core.',
    isSampleData: true,
  },

  // 2. SAUCES
  {
    name: 'Classic Tomato Sauce',
    category: 'sauce',
    sku: 'SAUCE-TOM-01',
    currentStock: 75,
    lowStockThreshold: 15,
    unit: 'portions',
    isActive: true,
    description: 'Slow-simmered San Marzano tomatoes with sweet basil.',
    isSampleData: true,
  },
  {
    name: 'Pesto Sauce',
    category: 'sauce',
    sku: 'SAUCE-PESTO-01',
    currentStock: 35,
    lowStockThreshold: 10,
    unit: 'portions',
    isActive: true,
    description: 'Fresh basil, pine nuts, olive oil, and aged Pecorino.',
    isSampleData: true,
  },
  {
    name: 'Spicy Marinara',
    category: 'sauce',
    sku: 'SAUCE-MARI-01',
    currentStock: 40,
    lowStockThreshold: 10,
    unit: 'portions',
    isActive: true,
    description: 'Garlic and crushed red chili flakes in plum tomatoes.',
    isSampleData: true,
  },
  {
    name: 'Creamy Alfredo White',
    category: 'sauce',
    sku: 'SAUCE-ALF-01',
    currentStock: 30,
    lowStockThreshold: 8,
    unit: 'portions',
    isActive: true,
    description: 'Velvety butter, cream, and Parmigiano reduction.',
    isSampleData: true,
  },
  {
    name: 'Smoky Barbecue',
    category: 'sauce',
    sku: 'SAUCE-BBQ-01',
    currentStock: 35,
    lowStockThreshold: 8,
    unit: 'portions',
    isActive: true,
    description: 'Oak-smoked tomato sauce with sweet hickory molasses.',
    isSampleData: true,
  },

  // 3. CHEESES
  {
    name: 'Mozzarella',
    category: 'cheese',
    sku: 'CHEESE-MOZZ-01',
    currentStock: 80,
    lowStockThreshold: 20,
    unit: 'portions',
    isActive: true,
    description: 'Classic artisanal mozzarella with creamy texture.',
    isSampleData: true,
  },
  {
    name: 'Cheddar',
    category: 'cheese',
    sku: 'CHEESE-CHED-01',
    currentStock: 45,
    lowStockThreshold: 12,
    unit: 'portions',
    isActive: true,
    description: 'Sharp aged farm cheddar with tangy savory depth.',
    isSampleData: true,
  },
  {
    name: 'Parmigiano Reggiano DOP',
    category: 'cheese',
    sku: 'CHEESE-PARM-01',
    currentStock: 25,
    lowStockThreshold: 6,
    unit: 'portions',
    isActive: true,
    description: 'Finely grated authentic 24-month Italian Parmesan.',
    isSampleData: true,
  },
  {
    name: 'Plant-Based Vegan Cheese',
    category: 'cheese',
    sku: 'CHEESE-VEG-01',
    currentStock: 18,
    lowStockThreshold: 5,
    unit: 'portions',
    isActive: true,
    description: 'Cashew and coconut milk dairy-free melt.',
    isSampleData: true,
  },

  // 4. VEGETABLES
  {
    name: 'Onion',
    category: 'vegetable',
    sku: 'VEG-ONION-01',
    currentStock: 90,
    lowStockThreshold: 20,
    unit: 'portions',
    isActive: true,
    description: 'Crisp red onion slices for sweet savory caramelization.',
    isSampleData: true,
  },
  {
    name: 'Capsicum',
    category: 'vegetable',
    sku: 'VEG-CAPS-01',
    currentStock: 85,
    lowStockThreshold: 20,
    unit: 'portions',
    isActive: true,
    description: 'Fresh crisp green bell peppers in ribbon slices.',
    isSampleData: true,
  },
  {
    name: 'Mushroom',
    category: 'vegetable',
    sku: 'VEG-MUSH-01',
    currentStock: 60,
    lowStockThreshold: 15,
    unit: 'portions',
    isActive: true,
    description: 'Button mushrooms pan-roasted with mountain thyme.',
    isSampleData: true,
  },
  {
    name: 'Sweet Corn',
    category: 'vegetable',
    sku: 'VEG-CORN-01',
    currentStock: 70,
    lowStockThreshold: 15,
    unit: 'portions',
    isActive: true,
    description: 'Sweet American corn kernels with juicy crunch.',
    isSampleData: true,
  },
  {
    name: 'Roma Tomatoes',
    category: 'vegetable',
    sku: 'VEG-TOM-01',
    currentStock: 65,
    lowStockThreshold: 15,
    unit: 'portions',
    isActive: true,
    description: 'Diced sun-ripened Roma tomatoes.',
    isSampleData: true,
  },
  {
    name: 'Kalamata Black Olives',
    category: 'vegetable',
    sku: 'VEG-OLIV-01',
    currentStock: 50,
    lowStockThreshold: 12,
    unit: 'portions',
    isActive: true,
    description: 'Pitted Mediterranean black olives in savory brine.',
    isSampleData: true,
  },
  {
    name: 'Jalapeños',
    category: 'vegetable',
    sku: 'VEG-JAL-01',
    currentStock: 45,
    lowStockThreshold: 10,
    unit: 'portions',
    isActive: true,
    description: 'Fiery pepper rings pickled in spiced vinegar.',
    isSampleData: true,
  },
  {
    name: 'Baby Spinach',
    category: 'vegetable',
    sku: 'VEG-SPIN-01',
    currentStock: 35,
    lowStockThreshold: 8,
    unit: 'portions',
    isActive: true,
    description: 'Tender baby spinach leaves.',
    isSampleData: true,
  },
  {
    name: 'Pineapple',
    category: 'vegetable',
    sku: 'VEG-PINE-01',
    currentStock: 30,
    lowStockThreshold: 8,
    unit: 'portions',
    isActive: true,
    description: 'Juicy roasted sweet pineapple chunks.',
    isSampleData: true,
  },
];

/**
 * Seed initial inventory items and create initial stock adjustment audit records
 */
export async function seedInitialInventory() {
  try {
    const existingCount = await InventoryItem.countDocuments();
    if (existingCount > 0) {
      console.log(`[SEED] Inventory ledger already initialized (${existingCount} items).`);
      return;
    }

    console.log('[SEED] Seeding 23 sample inventory items across 4 categories...');

    for (const itemData of SAMPLE_INVENTORY_ITEMS) {
      // Find corresponding Ingredient if available to link IDs
      let linkedIngredient = await Ingredient.findOne({
        name: new RegExp(itemData.name.split(' ')[0], 'i'),
      });

      const invDoc = new InventoryItem({
        ...itemData,
        linkedIngredientId: linkedIngredient?.id || null,
      });

      await invDoc.save();

      // Log initial seed audit adjustment
      const audit = new StockAdjustment({
        inventoryItemId: invDoc.id,
        itemSku: invDoc.sku,
        itemName: invDoc.name,
        previousQuantity: 0,
        adjustmentAmount: invDoc.currentStock,
        newQuantity: invDoc.currentStock,
        reason: 'Initial sample inventory baseline seed',
        adminName: 'System Seeder',
        type: 'initial_seed',
      });
      await audit.save();
    }

    console.log('[SEED] Sample inventory ledger successfully initialized.');
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed inventory:', error.message);
  }
}

// Standalone CLI execution
if (process.argv[1]?.includes('seed-inventory.js')) {
  seedInitialInventory()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default seedInitialInventory;
