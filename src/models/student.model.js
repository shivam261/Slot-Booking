import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const studentSchema = new Schema(
    { 
        name: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
          },

    },{timeseriestamps: true}
);
studentSchema.pre("save", async function (next) {
    const student = this;
    if (!student.isModified("password")) return next();
  
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(student.password, salt);
      student.password = hash;
      return next();
    } catch (error) {
      return next(error);
    }
  });
  studentSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
  studentSchema.methods.generateAccessToken = function () {
    return jwt.sign(
      {
        _id: this.id,
        
        name: this.name,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
  };
  studentSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      {
        _id: this.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
  };
  export const Student = mongoose.model("Student", studentSchema);