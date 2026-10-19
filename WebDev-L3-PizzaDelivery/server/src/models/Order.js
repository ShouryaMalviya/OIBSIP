import mongoose from 'mongoose';
import crypto from 'crypto';
import { isDbConnected } from '../config/db.js';

/**
 * Valid state transitions for orderStatus
 */
export const VALID_ORDER_TRANSITIONS = {
  awaiting_payment: ['received', 'cancelled'],
  received: ['in_kitchen', 'cancelled'],
  in_kitchen: ['sent_to_delivery', 'cancelled'],
  sent_to_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

/**
 * Valid state transitions for paymentStatus
 */
export const VALID_PAYMENT_TRANSITIONS = {
  pending: ['paid', 'failed'],
  paid: ['refunded'],
  failed: ['paid', 'pending'],
  refunded: [],
};

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['catalog', 'custom'],
      required: true,
    },
    pizzaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pizza',
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    customPizza: {
      name: { type: String, default: 'Custom Artisanal Pizza' },
      base: {
        id: String,
        name: String,
        priceAdjustmentPaise: { type: Number, default: 0 },
      },
      sauce: {
        id: String,
        name: String,
        priceAdjustmentPaise: { type: Number, default: 0 },
      },
      cheese: {
        id: String,
        name: String,
        priceAdjustmentPaise: { type: Number, default: 0 },
      },
      veggies: [
        {
          id: String,
          name: String,
          priceAdjustmentPaise: { type: Number, default: 0 },
        },
      ],
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const orderStatusHistorySchema = new mongoose.Schema(
  {
    fromStatus: String,
    toStatus: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
    updatedBy: { type: String, default: 'system' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSnapshotSchema],
      required: true,
      validate: [(val) => val.length > 0, 'Order must contain at least one item'],
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: true,
    },
    subtotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFeePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'awaiting_payment',
        'received',
        'in_kitchen',
        'sent_to_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'awaiting_payment',
      index: true,
    },
    inventoryStatus: {
      type: String,
      enum: ['none', 'reserved', 'committed', 'released'],
      default: 'none',
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    statusHistory: [orderStatusHistorySchema],
    paidAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 35,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Method to safely transition order status
orderSchema.methods.transitionOrderStatus = function (newStatus, reason = '', updatedBy = 'system') {
  const currentStatus = this.orderStatus;
  const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid order status transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`
    );
  }
  this.statusHistory.push({
    fromStatus: currentStatus,
    toStatus: newStatus,
    changedAt: new Date(),
    reason,
    updatedBy,
  });
  this.orderStatus = newStatus;
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    this.cancellationReason = reason || 'Order cancelled';
  }
};

// Method to safely transition payment status
orderSchema.methods.transitionPaymentStatus = function (newPaymentStatus) {
  const current = this.paymentStatus;
  const allowed = VALID_PAYMENT_TRANSITIONS[current] || [];
  if (!allowed.includes(newPaymentStatus)) {
    throw new Error(
      `Invalid payment status transition from "${current}" to "${newPaymentStatus}". Allowed: ${allowed.join(', ') || 'none'}`
    );
  }
  this.paymentStatus = newPaymentStatus;
  if (newPaymentStatus === 'paid') {
    this.paidAt = new Date();
  }
};

const MongooseOrderModel = mongoose.model('Order', orderSchema);

// In-Memory store for offline/development execution without local mongod
class InMemoryOrderDoc {
  constructor(data) {
    this._id = data._id || data.id || `order_${crypto.randomUUID()}`;
    this.id = this._id;
    this.orderNumber = data.orderNumber;
    this.userId = data.userId?.toString() || data.userId;
    this.items = (data.items || []).map((it) => ({
      _id: it._id || it.id || `item_${crypto.randomUUID().slice(0, 8)}`,
      id: it._id || it.id || `item_${crypto.randomUUID().slice(0, 8)}`,
      itemType: it.itemType || 'catalog',
      pizzaId: it.pizzaId || null,
      name: it.name || 'Artisanal Pizza',
      description: it.description || '',
      imageUrl: it.imageUrl || '',
      customPizza: it.customPizza || null,
      quantity: Number(it.quantity) || 1,
      unitPricePaise: Number(it.unitPricePaise) || 0,
      totalPricePaise: (Number(it.unitPricePaise) || 0) * (Number(it.quantity) || 1),
    }));
    this.deliveryAddress = { ...(data.deliveryAddress || {}) };
    this.subtotalPaise = Number(data.subtotalPaise) || 0;
    this.deliveryFeePaise = Number(data.deliveryFeePaise) || 0;
    this.taxPaise = Number(data.taxPaise) || 0;
    this.grandTotalPaise = Number(data.grandTotalPaise) || 0;
    this.currency = data.currency || 'INR';
    this.paymentStatus = data.paymentStatus || 'pending';
    this.orderStatus = data.orderStatus || 'awaiting_payment';
    this.inventoryStatus = data.inventoryStatus || 'none';
    this.razorpayOrderId = data.razorpayOrderId || null;
    this.razorpayPaymentId = data.razorpayPaymentId || null;
    this.razorpaySignature = data.razorpaySignature || null;
    this.statusHistory = (data.statusHistory || []).map((h) => ({ ...h }));
    this.paidAt = data.paidAt || null;
    this.cancelledAt = data.cancelledAt || null;
    this.cancellationReason = data.cancellationReason || null;
    this.estimatedDeliveryMinutes = data.estimatedDeliveryMinutes || 35;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  transitionOrderStatus(newStatus, reason = '', updatedBy = 'system') {
    const currentStatus = this.orderStatus;
    const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid order status transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'none'}`
      );
    }
    this.statusHistory.push({
      fromStatus: currentStatus,
      toStatus: newStatus,
      changedAt: new Date(),
      reason,
      updatedBy,
    });
    this.orderStatus = newStatus;
    if (newStatus === 'cancelled') {
      this.cancelledAt = new Date();
      this.cancellationReason = reason || 'Order cancelled';
    }
  }

  transitionPaymentStatus(newPaymentStatus) {
    const current = this.paymentStatus;
    const allowed = VALID_PAYMENT_TRANSITIONS[current] || [];
    if (!allowed.includes(newPaymentStatus)) {
      throw new Error(
        `Invalid payment status transition from "${current}" to "${newPaymentStatus}". Allowed: ${allowed.join(', ') || 'none'}`
      );
    }
    this.paymentStatus = newPaymentStatus;
    if (newPaymentStatus === 'paid') {
      this.paidAt = new Date();
    }
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryOrders.set(this.id, this);
    if (this.orderNumber) inMemoryOrderNumberIndex.set(this.orderNumber, this.id);
    if (this.razorpayOrderId) inMemoryRazorpayOrderIndex.set(this.razorpayOrderId, this.id);
    if (this.userId) {
      const uKey = this.userId.toString();
      if (!inMemoryUserOrdersIndex.has(uKey)) {
        inMemoryUserOrdersIndex.set(uKey, new Set());
      }
      inMemoryUserOrdersIndex.get(uKey).add(this.id);
    }
    return this;
  }

  toJSON() {
    const copy = { ...this };
    delete copy._id;
    copy.id = this.id;
    copy.items = this.items.map((it) => ({
      ...it,
      id: it._id || it.id,
    }));
    return copy;
  }
}

export const inMemoryOrders = new Map();
export const inMemoryOrderNumberIndex = new Map();
export const inMemoryRazorpayOrderIndex = new Map();
export const inMemoryUserOrdersIndex = new Map();

export const Order = function (data) {
  if (isDbConnected()) {
    return new MongooseOrderModel(data);
  }
  return new InMemoryOrderDoc(data);
};

// Static helper to generate unique human-readable order number
Order.generateOrderNumber = function () {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PV-${dateStr}-${randomSuffix}`;
};

// Static find
Order.find = function (filter = {}) {
  if (isDbConnected()) {
    return MongooseOrderModel.find(filter);
  }

  let list = Array.from(inMemoryOrders.values());

  if (filter.userId) {
    const uid = filter.userId.toString();
    list = list.filter((o) => o.userId.toString() === uid);
  }
  if (filter.orderStatus) {
    list = list.filter((o) => o.orderStatus === filter.orderStatus);
  }
  if (filter.paymentStatus) {
    list = list.filter((o) => o.paymentStatus === filter.paymentStatus);
  }
  if (filter.razorpayOrderId) {
    list = list.filter((o) => o.razorpayOrderId === filter.razorpayOrderId);
  }

  return {
    sort: (sortObj) => {
      if (sortObj?.createdAt) {
        list.sort((a, b) => {
          const tA = new Date(a.createdAt).getTime();
          const tB = new Date(b.createdAt).getTime();
          return (tA - tB) * sortObj.createdAt;
        });
      }
      return Promise.resolve(list);
    },
    populate: () => ({
      sort: (sortObj) => {
        if (sortObj?.createdAt) {
          list.sort((a, b) => {
            const tA = new Date(a.createdAt).getTime();
            const tB = new Date(b.createdAt).getTime();
            return (tA - tB) * sortObj.createdAt;
          });
        }
        return Promise.resolve(list);
      },
      then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
    }),
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
  };
};

// Static findById
Order.findById = async function (id) {
  if (isDbConnected()) {
    return MongooseOrderModel.findById(id);
  }
  return inMemoryOrders.get(id) || null;
};

// Static findOne
Order.findOne = async function (query = {}) {
  if (isDbConnected()) {
    return MongooseOrderModel.findOne(query);
  }
  if (query.orderNumber) {
    const id = inMemoryOrderNumberIndex.get(query.orderNumber);
    if (id) return inMemoryOrders.get(id) || null;
  }
  if (query.razorpayOrderId) {
    const id = inMemoryRazorpayOrderIndex.get(query.razorpayOrderId);
    if (id) return inMemoryOrders.get(id) || null;
  }
  if (query._id) {
    return inMemoryOrders.get(query._id) || null;
  }
  for (const doc of inMemoryOrders.values()) {
    let match = true;
    for (const [k, v] of Object.entries(query)) {
      if (doc[k]?.toString() !== v?.toString()) {
        match = false;
        break;
      }
    }
    if (match) return doc;
  }
  return null;
};

Order.countDocuments = async function () {
  if (isDbConnected()) {
    return MongooseOrderModel.countDocuments();
  }
  return inMemoryOrders.size;
};

Order.schema = orderSchema;
export default Order;
