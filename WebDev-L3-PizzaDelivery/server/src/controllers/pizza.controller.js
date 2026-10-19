import { Pizza } from '../models/Pizza.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get all pizzas from catalog with optional filtering
 */
export const getAllPizzas = async (req, res, next) => {
  try {
    const { category, featured, search, availableOnly } = req.query;

    const filter = {};
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (featured === 'true') {
      filter.isFeatured = true;
    }
    if (availableOnly === 'true') {
      filter.isAvailable = true;
    }

    let pizzas = await Pizza.find(filter);

    // In-memory search filter if search parameter passed
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      pizzas = pizzas.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.ingredients || []).some((ing) => ing.toLowerCase().includes(q))
      );
    }

    return sendSuccess(res, 200, 'Pizzas retrieved successfully', {
      count: pizzas.length,
      pizzas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single pizza by ID
 */
export const getPizzaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pizza = await Pizza.findById(id);

    if (!pizza) {
      return sendError(res, 404, 'Pizza not found in catalog');
    }

    return sendSuccess(res, 200, 'Pizza details retrieved', { pizza });
  } catch (error) {
    next(error);
  }
};
