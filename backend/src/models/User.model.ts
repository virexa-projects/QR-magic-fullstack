import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "@config/env";
import { UserRole } from "@app-types/enums";

export { UserRole };

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;          // now optional
  googleId?: string;          // NEW
  phone?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  tokenVersion: number; // bump to invalidate all refresh tokens (logout-all / password change)
  currentPlan: Types.ObjectId | null;
  planExpiresAt?: Date | null;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId; // only required if not a Google-only account
      },
      minlength: 8,
      select: false,
    },
    googleId: { type: String, unique: true, sparse: true, index: true }, // NEW

    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER, index: true },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    currentPlan: { type: Schema.Types.ObjectId, ref: "Plan", default: null },
    planExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  if (!this.password) return Promise.resolve(false); // Google-only account has no password
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User = model<IUser>("User", userSchema);
