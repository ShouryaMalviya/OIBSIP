import api from './api';

export const pizzaService = {
  // Fetch all pizzas
  async getPizzas(params = {}) {
    const res = await api.get('/pizzas', { params });
    return res.data;
  },

  // Fetch single pizza
  async getPizzaById(id) {
    const res = await api.get(`/pizzas/${id}`);
    return res.data;
  },

  // Fetch builder ingredients
  async getIngredients() {
    const res = await api.get('/ingredients');
    return res.data;
  },

  // Calculate authoritative custom price
  async calculateCustomPrice(payload) {
    const res = await api.post('/pricing/calculate-custom', payload);
    return res.data;
  },

  // Cart operations
  async getCart(cartToken) {
    const headers = cartToken ? { 'x-cart-token': cartToken } : {};
    const res = await api.get('/cart', { headers });
    return res.data;
  },

  async addToCart(item, cartToken) {
    const headers = cartToken ? { 'x-cart-token': cartToken } : {};
    const res = await api.post('/cart/items', item, { headers });
    return res.data;
  },

  async updateQuantity(itemId, quantity, cartToken) {
    const headers = cartToken ? { 'x-cart-token': cartToken } : {};
    const res = await api.patch(`/cart/items/${itemId}`, { quantity }, { headers });
    return res.data;
  },

  async updateCustomPizza(itemId, customPizza, cartToken) {
    const headers = cartToken ? { 'x-cart-token': cartToken } : {};
    const res = await api.put(`/cart/items/${itemId}/custom`, { customPizza }, { headers });
    return res.data;
  },

  async removeFromCart(itemId, cartToken) {
    const headers = cartToken ? { 'x-cart-token': cartToken } : {};
    const res = await api.delete(`/cart/items/${itemId}`, { headers });
    return res.data;
  },

  async clearCart(cartToken) {
    const headers = cartToken ? { 'x-cart-token': cartToken } : {};
    const res = await api.delete('/cart', { headers });
    return res.data;
  },
};

export default pizzaService;
