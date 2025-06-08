// components/Home.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wallet, File } from "lucide-react";
import { useSolanaService } from "@/hooks/UseSolanaService";
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

const HomeComponent = () => {
  const [recentDocs, setRecentDocs] = useState([]);
  const [balance, setBalance] = useState(0);
  const { publicKey } = useWallet();
  const { solanaService } = useSolanaService();

  useEffect(() => {
    fetchRecentDocuments();
    fetchWalletBalance();
  }, [solanaService, publicKey]);

  const fetchRecentDocuments = async () => {
    try {
      if (!solanaService) return;
      const userDocs = await solanaService.getUserDocuments();
      // Sort by creation date and take last 5
      const recent = userDocs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentDocs(recent);
    } catch (error) {
      console.error("Error fetching recent documents:", error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      if (!publicKey) return;
      const connection = new Connection(import.meta.env.VITE_SOLANA_API_URL);
      console.log("connection " , connection)
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Welcome to DeDrive</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>Recent Uploads</CardHeader>
          <CardContent>
            {recentDocs.length > 0 ? (
              <ul className="space-y-2">
                {recentDocs.map((doc) => (
                  <li key={doc.publicKey} className="flex items-center gap-2">
                    <File size={16} />
                    <span>{doc.fileName}</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No recent uploads</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Wallet Information</CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} />
              <span>Balance: {balance.toFixed(4)} SOL</span>
            </div>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground">
              {publicKey ? publicKey.toString() : 'No wallet connected'}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default HomeComponent;
