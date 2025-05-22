"use client";

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "../components/ui/Navbar";
import ProtectedRoute from "../components/ui/ProtectedRoute";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import { Toaster } from "@/components/ui/sonner";
// Solana wallet adapter imports
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";


function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const endpoint = process.env.NEXT_PUBLIC_SOLANA_API_URL || "https://api.devnet.solana.com";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" suppressHydrationWarning>
        Loading...
      </div>
    );
  }

  return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <Router>
              <div className="min-h-screen flex h-screen flex-col overflow-hidden bg-background">
                <Navbar
                  isAuthenticated={isAuthenticated}
                  setIsAuthenticated={setIsAuthenticated}
                />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                      path="/login"
                      element={
                        <Login
                          setIsAuthenticated={setIsAuthenticated}
                          isAuthenticated={isAuthenticated}
                        />
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <Register />
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Toaster />
              </div>
            </Router>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
  );
}

export default Page;