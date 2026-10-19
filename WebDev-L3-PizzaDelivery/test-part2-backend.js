// Comprehensive test for Part 2 APIs: Catalog, Ingredients, Pricing, and Cart
const API_URL = 'http://localhost:5000/api';

async function runPart2Tests() {
  console.log('--- STARTING PART 2 BACKEND VERIFICATION ---');

  // 1. Pizzas catalog
  console.log('\n[1] Testing GET /api/pizzas...');
  const pizzasRes = await fetch(`${API_URL}/pizzas`);
  const pizzasData = await pizzasRes.json();
  console.log('Pizzas Count:', pizzasData.data?.count, 'Status:', pizzasRes.status);
  if (pizzasData.data?.count < 8) throw new Error('Expected at least 8 pizzas');

  const firstPizza = pizzasData.data.pizzas[0];
  console.log('First pizza sample:', firstPizza.name, `₹${firstPizza.basePricePaise / 100}`, firstPizza.category);

  // Test single pizza
  console.log('\n[2] Testing GET /api/pizzas/:id...');
  const singlePizzaRes = await fetch(`${API_URL}/pizzas/${firstPizza.id}`);
  const singlePizzaData = await singlePizzaRes.json();
  console.log('Single pizza retrieved:', singlePizzaData.data?.pizza?.name);

  // Test search
  console.log('\n[3] Testing GET /api/pizzas?search=paneer...');
  const searchRes = await fetch(`${API_URL}/pizzas?search=paneer`);
  const searchData = await searchRes.json();
  console.log('Search matches:', searchData.data?.pizzas?.map(p => p.name));

  // 4. Ingredients
  console.log('\n[4] Testing GET /api/ingredients...');
  const ingRes = await fetch(`${API_URL}/ingredients`);
  const ingData = await ingRes.json();
  console.log('Total ingredients:', ingData.data?.total);
  const { base, sauce, cheese, veggie } = ingData.data?.grouped || {};
  console.log(`Bases: ${base?.length}, Sauces: ${sauce?.length}, Cheeses: ${cheese?.length}, Veggies: ${veggie?.length}`);

  if (base.length < 5 || sauce.length < 5 || cheese.length < 4 || veggie.length < 9) {
    throw new Error('Ingredients count did not meet builder requirements');
  }

  // 5. Pricing Engine API
  console.log('\n[5] Testing POST /api/pricing/calculate-custom...');
  const sampleBase = base[1]; // Hand-Tossed (+₹30 = 3000)
  const sampleSauce = sauce[1]; // Spicy Marinara (+₹20 = 2000)
  const sampleCheese = cheese[1]; // Cheddar (+₹40 = 4000)
  const sampleVeggies = [veggie[0], veggie[1], veggie[2]]; // Onion(2500) + Capsicum(2500) + Mushroom(3500) = 8500

  // Expected price: Base custom (19900) + 3000 + 2000 + 4000 + 8500 = 37400 paise (₹374)
  const priceCalcRes = await fetch(`${API_URL}/pricing/calculate-custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseId: sampleBase.id,
      sauceId: sampleSauce.id,
      cheeseId: sampleCheese.id,
      veggieIds: sampleVeggies.map(v => v.id),
    }),
  });
  const priceCalcData = await priceCalcRes.json();
  console.log('Calculated custom unit price:', priceCalcData.data?.unitPriceFormatted, `(${priceCalcData.data?.unitPricePaise} paise)`);
  if (priceCalcData.data?.unitPricePaise !== 37400) {
    throw new Error(`Expected unitPricePaise 37400, got ${priceCalcData.data?.unitPricePaise}`);
  }

  // 6. Shopping Cart API
  console.log('\n[6] Testing GET /api/cart...');
  const cartRes = await fetch(`${API_URL}/cart`);
  const cartData = await cartRes.json();
  console.log('Initial cart items count:', cartData.data?.itemsCount);
  const cartToken = cartData.data?.cartToken;

  const cartHeaders = {
    'Content-Type': 'application/json',
    'x-cart-token': cartToken,
  };

  // 7. Add Catalog Pizza to Cart
  console.log('\n[7] Testing POST /api/cart/items (Catalog pizza: Margherita)...');
  const addCatalogRes = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: cartHeaders,
    body: JSON.stringify({
      itemType: 'catalog',
      pizzaId: firstPizza.id,
      quantity: 1,
    }),
  });
  const addCatalogData = await addCatalogRes.json();
  console.log('Catalog pizza added. Cart count:', addCatalogData.data?.itemsCount, 'Subtotal:', addCatalogData.data?.pricing?.formatted?.subtotal);

  // 8. Reject Out-of-Stock Pizza
  console.log('\n[8] Testing rejection of Out-of-Stock pizza...');
  const unavailablePizza = pizzasData.data.pizzas.find(p => !p.isAvailable);
  const outOfStockRes = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: cartHeaders,
    body: JSON.stringify({
      itemType: 'catalog',
      pizzaId: unavailablePizza.id,
      quantity: 1,
    }),
  });
  const outOfStockData = await outOfStockRes.json();
  console.log('Out-of-stock rejection status (expect 400):', outOfStockRes.status, outOfStockData.message);
  if (outOfStockRes.status !== 400) throw new Error('Expected 400 for out-of-stock item');

  // 9. Add Custom Pizza to Cart
  console.log('\n[9] Testing POST /api/cart/items (Custom pizza)...');
  const addCustomRes = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: cartHeaders,
    body: JSON.stringify({
      itemType: 'custom',
      quantity: 1,
      customPizza: {
        name: 'My Gourmet Sourdough Creation',
        baseId: sampleBase.id,
        sauceId: sampleSauce.id,
        cheeseId: sampleCheese.id,
        veggieIds: sampleVeggies.map(v => v.id),
      },
    }),
  });
  const addCustomData = await addCustomRes.json();
  console.log('Custom pizza added. Cart count:', addCustomData.data?.itemsCount);
  console.log('Cart subtotal:', addCustomData.data?.pricing?.formatted?.subtotal);
  console.log('Cart delivery fee:', addCustomData.data?.pricing?.formatted?.deliveryFee);
  console.log('Cart tax (5% GST):', addCustomData.data?.pricing?.formatted?.tax);
  console.log('Cart grand total:', addCustomData.data?.pricing?.formatted?.grandTotal);

  // Subtotal = 29900 + 37400 = 67300 paise (₹673) -> Over ₹500, so delivery fee should be FREE!
  console.log('Delivery fee check (expect FREE for ₹673):', addCustomData.data?.pricing?.deliveryFeePaise === 0 ? 'FREE ✓' : 'NOT FREE');

  const customItem = addCustomData.data.items.find(i => i.itemType === 'custom');

  // 10. Update Quantity
  console.log('\n[10] Testing PATCH /api/cart/items/:itemId (Update quantity)...');
  const updateQtyRes = await fetch(`${API_URL}/cart/items/${customItem.id}`, {
    method: 'PATCH',
    headers: cartHeaders,
    body: JSON.stringify({ quantity: 2 }),
  });
  const updateQtyData = await updateQtyRes.json();
  console.log('Updated quantity. New cart items count:', updateQtyData.data?.itemsCount);
  if (updateQtyData.data?.itemsCount !== 3) throw new Error('Expected 3 items in cart');

  // 11. Edit Custom Pizza
  console.log('\n[11] Testing PUT /api/cart/items/:itemId/custom (Edit custom pizza)...');
  const editCustomRes = await fetch(`${API_URL}/cart/items/${customItem.id}/custom`, {
    method: 'PUT',
    headers: cartHeaders,
    body: JSON.stringify({
      customPizza: {
        name: 'Modified Chef Special',
        baseId: sampleBase.id,
        sauceId: sampleSauce.id,
        cheeseId: sampleCheese.id,
        veggieIds: [sampleVeggies[0].id], // Reduced to 1 veggie
      },
    }),
  });
  const editCustomData = await editCustomRes.json();
  console.log('Edited custom pizza successfully. New subtotal:', editCustomData.data?.pricing?.formatted?.subtotal);

  // 12. Remove Item
  console.log('\n[12] Testing DELETE /api/cart/items/:itemId...');
  const removeRes = await fetch(`${API_URL}/cart/items/${customItem.id}`, {
    method: 'DELETE',
    headers: cartHeaders,
  });
  const removeData = await removeRes.json();
  console.log('Removed custom pizza. Remaining items:', removeData.data?.itemsCount);

  // 13. Clear Cart
  console.log('\n[13] Testing DELETE /api/cart (Clear Cart)...');
  const clearRes = await fetch(`${API_URL}/cart`, {
    method: 'DELETE',
    headers: cartHeaders,
  });
  const clearData = await clearRes.json();
  console.log('Cleared cart. Final items count:', clearData.data?.itemsCount);

  console.log('\n--- ALL PART 2 BACKEND ENDPOINTS & PRICING VERIFICATIONS PASSED! ---');
}

runPart2Tests().catch(err => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
