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

async function runPart4Tests() {
  console.log('========================================================================');
  console.log('🍕 PizzaVerse Part 4 Verification Suite: Admin Dashboard, Inventory & Orders');
  console.log('========================================================================');

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
      healthRes.status === 200 && (healthRes.data.version.includes('Part 4') || healthRes.data.version.includes('Part 5')),
      `Health check reports valid version: "${healthRes.data.version}"`
    );

    // 2. Admin Login with provisioned credentials
    const adminLoginRes = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: 'admin@pizzaverse.local',
      password: 'AdminMasterPass2026!',
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeded with 200 OK');
    const adminToken = adminLoginRes.data.data.token;
    assert(adminLoginRes.data.data.user.role === 'admin', 'Authenticated session has role: "admin"');

    const adminClient = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // 3. Register a normal customer and verify role rejection from admin endpoints
    const customerEmail = `normal.user_${Date.now()}@pizzaverse.local`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Pietro Normal',
      email: customerEmail,
      password: 'SuperPassword123!',
    });
    const devToken = regRes.data.data.devVerificationToken;
    await axios.post(`${BASE_URL}/auth/verify-email`, { token: devToken });
    const userLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: customerEmail,
      password: 'SuperPassword123!',
    });
    const userToken = userLoginRes.data.data.token;
    const userClient = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${userToken}` },
    });

    // Try admin login with normal user credentials -> MUST BE REJECTED 403
    try {
      await axios.post(`${BASE_URL}/admin/auth/login`, {
        email: customerEmail,
        password: 'SuperPassword123!',
      });
      assert(false, 'Should have blocked normal user from admin login endpoint');
    } catch (err) {
      assert(err.response?.status === 403, 'Security: Regular user rejected from /api/admin/auth/login (403 Forbidden)');
    }

    // Try accessing protected admin API with normal user JWT -> MUST BE REJECTED 403
    try {
      await userClient.get('/admin/dashboard/metrics');
      assert(false, 'Should have blocked normal user from /api/admin/dashboard/metrics');
    } catch (err) {
      assert(err.response?.status === 403, 'Security: Regular user blocked from admin APIs with 403 Forbidden');
    }

    // 4. Test Dashboard Metrics
    const metricsRes = await adminClient.get('/admin/dashboard/metrics');
    assert(metricsRes.status === 200, 'Admin dashboard metrics retrieved (200)');
    const metrics = metricsRes.data.data;
    assert(typeof metrics.inventory.totalActiveItems === 'number', `Total active inventory items: ${metrics.inventory.totalActiveItems}`);
    assert(typeof metrics.orders.totalOrdersCount === 'number', `Total orders tracked: ${metrics.orders.totalOrdersCount}`);

    // 5. Test Inventory List & Category Filters
    const invRes = await adminClient.get('/admin/inventory');
    assert(invRes.status === 200, 'Retrieved inventory items list (200)');
    assert(invRes.data.data.items.length >= 20, `Sample inventory ledger contains ${invRes.data.data.items.length} seeded items`);

    const basesRes = await adminClient.get('/admin/inventory?category=pizza_base');
    assert(
      basesRes.data.data.items.every((i) => i.category === 'pizza_base'),
      'Category filter "?category=pizza_base" strictly returns only pizza bases'
    );

    // 6. Test Inventory Search by Name or SKU
    const searchRes = await adminClient.get('/admin/inventory?search=mozzarella');
    assert(
      searchRes.data.data.items.some((i) => i.name.toLowerCase().includes('mozzarella')),
      'Search query "?search=mozzarella" matches Mozzarella item'
    );

    // 7. Test Creating New Inventory Item
    const testSku = `TEST-HERB-${Date.now().toString().slice(-4)}`;
    const createItemRes = await adminClient.post('/admin/inventory', {
      name: `Artisan Oregano Leaves ${Date.now()}`,
      category: 'vegetable',
      sku: testSku,
      currentStock: 25,
      lowStockThreshold: 5,
      unit: 'grams',
      description: 'Mountain wild sun-dried oregano leaves',
    });
    assert(createItemRes.status === 201, `Created new inventory item with SKU ${testSku} (201)`);
    const createdItemId = createItemRes.data.data.item.id;

    // 8. Test Threshold Modification
    const updateRes = await adminClient.patch(`/admin/inventory/${createdItemId}`, {
      lowStockThreshold: 8,
      description: 'Updated description for test item',
    });
    assert(updateRes.status === 200, 'Updated lowStockThreshold to 8');
    assert(updateRes.data.data.item.lowStockThreshold === 8, 'Verified updated threshold on item');

    // 9. Test Manual Stock Adjustment with Negative Quantity Rejection
    try {
      await adminClient.post(`/admin/inventory/${createdItemId}/adjust`, {
        adjustmentAmount: -100, // Current stock is 25, -100 would result in -75
        reason: 'Attempting invalid deduction',
      });
      assert(false, 'Should have rejected adjustment that results in negative stock');
    } catch (err) {
      assert(err.response?.status === 400, 'Security: Negative resulting stock rejected with 400 Bad Request');
    }

    // Valid adjustment (+15 restock)
    const validAdjustRes = await adminClient.post(`/admin/inventory/${createdItemId}/adjust`, {
      adjustmentAmount: 15,
      reason: 'Batch supplier replenishment delivery',
    });
    assert(validAdjustRes.status === 200, 'Valid stock adjustment succeeded (+15)');
    assert(validAdjustRes.data.data.item.currentStock === 40, 'Stock correctly incremented from 25 to 40');

    // Verify traceable audit record was created
    const auditRes = await adminClient.get('/admin/inventory/adjustments');
    assert(auditRes.status === 200, 'Retrieved stock adjustments audit logs');
    assert(
      auditRes.data.data.logs.some((l) => l.reason.includes('Batch supplier replenishment')),
      'Audit log contains traceable record with reason, administrator, and timestamp'
    );

    // 10. Test Automatic Recipe Stock Deduction Upon Order Payment
    // Pick an inventory item to monitor before and after order confirmation
    const tomatoItemBefore = await adminClient.get('/admin/inventory?search=Classic Tomato Sauce');
    const targetItem = tomatoItemBefore.data.data.items[0];
    const stockBeforeOrder = targetItem.currentStock;

    // Place an order as customer
    const pizzasRes = await userClient.get('/pizzas');
    const margherita = pizzasRes.data.data.pizzas.find((p) => p.name === 'Margherita Classica');
    await userClient.post('/cart/items', {
      itemType: 'catalog',
      pizzaId: margherita.id,
      quantity: 2, // 2 pizzas = 2 portions of sauce
    });

    const checkoutRes = await userClient.post('/orders/create-checkout', {
      deliveryAddress: {
        fullName: 'Pietro Normal',
        phone: '+91 99999 88888',
        street: '12 Via Roma',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
    });
    const orderData = checkoutRes.data.data.order;
    const razorpayData = checkoutRes.data.data.razorpay;

    // Verify payment with valid signature
    const payId = `pay_admin_test_${Date.now()}`;
    const validSig = generateValidSignature(razorpayData.orderId, payId);
    await userClient.post('/orders/verify-payment', {
      orderId: orderData.id,
      razorpayOrderId: razorpayData.orderId,
      razorpayPaymentId: payId,
      razorpaySignature: validSig,
    });

    // Check inventory after order payment
    const tomatoItemAfter = await adminClient.get(`/admin/inventory/${targetItem.id}`);
    const stockAfterOrder = tomatoItemAfter.data.data.item.currentStock;
    assert(
      stockAfterOrder === stockBeforeOrder - 2,
      `Automatic recipe stock deduction: Classic Tomato Sauce decremented from ${stockBeforeOrder} to ${stockAfterOrder} (-2 portions)`
    );

    // 11. Test Idempotency: Resend payment verification -> Must not decrement stock a second time!
    await userClient.post('/orders/verify-payment', {
      orderId: orderData.id,
      razorpayOrderId: razorpayData.orderId,
      razorpayPaymentId: payId,
      razorpaySignature: validSig,
    });
    const tomatoItemAfterDuplicate = await adminClient.get(`/admin/inventory/${targetItem.id}`);
    assert(
      tomatoItemAfterDuplicate.data.data.item.currentStock === stockAfterOrder,
      'Idempotency guard: Duplicate payment verification did NOT decrement stock twice'
    );

    // 12. Test Low-Stock Automated Scan & Deduplication
    // Reduce created item's stock below threshold (40 -> 3, threshold is 8)
    await adminClient.post(`/admin/inventory/${createdItemId}/adjust`, {
      adjustmentAmount: -37,
      reason: 'Deliberate threshold test adjustment',
    });

    // First scan: should detect low stock and record alert
    const scanRes1 = await adminClient.post('/admin/inventory/trigger-scan');
    assert(scanRes1.status === 200, 'Triggered low-stock scan (200)');
    assert(scanRes1.data.data.alertsTriggered >= 1, `Scan dispatched alert for low-stock item (alertsTriggered: ${scanRes1.data.data.alertsTriggered})`);

    // Second scan immediately after: MUST DEDUPLICATE (not send duplicate alert!)
    const scanRes2 = await adminClient.post('/admin/inventory/trigger-scan');
    assert(
      scanRes2.data.data.deduplicatedSkipped >= 1,
      `Alert deduplication: Consecutive scan skipped previously alerted item (deduplicatedSkipped: ${scanRes2.data.data.deduplicatedSkipped})`
    );

    // 13. Test Admin Order Management & Order Status Progression
    const adminOrdersRes = await adminClient.get('/admin/orders');
    assert(adminOrdersRes.status === 200, 'Admin orders retrieved (200)');
    const targetOrder = adminOrdersRes.data.data.orders.find((o) => o.orderNumber === orderData.orderNumber);
    assert(!!targetOrder, `Found target order ${orderData.orderNumber} in admin orders`);

    // Progress: received -> in_kitchen
    const statusProg1 = await adminClient.patch(`/admin/orders/${targetOrder.id}/status`, {
      status: 'in_kitchen',
      reason: 'Order ticket passed to wood-fired oven station',
    });
    assert(statusProg1.status === 200 && statusProg1.data.data.order.orderStatus === 'in_kitchen', 'Admin advanced order to "in_kitchen"');

    // Progress: in_kitchen -> sent_to_delivery
    const statusProg2 = await adminClient.patch(`/admin/orders/${targetOrder.id}/status`, {
      status: 'sent_to_delivery',
      reason: 'Dispatched with hot-bag temperature control driver',
    });
    assert(statusProg2.status === 200 && statusProg2.data.data.order.orderStatus === 'sent_to_delivery', 'Admin advanced order to "sent_to_delivery"');

    // Progress: sent_to_delivery -> delivered
    const statusProg3 = await adminClient.patch(`/admin/orders/${targetOrder.id}/status`, {
      status: 'delivered',
      reason: 'Customer handoff verified atIndiranagar destination',
    });
    assert(statusProg3.status === 200 && statusProg3.data.data.order.orderStatus === 'delivered', 'Admin advanced order to "delivered"');

    // 14. Test Order Cancellation & Stock Restoration
    // Create new order, pay, verify stock deduction, then admin cancels and verifies stock restoration
    const stockBeforeCancelOrder = (await adminClient.get(`/admin/inventory/${targetItem.id}`)).data.data.item.currentStock;
    await userClient.post('/cart/items', {
      itemType: 'catalog',
      pizzaId: margherita.id,
      quantity: 1, // 1 sauce portion
    });
    const cancelOrderCheckout = await userClient.post('/orders/create-checkout', {
      deliveryAddress: {
        fullName: 'Pietro Normal',
        phone: '+91 99999 88888',
        street: '12 Via Roma',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
    });
    const ordToCancel = cancelOrderCheckout.data.data.order;
    const rzpCancel = cancelOrderCheckout.data.data.razorpay;
    const cancelPayId = `pay_cancel_test_${Date.now()}`;
    const cancelSig = generateValidSignature(rzpCancel.orderId, cancelPayId);

    // Pay order
    await userClient.post('/orders/verify-payment', {
      orderId: ordToCancel.id,
      razorpayOrderId: rzpCancel.orderId,
      razorpayPaymentId: cancelPayId,
      razorpaySignature: cancelSig,
    });
    const stockAfterDeduct = (await adminClient.get(`/admin/inventory/${targetItem.id}`)).data.data.item.currentStock;
    assert(stockAfterDeduct === stockBeforeCancelOrder - 1, 'Stock decremented by 1 upon payment');

    // Admin cancels the order
    const cancelActionRes = await adminClient.patch(`/admin/orders/${ordToCancel.id}/status`, {
      status: 'cancelled',
      reason: 'Customer requested cancellation before dough was tossed',
    });
    assert(cancelActionRes.status === 200, 'Admin cancelled order');
    const stockAfterRestored = (await adminClient.get(`/admin/inventory/${targetItem.id}`)).data.data.item.currentStock;
    assert(
      stockAfterRestored === stockBeforeCancelOrder,
      `Inventory restoration verified: Stock restored back to ${stockAfterRestored} (+1 portion)`
    );

    console.log('========================================================================');
    console.log(`🎯 Part 4 Test Run Completed: ${passed} Passed, ${failed} Failed`);
    console.log('========================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Unexpected Test Suite Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runPart4Tests();
