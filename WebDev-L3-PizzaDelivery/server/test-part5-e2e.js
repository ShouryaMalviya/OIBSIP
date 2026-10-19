import axios from 'axios';
import crypto from 'crypto';
import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
const RAZORPAY_KEY_SECRET = 'pv_sec_test_SecretKey2026';

function generateValidSignature(orderId, paymentId) {
  return crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

async function runPart5E2ETests() {
  console.log('========================================================================');
  console.log('🍕 PizzaVerse Part 5 Verification Suite: Real-Time Order Tracking & E2E');
  console.log('========================================================================\n');

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

  let customerSocket = null;
  let intruderSocket = null;
  let adminSocket = null;

  try {
    // ------------------------------------------------------------------
    // STEP 1: Verify Server Health & Part 5 Real-Time Features
    // ------------------------------------------------------------------
    console.log('[STAGE 1] System Health & Service Metadata');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Health check returns 200 OK');
    assert(
      healthRes.data.version.includes('Part 5'),
      `Health check version reflects Part 5: "${healthRes.data.version}"`
    );
    assert(
      healthRes.data.features?.socketIO === true && healthRes.data.features?.realTimeTracking === true,
      'Health check confirms socketIO and realTimeTracking features enabled'
    );

    // ------------------------------------------------------------------
    // STEP 2: Socket.IO Authentication Security
    // ------------------------------------------------------------------
    console.log('\n[STAGE 2] Socket.IO JWT Authentication Security');

    // 2.1 Unauthenticated socket connection must be rejected
    const unauthenticatedConnPromise = new Promise((resolve) => {
      const socket = io(SOCKET_URL, {
        reconnection: false,
        timeout: 3000,
      });
      socket.on('connect_error', (err) => {
        socket.disconnect();
        resolve({ rejected: true, message: err.message });
      });
      socket.on('connect', () => {
        socket.disconnect();
        resolve({ rejected: false });
      });
    });

    const unauthResult = await unauthenticatedConnPromise;
    assert(
      unauthResult.rejected === true && unauthResult.message.includes('Authentication required'),
      `Unauthenticated Socket.IO connection rejected: "${unauthResult.message}"`
    );

    // ------------------------------------------------------------------
    // STEP 3: Customer Registration, Verification & Socket Auth
    // ------------------------------------------------------------------
    console.log('\n[STAGE 3] Customer Registration & Authorized Socket Handshake');

    const customerEmail = `pizzalover_${Date.now()}@pizzaverse.local`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Mario Rossi',
      email: customerEmail,
      password: 'ArtisanPassword123!',
    });
    assert(regRes.status === 201, `Customer registered successfully: ${customerEmail}`);
    const devToken = regRes.data.data.devVerificationToken;

    // Verify customer email
    const verifyRes = await axios.post(`${BASE_URL}/auth/verify-email`, { token: devToken });
    assert(verifyRes.data.data.user.isEmailVerified === true, 'Customer email verified');

    // Customer Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: customerEmail,
      password: 'ArtisanPassword123!',
    });
    const customerToken = loginRes.data.data.token;
    const customerUser = loginRes.data.data.user;
    assert(!!customerToken, 'Customer authenticated and received JWT token');

    const customerClient = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    // Connect Customer to Socket.IO with valid JWT
    customerSocket = io(SOCKET_URL, {
      auth: { token: customerToken },
      reconnection: false,
      timeout: 5000,
    });

    const customerConnectedPromise = new Promise((resolve, reject) => {
      customerSocket.on('connect', () => resolve(true));
      customerSocket.on('connect_error', (err) => reject(err));
    });
    await customerConnectedPromise;
    assert(customerSocket.connected === true, 'Customer connected to Socket.IO server via JWT');

    // ------------------------------------------------------------------
    // STEP 4: Build Custom Artisanal Pizza & Place Pending Order
    // ------------------------------------------------------------------
    console.log('\n[STAGE 4] Custom Pizza Building, Pricing & Checkout');

    // Fetch bases, sauces, cheeses, and multiple veggies
    const ingRes = await axios.get(`${BASE_URL}/ingredients`);
    const { base: bases, sauce: sauces, cheese: cheeses, veggie: veggies } = ingRes.data.data.grouped;

    const base = bases[0];
    const sauce = sauces[0];
    const cheese = cheeses[0];
    const selectedVeggies = veggies.slice(0, 3); // 3 veggies!

    assert(
      base && sauce && cheese && selectedVeggies.length >= 3,
      'Catalog loaded with required bases, sauces, cheeses, and multiple vegetables'
    );

    // Add custom pizza to customer cart
    const cartRes = await customerClient.post('/cart/items', {
      itemType: 'custom',
      customPizza: {
        name: 'The Artisan Supreme',
        baseId: base.id,
        sauceId: sauce.id,
        cheeseId: cheese.id,
        veggieIds: selectedVeggies.map((v) => v.id),
      },
      quantity: 2,
    });
    assert(cartRes.status === 200 || cartRes.status === 201, 'Custom pizza added to customer cart with 3 vegetables');

    // Initialize checkout order
    const checkoutRes = await customerClient.post('/orders/create-checkout', {
      deliveryAddress: {
        fullName: 'Mario Rossi',
        phone: '9876543210',
        street: '12 Via Napoli, Suite 4',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        instructions: 'Ring bell twice please',
      },
    });

    assert(checkoutRes.status === 201, 'Checkout order created successfully');
    const order = checkoutRes.data.data.order;
    const razorpayData = checkoutRes.data.data.razorpay;
    assert(order.orderStatus === 'awaiting_payment', 'Order status initialized to "awaiting_payment"');
    assert(order.paymentStatus === 'pending', 'Payment status initialized to "pending"');
    assert(!!razorpayData.orderId, `Razorpay order generated: ${razorpayData.orderId}`);

    // ------------------------------------------------------------------
    // STEP 5: Socket.IO Room Authorization Security
    // ------------------------------------------------------------------
    console.log('\n[STAGE 5] Socket Subscription Authorization & Intruder Prevention');

    // 5.1 Register a second (intruder) customer
    const intruderEmail = `intruder_${Date.now()}@pizzaverse.local`;
    const intruderReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Intruder User',
      email: intruderEmail,
      password: 'IntruderPass123!',
    });
    const intruderDevToken = intruderReg.data.data.devVerificationToken;
    await axios.post(`${BASE_URL}/auth/verify-email`, { token: intruderDevToken });

    const intruderLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: intruderEmail,
      password: 'IntruderPass123!',
    });
    const intruderToken = intruderLogin.data.data.token;

    intruderSocket = io(SOCKET_URL, {
      auth: { token: intruderToken },
      reconnection: false,
    });
    await new Promise((resolve) => intruderSocket.on('connect', resolve));

    // Intruder attempts to subscribe to Mario's order
    const intruderSubPromise = new Promise((resolve) => {
      intruderSocket.emit('order:subscribe', { orderId: order.id }, (ack) => {
        resolve(ack);
      });
      intruderSocket.on('order:error', (err) => resolve(err));
    });

    const intruderSubResult = await intruderSubPromise;
    assert(
      intruderSubResult.success === false && intruderSubResult.message.includes('Unauthorized'),
      `Intruder prevented from subscribing to Mario's order: "${intruderSubResult.message}"`
    );

    // 5.2 Customer subscribes to their OWN order -> Must be authorized
    const customerSubPromise = new Promise((resolve) => {
      customerSocket.emit('order:subscribe', { orderId: order.id }, (ack) => {
        resolve(ack);
      });
    });
    const customerSubResult = await customerSubPromise;
    assert(
      customerSubResult.success === true && customerSubResult.orderId === order.id,
      `Customer successfully subscribed to their own order: room="${customerSubResult.room}"`
    );

    // ------------------------------------------------------------------
    // STEP 6: Admin Login & Socket Channel Subscription
    // ------------------------------------------------------------------
    console.log('\n[STAGE 6] Admin Authentication & Operational Real-Time Channels');

    const adminLoginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'admin@pizzaverse.local',
      password: 'AdminMasterPass2026!',
    });
    assert(adminLoginRes.status === 200, 'Admin authenticated via /admin/auth/login');
    const adminToken = adminLoginRes.data.data.token;

    const adminClient = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    adminSocket = io(SOCKET_URL, {
      auth: { token: adminToken },
      reconnection: false,
    });
    await new Promise((resolve) => adminSocket.on('connect', resolve));
    assert(adminSocket.connected === true, 'Admin connected to Socket.IO');

    // ------------------------------------------------------------------
    // STEP 7: Razorpay Payment Verification & Order Confirmation
    // ------------------------------------------------------------------
    console.log('\n[STAGE 7] Payment Verification & Stock Commitment');

    const paymentId = `pay_${Date.now()}`;
    const validSignature = generateValidSignature(razorpayData.orderId, paymentId);

    // Set up listeners for new order broadcast on admin channel
    const adminNewOrderPromise = new Promise((resolve) => {
      adminSocket.on('admin:newOrder', (data) => resolve(data));
    });

    const verifyPayRes = await customerClient.post('/orders/verify-payment', {
      orderId: order.id,
      razorpayOrderId: razorpayData.orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
    });

    assert(verifyPayRes.status === 200, 'Payment verified with HMAC-SHA256 signature');
    assert(verifyPayRes.data.data.order.orderStatus === 'received', 'Order moved to "received"');
    assert(verifyPayRes.data.data.order.paymentStatus === 'paid', 'Payment status marked "paid"');

    // Check admin received real-time notification of new order
    const adminNewOrder = await Promise.race([
      adminNewOrderPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout awaiting admin:newOrder')), 3000)),
    ]);
    assert(
      adminNewOrder.orderNumber === order.orderNumber,
      `Admin received real-time "admin:newOrder" event for order #${adminNewOrder.orderNumber}`
    );

    // ------------------------------------------------------------------
    // STEP 8: Real-Time Order Lifecycle Transitions (Kitchen -> Delivery -> Delivered)
    // ------------------------------------------------------------------
    console.log('\n[STAGE 8] Real-Time Status Transitions & Customer Dashboard Updates');

    // 8.1 Admin advances order: received -> in_kitchen
    const kitchenPromise = new Promise((resolve) => {
      customerSocket.once('order:statusUpdated', (data) => resolve(data));
    });

    const kitchenRes = await adminClient.patch(`/admin/orders/${order.id}/status`, {
      status: 'in_kitchen',
      reason: 'Oven master tossing dough',
    });
    assert(kitchenRes.status === 200, 'Admin PATCH status -> "in_kitchen" succeeded');

    const kitchenEvent = await Promise.race([
      kitchenPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout awaiting in_kitchen socket event')), 3000)),
    ]);
    assert(
      kitchenEvent.orderStatus === 'in_kitchen' && kitchenEvent.orderId === order.id,
      'Customer socket received real-time event: orderStatus = "in_kitchen"'
    );

    // 8.2 Admin advances order: in_kitchen -> sent_to_delivery
    const deliveryPromise = new Promise((resolve) => {
      customerSocket.once('order:statusUpdated', (data) => resolve(data));
    });

    const deliveryRes = await adminClient.patch(`/admin/orders/${order.id}/status`, {
      status: 'sent_to_delivery',
      reason: 'Assigned to courier bike',
    });
    assert(deliveryRes.status === 200, 'Admin PATCH status -> "sent_to_delivery" succeeded');

    const deliveryEvent = await Promise.race([
      deliveryPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout awaiting sent_to_delivery socket event')), 3000)),
    ]);
    assert(
      deliveryEvent.orderStatus === 'sent_to_delivery',
      'Customer socket received real-time event: orderStatus = "sent_to_delivery"'
    );

    // 8.3 Admin advances order: sent_to_delivery -> delivered
    const deliveredPromise = new Promise((resolve) => {
      customerSocket.once('order:statusUpdated', (data) => resolve(data));
    });

    const deliveredRes = await adminClient.patch(`/admin/orders/${order.id}/status`, {
      status: 'delivered',
      reason: 'Delivered to recipient',
    });
    assert(deliveredRes.status === 200, 'Admin PATCH status -> "delivered" succeeded');

    const deliveredEvent = await Promise.race([
      deliveredPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout awaiting delivered socket event')), 3000)),
    ]);
    assert(
      deliveredEvent.orderStatus === 'delivered',
      'Customer socket received real-time event: orderStatus = "delivered"'
    );

    // ------------------------------------------------------------------
    // STEP 9: Authoritative REST Polling Fallback Verification
    // ------------------------------------------------------------------
    console.log('\n[STAGE 9] REST Tracking Endpoint & Polling Fallback');

    const trackingRes = await customerClient.get(`/tracking/${order.id}`);
    assert(trackingRes.status === 200, 'GET /api/tracking/:id returns 200 OK');
    const trackData = trackingRes.data.data;
    assert(
      trackData.orderStatus === 'delivered' && trackData.currentStageIndex === 3,
      `REST tracking confirms final stage: "${trackData.orderStatus}" (stage index 3)`
    );
    assert(trackData.isDelivered === true, 'trackData.isDelivered is true');
    assert(Array.isArray(trackData.statusHistory) && trackData.statusHistory.length >= 4, 'Full audit trail of 4 stages persisted in statusHistory');

    // ------------------------------------------------------------------
    // STEP 10: Real-Time Inventory Stock Alerts & Adjustment Broadcast
    // ------------------------------------------------------------------
    console.log('\n[STAGE 10] Real-Time Inventory Adjustment & Alert Dispatch');

    const stockChangePromise = new Promise((resolve) => {
      adminSocket.once('admin:stockChanged', (data) => resolve(data));
    });

    const invRes = await adminClient.get('/admin/inventory');
    const invItem = invRes.data.data.items[0];

    const adjustRes = await adminClient.post(`/admin/inventory/${invItem.id}/adjust`, {
      adjustmentAmount: 25,
      reason: 'Fresh sourdough batch delivered by supplier',
    });
    assert(adjustRes.status === 200, 'Admin manual stock adjustment +25 executed');

    const stockEvent = await Promise.race([
      stockChangePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout awaiting admin:stockChanged')), 3000)),
    ]);
    assert(
      stockEvent.id === invItem.id || stockEvent.sku === invItem.sku,
      `Admin received real-time "admin:stockChanged" for SKU "${stockEvent.sku}"`
    );

    // Trigger low stock scan
    const scanRes = await adminClient.post('/admin/inventory/trigger-scan');
    assert(scanRes.status === 200, 'Manual low-stock scan completed');
    assert(
      typeof scanRes.data.data.scanned === 'number',
      `Low-stock scan processed ${scanRes.data.data.scanned} active ingredients`
    );

    console.log('\n========================================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

  } catch (error) {
    console.error('\n❌ Unhandled error during Part 5 test execution:', error.response?.data || error.message);
    failed++;
  } finally {
    // Cleanup sockets
    if (customerSocket) customerSocket.disconnect();
    if (intruderSocket) intruderSocket.disconnect();
    if (adminSocket) adminSocket.disconnect();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runPart5E2ETests();
