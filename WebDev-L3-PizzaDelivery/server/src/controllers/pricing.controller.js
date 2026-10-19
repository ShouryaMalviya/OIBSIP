import { Ingredient } from '../models/Ingredient.js';
import { calculateCustomPizzaUnitPrice, formatINR, PRICING_CONFIG } from '../utils/pricing.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Calculate authoritative custom pizza price based on verified database records
 */
export const calculateCustomPrice = async (req, res, next) => {
  try {
    const { baseId, sauceId, cheeseId, veggieIds = [] } = req.body;

    // Validate and fetch base
    const base = baseId ? await Ingredient.findById(baseId) : null;
    if (baseId && !base) {
      return sendError(res, 400, `Invalid crust base ID: ${baseId}`);
    }

    // Validate and fetch sauce
    const sauce = sauceId ? await Ingredient.findById(sauceId) : null;
    if (sauceId && !sauce) {
      return sendError(res, 400, `Invalid sauce ID: ${sauceId}`);
    }

    // Validate and fetch cheese
    const cheese = cheeseId ? await Ingredient.findById(cheeseId) : null;
    if (cheeseId && !cheese) {
      return sendError(res, 400, `Invalid cheese ID: ${cheeseId}`);
    }

    // Validate and fetch veggies
    const veggies = [];
    for (const vid of veggieIds) {
      const v = await Ingredient.findById(vid);
      if (!v) {
        return sendError(res, 400, `Invalid vegetable ID: ${vid}`);
      }
      veggies.push(v);
    }

    const unitPricePaise = calculateCustomPizzaUnitPrice({
      baseAdjustmentPaise: base?.priceAdjustmentPaise || 0,
      sauceAdjustmentPaise: sauce?.priceAdjustmentPaise || 0,
      cheeseAdjustmentPaise: cheese?.priceAdjustmentPaise || 0,
      veggieAdjustmentsPaise: veggies.map((v) => v.priceAdjustmentPaise),
    });

    return sendSuccess(res, 200, 'Custom pizza price calculated', {
      unitPricePaise,
      unitPriceFormatted: formatINR(unitPricePaise),
      breakdown: {
        basePricePaise: PRICING_CONFIG.BASE_CUSTOM_PIZZA_PAISE,
        basePriceFormatted: formatINR(PRICING_CONFIG.BASE_CUSTOM_PIZZA_PAISE),
        crustAdjustmentPaise: base?.priceAdjustmentPaise || 0,
        sauceAdjustmentPaise: sauce?.priceAdjustmentPaise || 0,
        cheeseAdjustmentPaise: cheese?.priceAdjustmentPaise || 0,
        veggiesCount: veggies.length,
        veggiesAdjustmentPaise: veggies.reduce((acc, v) => acc + v.priceAdjustmentPaise, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};
