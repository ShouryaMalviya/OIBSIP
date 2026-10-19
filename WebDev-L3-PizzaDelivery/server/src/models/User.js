import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { isDbConnected } from '../config/db.js';

// Define standard Mongoose User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.emailVerificationTokenHash;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        return ret;
      },
    },
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    throw new Error('Password hash missing on user document');
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const MongooseUserModel = mongoose.model('User', userSchema);

// In-Memory User Store for zero-config local testing when MongoDB daemon is not running
class InMemoryUserDoc {
  constructor(data) {
    this._id = data._id || crypto.randomUUID();
    this.id = this._id;
    this.name = data.name;
    this.email = data.email?.toLowerCase().trim();
    this.passwordHash = data.passwordHash;
    this.role = data.role || 'user';
    this.isEmailVerified = data.isEmailVerified ?? false;
    this.emailVerificationTokenHash = data.emailVerificationTokenHash || null;
    this.emailVerificationExpires = data.emailVerificationExpires || null;
    this.passwordResetTokenHash = data.passwordResetTokenHash || null;
    this.passwordResetExpires = data.passwordResetExpires || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async comparePassword(candidatePassword) {
    if (!this.passwordHash) throw new Error('Password hash missing on document');
    return bcrypt.compare(candidatePassword, this.passwordHash);
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryUsers.set(this.id, this);
    inMemoryEmailIndex.set(this.email, this.id);
    return this;
  }

  toJSON() {
    const copy = { ...this };
    delete copy.passwordHash;
    delete copy.emailVerificationTokenHash;
    delete copy.emailVerificationExpires;
    delete copy.passwordResetTokenHash;
    delete copy.passwordResetExpires;
    delete copy.__v;
    delete copy._id;
    copy.id = this.id;
    return copy;
  }
}

const inMemoryUsers = new Map();
const inMemoryEmailIndex = new Map();

// Query chain helper for findOne().select('+passwordHash')
class QueryChain {
  constructor(doc) {
    this.doc = doc;
  }
  select() {
    return this;
  }
  then(resolve, reject) {
    return Promise.resolve(this.doc).then(resolve, reject);
  }
  catch(reject) {
    return Promise.resolve(this.doc).catch(reject);
  }
}

// User proxy that automatically delegates to Mongoose when connected or In-Memory store otherwise
export const User = function (data) {
  if (isDbConnected()) {
    return new MongooseUserModel(data);
  }
  return new InMemoryUserDoc(data);
};

// Static methods
User.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

User.findOne = function (query) {
  if (isDbConnected()) {
    return MongooseUserModel.findOne(query);
  }

  let found = null;

  // Search by email
  if (query.email) {
    const id = inMemoryEmailIndex.get(query.email.toLowerCase().trim());
    if (id) {
      found = inMemoryUsers.get(id) || null;
    }
  }
  // Search by email verification token
  else if (query.emailVerificationTokenHash) {
    for (const doc of inMemoryUsers.values()) {
      if (
        doc.emailVerificationTokenHash === query.emailVerificationTokenHash &&
        (!query.emailVerificationExpires || new Date(doc.emailVerificationExpires) > new Date())
      ) {
        found = doc;
        break;
      }
    }
  }
  // Search by password reset token
  else if (query.passwordResetTokenHash) {
    for (const doc of inMemoryUsers.values()) {
      if (
        doc.passwordResetTokenHash === query.passwordResetTokenHash &&
        (!query.passwordResetExpires || new Date(doc.passwordResetExpires) > new Date())
      ) {
        found = doc;
        break;
      }
    }
  }

  return new QueryChain(found);
};

User.findById = async function (id) {
  if (isDbConnected()) {
    return MongooseUserModel.findById(id);
  }
  const doc = inMemoryUsers.get(id) || null;
  return doc;
};

User.schema = userSchema;
export default User;
