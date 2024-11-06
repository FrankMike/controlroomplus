import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define interface for User methods
interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define interface for User document
interface IUser extends mongoose.Document {
  username: string;
  password: string;
  name: string;
  surname: string;
  birthday: Date;
  createdAt: Date;
}

// Create a type that combines both the document and methods
type UserModel = IUser & IUserMethods;

const userSchema = new mongoose.Schema<UserModel>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  surname: {
    type: String,
    default: '',
  },
  birthday: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Clear existing model if it exists to prevent OverwriteModelError
const modelName = 'User';
if (mongoose.models[modelName]) {
  mongoose.deleteModel(modelName);
}

export const User = mongoose.model<UserModel>(modelName, userSchema); 