import mongoose from 'mongoose';
import crypto from 'crypto';
import { isDbConnected } from '../config/db.js';

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Inventory item name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['pizza_base', 'sauce', 'cheese', 'vegetable'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock is required'],
      min: [0, 'Stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for stock',
      },
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      required: [true, 'Low stock threshold is required'],
      min: [0, 'Threshold cannot be negative'],
      default: 10,
    },
    unit: {
      type: String,
      default: 'portions',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    linkedIngredientId: {
      type: String,
      default: null,
      index: true,
    },
    isSampleData: {
      type: Boolean,
      default: false,
    },
    alertSentForLowStock: {
      type: Boolean,
      default: false,
    },
    lastAlertSentAt: {
      type: Date,
      default: null,
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

const MongooseInventoryItemModel = mongoose.model('InventoryItem', inventoryItemSchema);

// In-Memory store for offline/development execution without MongoDB daemon
class InMemoryInventoryItemDoc {
  constructor(data) {
    this._id = data._id || data.id || `inv_${crypto.randomUUID().slice(0, 8)}`;
    this.id = this._id;
    this.name = (data.name || '').trim();
    this.category = data.category || 'vegetable';
    this.sku = (data.sku || `SKU-${Date.now()}`).toUpperCase().trim();
    this.currentStock = Math.max(0, Math.floor(Number(data.currentStock) || 0));
    this.lowStockThreshold = Math.max(0, Math.floor(Number(data.lowStockThreshold) || 10));
    this.unit = data.unit || 'portions';
    this.isActive = data.isActive !== false;
    this.description = data.description || '';
    this.linkedIngredientId = data.linkedIngredientId || null;
    this.isSampleData = !!data.isSampleData;
    this.alertSentForLowStock = !!data.alertSentForLowStock;
    this.lastAlertSentAt = data.lastAlertSentAt || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryInventoryItems.set(this.id, this);
    if (this.sku) inMemorySkuIndex.set(this.sku, this.id);
    if (this.name) inMemoryNameIndex.set(this.name.toLowerCase(), this.id);
    return this;
  }

  toJSON() {
    const copy = { ...this };
    delete copy._id;
    copy.id = this.id;
    return copy;
  }
}

export const inMemoryInventoryItems = new Map();
export const inMemorySkuIndex = new Map();
export const inMemoryNameIndex = new Map();

export const InventoryItem = function (data) {
  if (isDbConnected()) {
    return new MongooseInventoryItemModel(data);
  }
  return new InMemoryInventoryItemDoc(data);
};

// Static methods
InventoryItem.find = function (filter = {}) {
  if (isDbConnected()) {
    return MongooseInventoryItemModel.find(filter);
  }

  let list = Array.from(inMemoryInventoryItems.values());

  if (filter.category && filter.category !== 'all') {
    list = list.filter((i) => i.category === filter.category);
  }
  if (filter.isActive !== undefined) {
    list = list.filter((i) => i.isActive === filter.isActive);
  }
  if (filter.$or) {
    // Basic $or query emulation for search
    // Used for name/sku matching
  }

  return {
    sort: (sortObj) => {
      if (sortObj?.currentStock) {
        list.sort((a, b) => (a.currentStock - b.currentStock) * sortObj.currentStock);
      } else if (sortObj?.name) {
        list.sort((a, b) => a.name.localeCompare(b.name) * sortObj.name);
      } else if (sortObj?.createdAt) {
        list.sort((a, b) => (new Date(a.createdAt) - new Date(b.createdAt)) * sortObj.createdAt);
      }
      return Promise.resolve(list);
    },
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
  };
};

InventoryItem.findById = async function (id) {
  if (isDbConnected()) {
    return MongooseInventoryItemModel.findById(id);
  }
  return inMemoryInventoryItems.get(id) || null;
};

InventoryItem.findOne = async function (query = {}) {
  if (isDbConnected()) {
    return MongooseInventoryItemModel.findOne(query);
  }
  if (query.sku) {
    const id = inMemorySkuIndex.get(query.sku.toUpperCase());
    if (id) return inMemoryInventoryItems.get(id) || null;
  }
  if (query.name) {
    const id = inMemoryNameIndex.get(query.name.toLowerCase());
    if (id) return inMemoryInventoryItems.get(id) || null;
  }
  if (query._id) {
    return inMemoryInventoryItems.get(query._id) || null;
  }
  for (const doc of inMemoryInventoryItems.values()) {
    let match = true;
    for (const [k, v] of Object.entries(query)) {
      if (doc[k] !== v) {
        match = false;
        break;
      }
    }
    if (match) return doc;
  }
  return null;
};

InventoryItem.countDocuments = async function (filter = {}) {
  if (isDbConnected()) {
    return MongooseInventoryItemModel.countDocuments(filter);
  }
  let list = Array.from(inMemoryInventoryItems.values());
  if (filter.isActive !== undefined) {
    list = list.filter((i) => i.isActive === filter.isActive);
  }
  return list.length;
};

InventoryItem.schema = inventoryItemSchema;
export default InventoryItem;
