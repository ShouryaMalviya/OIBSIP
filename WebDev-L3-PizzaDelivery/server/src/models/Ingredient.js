import mongoose from 'mongoose';
import crypto from 'crypto';
import { isDbConnected } from '../config/db.js';

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Ingredient category is required'],
      enum: ['base', 'sauce', 'cheese', 'veggie'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    priceAdjustmentPaise: {
      type: Number,
      default: 0,
      min: [0, 'Adjustment cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isSampleData: {
      type: Boolean,
      default: true,
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

const MongooseIngredientModel = mongoose.model('Ingredient', ingredientSchema);

// In-Memory store
class InMemoryIngredientDoc {
  constructor(data) {
    this._id = data._id || data.id || `ing_${crypto.randomUUID().slice(0, 8)}`;
    this.id = this._id;
    this.name = data.name;
    this.category = data.category;
    this.description = data.description || '';
    this.imageUrl = data.imageUrl || '';
    this.priceAdjustmentPaise = Number(data.priceAdjustmentPaise) || 0;
    this.isAvailable = data.isAvailable !== false;
    this.isSampleData = data.isSampleData !== false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() {
    const copy = { ...this };
    delete copy._id;
    copy.id = this.id;
    return copy;
  }
}

export const inMemoryIngredients = new Map();

export const Ingredient = function (data) {
  if (isDbConnected()) {
    return new MongooseIngredientModel(data);
  }
  return new InMemoryIngredientDoc(data);
};

// Static query helpers
Ingredient.find = function (filter = {}) {
  if (isDbConnected()) {
    return MongooseIngredientModel.find(filter);
  }

  let list = Array.from(inMemoryIngredients.values());

  if (filter.category) {
    list = list.filter((item) => item.category === filter.category);
  }
  if (filter.isAvailable !== undefined) {
    list = list.filter((item) => item.isAvailable === filter.isAvailable);
  }

  return {
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
  };
};

Ingredient.findById = async function (id) {
  if (isDbConnected()) {
    return MongooseIngredientModel.findById(id);
  }
  return inMemoryIngredients.get(id) || null;
};

Ingredient.findOne = async function (query = {}) {
  if (isDbConnected()) {
    return MongooseIngredientModel.findOne(query);
  }
  for (const doc of inMemoryIngredients.values()) {
    if (query.name && doc.name === query.name) return doc;
    if (query._id && doc.id === query._id) return doc;
  }
  return null;
};

Ingredient.countDocuments = async function () {
  if (isDbConnected()) {
    return MongooseIngredientModel.countDocuments();
  }
  return inMemoryIngredients.size;
};

Ingredient.insertMany = async function (items = []) {
  if (isDbConnected()) {
    return MongooseIngredientModel.insertMany(items);
  }
  const created = [];
  for (const item of items) {
    const doc = new InMemoryIngredientDoc(item);
    inMemoryIngredients.set(doc.id, doc);
    created.push(doc);
  }
  return created;
};

Ingredient.schema = ingredientSchema;
export default Ingredient;
