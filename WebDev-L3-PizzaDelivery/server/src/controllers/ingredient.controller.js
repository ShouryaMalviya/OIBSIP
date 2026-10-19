import { Ingredient } from '../models/Ingredient.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Get all customizable ingredients grouped by category
 */
export const getAllIngredients = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find();

    const grouped = {
      base: ingredients.filter((i) => i.category === 'base'),
      sauce: ingredients.filter((i) => i.category === 'sauce'),
      cheese: ingredients.filter((i) => i.category === 'cheese'),
      veggie: ingredients.filter((i) => i.category === 'veggie'),
    };

    return sendSuccess(res, 200, 'Customizable ingredients retrieved', {
      total: ingredients.length,
      grouped,
      all: ingredients,
    });
  } catch (error) {
    next(error);
  }
};
