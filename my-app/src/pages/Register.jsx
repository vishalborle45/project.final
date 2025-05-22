import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";
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
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSolanaService } from "../hooks/UseSolanaService";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { solanaService, loading: solanaLoading, error: solanaError } = useSolanaService();

  // Show Solana connection errors if they occur
  useEffect(() => {
    if (solanaError && connected) {
      setError(`Solana connection error: ${solanaError.message}`);
    }
  }, [solanaError, connected]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!connected || !publicKey) {
      setError("Please connect your wallet to continue");
      return;
    }

    if (solanaLoading) {
      setError("Solana connection is initializing. Please wait.");
      return;
    }

    if (!solanaService) {
      setError("Solana service is not available. Please reconnect your wallet.");
      return;
    }

    setLoading(true);

    try {
      // Prepare user data for API
      const userData = {
        ...formData,
        publicKey: publicKey.toBase58(), // Attach wallet address with the correct field name
      };

      // Call your backend register API
      const response = await register(userData);
      
      // Initialize Solana user document storage
      try {
        console.log("Initializing user documents on Solana...");
        
        // Initialize user document storage on Solana
        const txSignature = await solanaService.initializeUserDocuments();
        
        console.log("Solana initialization successful, tx:", txSignature);
        toast.success("Account created and Solana storage initialized!");
      } catch (solError) {
        console.error("Error initializing user documents on Solana:", solError);
        
        // Check if error indicates the account already exists
        if (solError.toString().includes("already in use")) {
          console.log("User documents account already exists, continuing...");
          toast.success("Account created successfully!");
        } else {
          toast.error("Account created but failed to initialize Solana storage.");
        }
      }

      // Navigate to login after success
      toast.success("Account created! Please login to continue.");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Enter your details and connect your wallet to register
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Wallet Connect Section with Status */}
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
                  {solanaLoading ? (
                    <p className="text-sm text-muted-foreground">Initializing Solana connection...</p>
                  ) : solanaService ? (
                    <p className="text-sm text-green-600">Solana service ready</p>
                  ) : (
                    <p className="text-sm text-amber-600">Waiting for Solana service...</p>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !connected || solanaLoading || !solanaService}
            >
              {loading
                ? "Creating account..."
                : !connected
                ? "Connect wallet to continue"
                : solanaLoading
                ? "Initializing Solana..."
                : !solanaService
                ? "Solana service unavailable"
                : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;