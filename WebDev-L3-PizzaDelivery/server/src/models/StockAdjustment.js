import mongoose from 'mongoose';
import crypto from 'crypto';
import { isDbConnected } from '../config/db.js';

const stockAdjustmentSchema = new mongoose.Schema(
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
      trim: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    adjustmentAmount: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: [true, 'Adjustment reason is required for audit trails'],
      trim: true,
    },
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminName: {
      type: String,
      default: 'System',
    },
    type: {
      type: String,
      enum: ['manual_adjustment', 'order_deduction', 'cancellation_restock', 'initial_seed'],
      default: 'manual_adjustment',
      index: true,
    },
    relatedOrderId: {
      type: String,
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

const MongooseStockAdjustmentModel = mongoose.model('StockAdjustment', stockAdjustmentSchema);

// In-Memory store
class InMemoryStockAdjustmentDoc {
  constructor(data) {
    this._id = data._id || data.id || `adj_${crypto.randomUUID().slice(0, 10)}`;
    this.id = this._id;
    this.inventoryItemId = data.inventoryItemId?.toString() || data.inventoryItemId;
    this.itemSku = data.itemSku;
    this.itemName = data.itemName;
    this.previousQuantity = Number(data.previousQuantity) || 0;
    this.adjustmentAmount = Number(data.adjustmentAmount) || 0;
    this.newQuantity = Number(data.newQuantity) || 0;
    this.reason = data.reason || 'Manual inventory adjustment';
    this.adminUserId = data.adminUserId || null;
    this.adminName = data.adminName || 'System';
    this.type = data.type || 'manual_adjustment';
    this.relatedOrderId = data.relatedOrderId || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryStockAdjustments.set(this.id, this);
    return this;
  }

  toJSON() {
    const copy = { ...this };
    delete copy._id;
    copy.id = this.id;
    return copy;
  }
}

export const inMemoryStockAdjustments = new Map();

export const StockAdjustment = function (data) {
  if (isDbConnected()) {
    return new MongooseStockAdjustmentModel(data);
  }
  return new InMemoryStockAdjustmentDoc(data);
};

// Static methods
StockAdjustment.find = function (filter = {}) {
  if (isDbConnected()) {
    return MongooseStockAdjustmentModel.find(filter);
  }

  let list = Array.from(inMemoryStockAdjustments.values());

  if (filter.inventoryItemId) {
    const iid = filter.inventoryItemId.toString();
    list = list.filter((a) => a.inventoryItemId === iid);
  }
  if (filter.type) {
    list = list.filter((a) => a.type === filter.type);
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

StockAdjustment.findById = async function (id) {
  if (isDbConnected()) {
    return MongooseStockAdjustmentModel.findById(id);
  }
  return inMemoryStockAdjustments.get(id) || null;
};

StockAdjustment.schema = stockAdjustmentSchema;
export default StockAdjustment;
