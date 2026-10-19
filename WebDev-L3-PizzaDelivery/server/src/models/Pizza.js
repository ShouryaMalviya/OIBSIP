import mongoose from 'mongoose';
import crypto from 'crypto';
import { isDbConnected } from '../config/db.js';

const pizzaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pizza name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Pizza description is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    basePricePaise: {
      type: Number,
      required: [true, 'Base price in paise is required'],
      min: [0, 'Price cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: ['Classic', 'Veg Feast', 'Artisanal', 'Signature', 'Spicy'],
      default: 'Classic',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    isSpicy: {
      type: Boolean,
      default: false,
    },
    ingredients: {
      type: [String],
      default: [],
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

const MongoosePizzaModel = mongoose.model('Pizza', pizzaSchema);

// In-Memory fallback store
class InMemoryPizzaDoc {
  constructor(data) {
    this._id = data._id || data.id || `pizza_${crypto.randomUUID().slice(0, 8)}`;
    this.id = this._id;
    this.name = data.name;
    this.description = data.description;
    this.imageUrl = data.imageUrl;
    this.basePricePaise = Number(data.basePricePaise) || 0;
    this.isAvailable = data.isAvailable !== false;
    this.category = data.category || 'Classic';
    this.isFeatured = !!data.isFeatured;
    this.isVegetarian = data.isVegetarian !== false;
    this.isSpicy = !!data.isSpicy;
    this.ingredients = data.ingredients || [];
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

export const inMemoryPizzas = new Map();

export const Pizza = function (data) {
  if (isDbConnected()) {
    return new MongoosePizzaModel(data);
  }
  return new InMemoryPizzaDoc(data);
};

// Static methods
Pizza.find = function (filter = {}) {
  if (isDbConnected()) {
    return MongoosePizzaModel.find(filter);
  }

  let list = Array.from(inMemoryPizzas.values());

  if (filter.category && filter.category !== 'All') {
    list = list.filter((p) => p.category === filter.category);
  }
  if (filter.isFeatured !== undefined) {
    list = list.filter((p) => p.isFeatured === filter.isFeatured);
  }
  if (filter.isAvailable !== undefined) {
    list = list.filter((p) => p.isAvailable === filter.isAvailable);
  }
  if (filter.isVegetarian !== undefined) {
    list = list.filter((p) => p.isVegetarian === filter.isVegetarian);
  }

  return {
    sort: (sortObj) => {
      if (sortObj?.basePricePaise) {
        list.sort((a, b) => (a.basePricePaise - b.basePricePaise) * sortObj.basePricePaise);
      }
      return Promise.resolve(list);
    },
    then: (resolve, reject) => Promise.resolve(list).then(resolve, reject),
  };
};

Pizza.findById = async function (id) {
  if (isDbConnected()) {
    return MongoosePizzaModel.findById(id);
  }
  return inMemoryPizzas.get(id) || null;
};

Pizza.findOne = async function (query = {}) {
  if (isDbConnected()) {
    return MongoosePizzaModel.findOne(query);
  }
  for (const doc of inMemoryPizzas.values()) {
    if (query.name && doc.name === query.name) return doc;
    if (query._id && doc.id === query._id) return doc;
  }
  return null;
};

Pizza.countDocuments = async function () {
  if (isDbConnected()) {
    return MongoosePizzaModel.countDocuments();
  }
  return inMemoryPizzas.size;
};

Pizza.insertMany = async function (items = []) {
  if (isDbConnected()) {
    return MongoosePizzaModel.insertMany(items);
  }
  const created = [];
  for (const item of items) {
    const doc = new InMemoryPizzaDoc(item);
    inMemoryPizzas.set(doc.id, doc);
    created.push(doc);
  }
  return created;
};

Pizza.schema = pizzaSchema;
export default Pizza;
