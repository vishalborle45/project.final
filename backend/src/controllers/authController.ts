import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { PublicKey } from "@solana/web3.js";
import * as nacl from "tweetnacl";
import bs58 from "bs58";

const prisma = new PrismaClient();

/**
 * Register a new user with just name, email, and public key
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, publicKey } = req.body;
    
    // Validate required fields
    if (!name || !email || !publicKey) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Validate public key format
    try {
      new PublicKey(publicKey);
    } catch (error) {
      return res.status(400).json({ message: "Invalid public key format" });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        publicKey,
      },
    });
    
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Login using wallet signature verification
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, signature, message } = req.body;
    
    if (!email || !signature || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
        
    // Get the public key from the user record
    const publicKey = user.publicKey;
    
    // Verify the signature
    try {
      const publicKeyObj = new PublicKey(publicKey);
      const signatureUint8 = bs58.decode(signature);
      const messageUint8 = new TextEncoder().encode(message);
            
      // Use nacl for signature verification
      const isValid = nacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        publicKeyObj.toBytes()
      );
            
      if (!isValid) {
        return res.status(401).json({ message: "Invalid signature" });
      }
    } catch (error) {
      console.error("Signature verification error:", error);
      return res.status(401).json({ message: "Signature verification failed" });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });
    
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user profile data
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    // User ID comes from the auth middleware
    const userId = (req as any).user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        publicKey: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};