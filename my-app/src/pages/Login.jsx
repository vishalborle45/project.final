import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";

const Login = ({ setIsAuthenticated, isAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { publicKey, connected, signMessage } = useWallet();


  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!connected || !publicKey) {
      setError("Please connect your wallet to continue");
      return;
    }

    if (!signMessage) {
      setError("Your wallet doesn't support message signing");
      return;
    }

    setLoading(true);

    try {
      // Create a login message to sign
      const message = `welcome to Dapp`;
      
      // Ask the wallet to sign the message
      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encodedMessage);
      
      // Convert the signature to bs58 format for sending to API
      const signature = bs58.encode(signatureBytes);
      localStorage.setItem("signature", signature);
      
      
      
      // Send to backend for verification
      const response = await login({
        email,
        signature,
        message
      });
      
      localStorage.setItem("token", response.data.token);
      setIsAuthenticated(true);
      
      toast.success("Login successful. Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Make sure your email is registered with this wallet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Login with your wallet</CardTitle>
            <CardDescription>
              Connect your Solana wallet and enter your email to login
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
              
              {/* Wallet Connect Section */}
              <div className="space-y-2">
                <Label>Connect Solana Wallet</Label>
                <div className="flex justify-between items-center">
                  <WalletMultiButton />
                  {connected && <WalletDisconnectButton />}
                </div>
                
                {/* Wallet Status Display */}
                {connected && publicKey && (
                  <div className="mt-2 p-2 bg-secondary/30 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">Connected:</span>{" "}
                      <span className="font-mono">
                        {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                      </span>
                    </p>
                    <p className="text-sm text-green-600">Wallet connected successfully</p>
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !connected}
              >
                {loading ? "Signing in..." : !connected ? "Connect wallet to continue" : "Sign in with wallet"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-primary">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </>
  );
};

export default Login;