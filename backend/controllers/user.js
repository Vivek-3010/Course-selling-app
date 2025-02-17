import express from "express";
import { User } from "../models/User.js";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";
import config from "../config.js";
import { Purchase } from "../models/Purchase.js";
import { Course } from "../models/course.js";

export const signup = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
  
    const userSchema = z.object({
      firstName: z
        .string()
        .min(3, { message: "firstName must be atleast 3 char long" }),
      lastName: z
        .string()
        .min(3, { message: "lastName must be atleast 3 char long" }),
      email: z.string().email(),
      password: z
        .string()
        .min(6, { message: "password must be atleast 6 char long" }),
    });
  
    const validatedData = userSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res
        .status(400)
        .json({ errors: validatedData.error.issues.map((err) => err.message) });
    }
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ errors: "User already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      });
      await newUser.save();
      res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      console.error("Signup Error:", error);
      res.status(500).json({ errors: "Error signing up" });
    }
  };
  
  export const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(403).json({ errors: "Invalid credentials" });
      }
  
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(403).json({ errors: "Invalid credentials" });
      }
  
      const token = jwt.sign(
        { id: user._id },
        config.JWT_USER_PASSWORD,
        { expiresIn: "1d" }
      );
  
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      });
  
      res.status(200).json({ message: "Login successful", user, token });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ errors: "Error logging in" });
    }
  };
  
  export const logout = (req, res) => {
    try {
      if (!req.cookies?.jwt) {
        return res.status(400).json({ errors: "You are not logged in" });
      }
  
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });
  
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout Error:", error);
      res.status(500).json({ errors: "Error logging out" });
    }
  };
  
  export const purchases = async (req, res) => {
    const userId = req.userId;
  
    try {
      const purchased = await Purchase.find({ userId });
  
      let purchasedCourseId = [];
  
      for (let i = 0; i < purchased.length; i++) {
        purchasedCourseId.push(purchased[i].courseId);
      }
  
      const courseData = await Course.find({
        _id: { $in: purchasedCourseId },
      });
  
      res.status(200).json({ purchases: purchased, courseData });
    } catch (error) {
      console.error("Purchases Error:", error);
      res.status(500).json({ errors: "Error retrieving purchases" });
    }
  };
