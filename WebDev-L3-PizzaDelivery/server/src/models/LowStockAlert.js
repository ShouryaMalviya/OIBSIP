import mongoose from 'mongoose';
import crypto from 'crypto';
import { isDbConnected } from '../config/db.js';

const lowStockAlertSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
      index: true,
    },
    itemSku: {
      type: String,
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'deduplicated_skipped'],
      required: true,
      default: 'sent',
    },
    deliveryOutcome: {
      type: String,
      default: '',
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
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

const MongooseLowStockAlertModel = mongoose.model('LowStockAlert', lowStockAlertSchema);

// In-Memory store
class InMemoryLowStockAlertDoc {
  constructor(data) {
    this._id = data._id || data.id || `alert_${crypto.randomUUID().slice(0, 8)}`;
    this.id = this._id;
    this.inventoryItemId = data.inventoryItemId?.toString() || data.inventoryItemId;
    this.itemSku = data.itemSku;
    this.itemName = data.itemName;
    this.category = data.category;
    this.currentStock = Number(data.currentStock) || 0;
    this.threshold = Number(data.threshold) || 10;
    this.recipientEmail = data.recipientEmail;
    this.status = data.status || 'sent';
    this.deliveryOutcome = data.deliveryOutcome || '';
    this.triggeredAt = data.triggeredAt || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryLowStockAlerts.set(this.id, this);
    return this;
  }

  toJSON() {
    const copy = { ...this };
    delete copy._id;
    copy.id = this.id;
    return copy;
  }
}

export const inMemoryLowStockAlerts = new Map();

export const LowStockAlert = function (data) {
  if (isDbConnected()) {
    return new MongooseLowStockAlertModel(data);
  }
  return new InMemoryLowStockAlertDoc(data);
};

// Static methods
LowStockAlert.find = function (filter = {}) {
  if (isDbConnected()) {
    return MongooseLowStockAlertModel.find(filter);
  }

  let list = Array.from(inMemoryLowStockAlerts.values());

  if (filter.status) {
    list = list.filter((a) => a.status === filter.status);
  }

  return {
    sort: (sortObj) => {
      if (sortObj?.createdAt) {
        list.sort((a, b) => (new Date(a.createdAt) - new Date(b.createdAt)) * sortObj.createdAt);
      }
      return Promise.resolve(list);
    },
    limit: (lim) => {
      const sliced = list.slice(0, lim);
      return Promise.resolve(sliced);
    },
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
  };
};

LowStockAlert.schema = lowStockAlertSchema;
export default LowStockAlert;
