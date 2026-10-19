import mongoose from 'mongoose';
import crypto from 'crypto';
import { isDbConnected } from '../config/db.js';

const cartItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ['catalog', 'custom'],
      required: true,
      default: 'catalog',
    },
    pizzaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pizza',
      default: null,
    },
    customPizza: {
      name: { type: String, default: 'Custom Hand-Crafted Pizza' },
      baseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', default: null },
      sauceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', default: null },
      cheeseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', default: null },
      veggieIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [20, 'Quantity cannot exceed 20 per item'],
      default: 1,
    },
    unitPricePaise: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
    },
    totalPricePaise: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    cartToken: {
      type: String,
      default: null,
      index: true,
    },
    items: [cartItemSchema],
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

const MongooseCartModel = mongoose.model('Cart', cartSchema);

// In-Memory store
class InMemoryCartDoc {
  constructor(data) {
    this._id = data._id || data.id || `cart_${crypto.randomUUID()}`;
    this.id = this._id;
    this.userId = data.userId || null;
    this.cartToken = data.cartToken || null;
    this.items = (data.items || []).map((item) => ({
      _id: item._id || item.id || `item_${crypto.randomUUID().slice(0, 8)}`,
      id: item._id || item.id || `item_${crypto.randomUUID().slice(0, 8)}`,
      itemType: item.itemType || 'catalog',
      pizzaId: item.pizzaId || null,
      customPizza: item.customPizza || null,
      quantity: Math.max(1, Math.min(20, Number(item.quantity) || 1)),
      unitPricePaise: Number(item.unitPricePaise) || 0,
      totalPricePaise: (Number(item.unitPricePaise) || 0) * (Number(item.quantity) || 1),
    }));
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    // Update total prices on each item
    this.items.forEach((it) => {
      it.totalPricePaise = it.unitPricePaise * it.quantity;
    });
    inMemoryCarts.set(this.id, this);
    if (this.userId) inMemoryUserCartIndex.set(this.userId.toString(), this.id);
    if (this.cartToken) inMemoryTokenCartIndex.set(this.cartToken, this.id);
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

export const inMemoryCarts = new Map();
export const inMemoryUserCartIndex = new Map();
export const inMemoryTokenCartIndex = new Map();

export const Cart = function (data) {
  if (isDbConnected()) {
    return new MongooseCartModel(data);
  }
  return new InMemoryCartDoc(data);
};

Cart.findOne = async function (query = {}) {
  if (isDbConnected()) {
    return MongooseCartModel.findOne(query);
  }

  let cartId = null;
  if (query.userId) {
    cartId = inMemoryUserCartIndex.get(query.userId.toString());
  } else if (query.cartToken) {
    cartId = inMemoryTokenCartIndex.get(query.cartToken);
  }

  if (cartId) {
    return inMemoryCarts.get(cartId) || null;
  }
  return null;
};

Cart.findById = async function (id) {
  if (isDbConnected()) {
    return MongooseCartModel.findById(id);
  }
  return inMemoryCarts.get(id) || null;
};

Cart.schema = cartSchema;
export default Cart;
