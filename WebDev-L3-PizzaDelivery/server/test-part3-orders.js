import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api';
const RAZORPAY_KEY_SECRET = 'pv_sec_test_SecretKey2026';

function generateValidSignature(orderId, paymentId) {
  return crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

async function runPart3Tests() {
  console.log('===============================================================');
  console.log('🍕 PizzaVerse Part 3 Verification Suite: Orders, Inventory & Razorpay');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert(
      healthRes.status === 200 && (healthRes.data.version.includes('Part 3') || healthRes.data.version.includes('Part 4') || healthRes.data.version.includes('Part 5')),
      `Health check reports valid version: "${healthRes.data.version}"`
    );

    // 2. Register, verify & login customer A
    const userAEmail = `chef.mario_${Date.now()}@pizzaverse.local`;
    const regResA = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Mario Rossi',
      email: userAEmail,
      password: 'SuperPassword123!',
    });
    const devTokenA = regResA.data.data.devVerificationToken;
    await axios.post(`${BASE_URL}/auth/verify-email`, { token: devTokenA });
    const loginResA = await axios.post(`${BASE_URL}/auth/login`, {
      email: userAEmail,
      password: 'SuperPassword123!',
    });
    const tokenA = loginResA.data.data.token;
    const clientA = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(!!tokenA, 'Registered, verified and authenticated Customer A with JWT');

    // 3. Register, verify & login customer B (for cross-user authorization tests)
    const userBEmail = `luigi_${Date.now()}@pizzaverse.local`;
    const regResB = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Luigi Rossi',
      email: userBEmail,
      password: 'SuperPassword123!',
    });
    const devTokenB = regResB.data.data.devVerificationToken;
    await axios.post(`${BASE_URL}/auth/verify-email`, { token: devTokenB });
    const loginResB = await axios.post(`${BASE_URL}/auth/login`, {
      email: userBEmail,
      password: 'SuperPassword123!',
    });
    const tokenB = loginResB.data.data.token;
    const clientB = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(!!tokenB, 'Registered, verified and authenticated Customer B with JWT');

    // 4. Retrieve catalog pizzas
    const pizzasRes = await clientA.get('/pizzas');
    const availablePizza = pizzasRes.data.data.pizzas.find((p) => p.isAvailable);
    const unavailablePizza = pizzasRes.data.data.pizzas.find((p) => !p.isAvailable);
    assert(!!availablePizza, `Found available catalog pizza: "${availablePizza.name}" (₹${availablePizza.basePricePaise / 100})`);
    assert(!!unavailablePizza, `Found out-of-stock pizza: "${unavailablePizza.name}"`);

    // 5. Verify out-of-stock rejection
    try {
      await clientA.post('/cart/items', {
        itemType: 'catalog',
        pizzaId: unavailablePizza.id,
        quantity: 1,
      });
      assert(false, 'Should have rejected adding out-of-stock pizza to cart');
    } catch (err) {
      assert(err.response?.status === 400, 'Successfully rejected out-of-stock pizza with 400 Bad Request');
    }

    // 6. Add available pizza to Cart
    const addCartRes = await clientA.post('/cart/items', {
      itemType: 'catalog',
      pizzaId: availablePizza.id,
      quantity: 2,
    });
    assert(addCartRes.status === 201, 'Successfully added 2 pizzas to Customer A cart');

    // 7. Initialize Checkout Order
    const address = {
      fullName: 'Mario Rossi',
      phone: '+91 98765 43210',
      street: '74 Via dell Abondanza',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      instructions: 'Ring bell twice and leave at concierge',
    };

    const checkoutRes = await clientA.post('/orders/create-checkout', {
      deliveryAddress: address,
    });
    assert(checkoutRes.status === 201, 'Order checkout created successfully (201)');

    const orderData = checkoutRes.data.data.order;
    const razorpayData = checkoutRes.data.data.razorpay;

    assert(orderData.orderNumber.startsWith('PV-'), `Order Number has valid prefix: ${orderData.orderNumber}`);
    assert(orderData.orderStatus === 'awaiting_payment', `Order Status is "awaiting_payment"`);
    assert(orderData.paymentStatus === 'pending', `Payment Status is "pending"`);
    assert(orderData.inventoryStatus === 'reserved', `Inventory Status is "reserved"`);
    assert(!!razorpayData.orderId, `Razorpay Order ID issued: ${razorpayData.orderId}`);
    assert(razorpayData.currency === 'INR', `Currency strictly enforced as INR`);

    // Authoritative pricing check
    const expectedSubtotal = availablePizza.basePricePaise * 2;
    const expectedTax = Math.round(expectedSubtotal * 0.05);
    const expectedDelivery = expectedSubtotal >= 50000 ? 0 : 4900;
    const expectedGrandTotal = expectedSubtotal + expectedDelivery + expectedTax;

    assert(orderData.subtotalPaise === expectedSubtotal, `Subtotal paise verified: ${orderData.subtotalPaise} vs expected ${expectedSubtotal}`);
    assert(orderData.grandTotalPaise === expectedGrandTotal, `Grand total paise verified: ${orderData.grandTotalPaise} vs expected ${expectedGrandTotal}`);

    // 8. Test Forged / Tampered Payment Signature Rejection
    const fakePaymentId = `pay_pv_fake_${Date.now()}`;
    const forgedSignature = '0000000000000000000000000000000000000000000000000000000000000000';

    try {
      await clientA.post('/orders/verify-payment', {
        orderId: orderData.id,
        razorpayOrderId: razorpayData.orderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: forgedSignature,
      });
      assert(false, 'Should have rejected forged payment signature');
    } catch (err) {
      assert(err.response?.status === 400, 'Security: Forged payment signature rejected with 400 Bad Request');
    }

    // 9. Verify with mathematically valid signature
    const validPaymentId = `pay_pv_test_${Date.now()}`;
    const validSignature = generateValidSignature(razorpayData.orderId, validPaymentId);

    const verifyRes = await clientA.post('/orders/verify-payment', {
      orderId: orderData.id,
      razorpayOrderId: razorpayData.orderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
    });

    assert(verifyRes.status === 200, 'Payment verified successfully (200)');
    const verifiedOrder = verifyRes.data.data.order;
    assert(verifiedOrder.paymentStatus === 'paid', 'Order paymentStatus updated to "paid"');
    assert(verifiedOrder.orderStatus === 'received', 'Order orderStatus transitioned to "received"');
    assert(verifiedOrder.inventoryStatus === 'committed', 'Inventory status transitioned to "committed"');

    // 10. Check Cart was emptied upon verified payment
    const cartAfterPayment = await clientA.get('/cart');
    assert(cartAfterPayment.data.data.items.length === 0, 'User cart automatically cleared after payment verification');

    // 11. Idempotency check: Resend same verification request
    const duplicateVerifyRes = await clientA.post('/orders/verify-payment', {
      orderId: orderData.id,
      razorpayOrderId: razorpayData.orderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
    });
    assert(duplicateVerifyRes.status === 200, 'Duplicate payment verification handled idempotently');
    assert(duplicateVerifyRes.data.data.alreadyProcessed === true, 'Duplicate response flags alreadyProcessed: true');

    // 12. Security: Unauthorized order access test
    // Customer B tries to view Customer A's order
    try {
      await clientB.get(`/orders/${orderData.id}`);
      assert(false, 'Should have blocked Customer B from accessing Customer A order');
    } catch (err) {
      assert(err.response?.status === 403, 'Security: Unauthorized order access blocked with 403 Forbidden');
    }

    // 13. Customer A Order History
    const myOrdersRes = await clientA.get('/orders/my-orders');
    assert(myOrdersRes.status === 200, 'Retrieved Customer A order history (200)');
    assert(myOrdersRes.data.data.orders.length >= 1, `Found ${myOrdersRes.data.data.orders.length} order(s) in history`);
    assert(myOrdersRes.data.data.orders[0].orderNumber === orderData.orderNumber, 'Order history displays accurate orderNumber');

    // 14. Order Cancellation and Inventory Release test
    // Add item to B cart, create checkout order, then cancel
    await clientB.post('/cart/items', {
      itemType: 'catalog',
      pizzaId: availablePizza.id,
      quantity: 1,
    });
    const orderBRes = await clientB.post('/orders/create-checkout', {
      deliveryAddress: address,
    });
    const orderB = orderBRes.data.data.order;
    assert(orderB.inventoryStatus === 'reserved', 'Order B reserved inventory');

    const cancelRes = await clientB.post(`/orders/${orderB.id}/cancel`, {
      reason: 'Customer decided on custom pizza instead',
    });
    assert(cancelRes.status === 200, 'Order B cancelled successfully');
    assert(cancelRes.data.data.order.orderStatus === 'cancelled', 'Order B status is "cancelled"');
    assert(cancelRes.data.data.order.inventoryStatus === 'released', 'Order B inventory safely released/restored');

    console.log('===============================================================');
    console.log(`🎯 Test Run Completed: ${passed} Passed, ${failed} Failed`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Unexpected Test Suite Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runPart3Tests();
