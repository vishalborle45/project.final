import React, { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface Transaction {
  signature: string;
  blockTime: number;
  type: 'upload' | 'share' | 'revoke' | 'delete';
  status: 'confirmed' | 'failed';
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const cluster = import.meta.env.VITE_SOLANA_NETWORK || "devnet";

  const openBlockExplorer = useCallback(
    (signature: string) => {
      const baseUrl = 'https://explorer.solana.com';
      const url = `${baseUrl}/tx/${signature}?cluster=${cluster}`;
      window.open(url, '_blank');
    },
    [cluster]
  );

  const fetchTransactions = useCallback(async () => {
    if (!connected || !publicKey || !connection) {
      setError('Please connect your wallet.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTransactions([]);

      const programId = new PublicKey('2aReMC6cg9RoeLrVtnXrpgaPKLo6cakpv7Ft77XQgR18');
      
      // Get transactions specifically for the connected wallet
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 100,
      });

      if (signatures.length === 0) {
        setError('No transactions found.');
        return;
      }

      const txs = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getParsedTransaction(sig.signature, 'confirmed');
            if (!tx?.meta || !tx.transaction) return null;

            const logs = tx.meta.logMessages || [];
            let type: Transaction['type'] | null = null;

            if (logs.some((log) => log.includes('Document added successfully'))) {
              type = 'upload';
            } else if (logs.some((log) => log.includes('Document shared successfully'))) {
              type = 'share';
            } else if (logs.some((log) => log.includes('Access revoked successfully'))) {
              type = 'revoke';
            } else if (logs.some((log) => log.includes('Document closed'))) {
              type = 'delete';
            }

            if (!type) return null;

            return {
              signature: sig.signature,
              blockTime: sig.blockTime || Math.floor(Date.now() / 1000),
              type,
              status: tx.meta.err ? 'failed' : 'confirmed',
            } as Transaction;
          } catch (err) {
            console.error('Error processing transaction:', err);
            return null;
          }
        })
      );

      const validTxs = txs.filter((tx): tx is Transaction => tx !== null);

      if (validTxs.length === 0) {
        setError('No valid transactions found.');
      } else {
        const sortedTxs = validTxs.sort((a, b) => b.blockTime - a.blockTime);
        setTransactions(sortedTxs);
        setError(null);
      }
      setIsFirstLoad(false);
    } catch (error: unknown) {
      console.error('Failed to fetch transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction history.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, connected]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const searchTxHash = (e.target as HTMLFormElement).elements.namedItem(
        'searchTxHash'
      ) as HTMLInputElement;
      if (searchTxHash?.value) {
        openBlockExplorer(searchTxHash.value);
      }
    },
    [openBlockExplorer]
  );

  if (loading && isFirstLoad) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-2xl font-bold">Transaction History</h2>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Skeleton className="h-12 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isFirstLoad) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-2xl font-bold">Transaction History</h2>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={fetchTransactions}
            disabled={loading || !connected}
            size="lg"
          >
            {loading ? 'Loading...' : 'Load Transactions'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-2xl font-bold">Transaction History</h2>
        </CardHeader>
        <CardContent>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="space-y-4 mb-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h2 className="text-2xl font-bold">Transaction History</h2>
        </CardHeader>
        <CardContent>
          <div className={`text-center p-4 ${error.includes('No transactions') ? 'text-gray-500' : 'text-red-500'}`}>
            {error}
          </div>
          <div className="flex justify-center">
            <Button onClick={fetchTransactions} className="mt-4">
              {error.includes('No transactions') ? 'Refresh' : 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-2xl font-bold">Transaction Explorer</h2>
          <Button 
            onClick={fetchTransactions} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              name="searchTxHash"
              placeholder="Enter transaction signature..."
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Document Transaction History</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Explorer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.signature}>
                  <TableCell>
                    {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'Pending'}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{tx.type}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        tx.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openBlockExplorer(tx.signature)}
                      title="View in Explorer"
                      aria-label="View transaction in block explorer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loading && <Skeleton className="h-12 w-full mt-4" />}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
