// src/hooks/useSolanaService.js
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { SolanaService } from '../services/solana';

/**
 * Hook to create and provide access to the SolanaService
 * @param {string} cluster - Solana cluster to connect to (default: 'localnet')
 * @returns {Object} SolanaService instance if wallet is connected, null otherwise
 */
export function useSolanaService(cluster = 'localnet') {
  const { wallet, publicKey, connected } = useWallet();
  const [solanaService, setSolanaService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let service = null;

    const initializeService = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!connected || !wallet || !publicKey) {
          setSolanaService(null);
          setLoading(false);
          return;
        }

        // Use localhost URL for local Solana test validator
        // Default port for solana-test-validator is 8899
        const connectionUrl = 'http://localhost:8899';
        const connection = new Connection(connectionUrl, 'confirmed');
        
        // Initialize the service
        service = new SolanaService(connection, wallet.adapter);
        setSolanaService(service);
        
        console.log("Solana service initialized successfully with local validator");
      } catch (err) {
        console.error("Error initializing Solana service:", err);
        setError(err);
        setSolanaService(null);
      } finally {
        setLoading(false);
      }
    };

    initializeService();

    // Clean up function
    return () => {
      service = null;
    };
  }, [wallet, publicKey, connected, cluster]);

  return {
    solanaService,
    loading,
    error,
    isInitialized: !!solanaService
  };
}

export default useSolanaService;