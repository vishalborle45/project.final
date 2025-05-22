// components/Shared.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share, ExternalLink } from "lucide-react";
import { useSolanaService } from "@/hooks/UseSolanaService";
import { useWallet } from '@solana/wallet-adapter-react';
import axios from "axios";
import { createHash } from 'crypto-browserify';
import CryptoJS from 'crypto-js';

const SharedComponent = () => {
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { solanaService } = useSolanaService();
  const { publicKey } = useWallet();

  useEffect(() => {
    fetchSharedDocuments();
  }, [solanaService]);

  const fetchSharedDocuments = async () => {
    try {
      if (!solanaService) return;
      const docs = await solanaService.getSharedDocuments();
      setSharedDocuments(docs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching shared documents:", error);
      setLoading(false);
    }
  };

  const decryptSignature = (accessKeyData, publicKeyString, doc) => {
    try {
      // Generate AES key from public key - same as encryption
      const aesKey = createHash('sha256')
        .update(publicKeyString)
        .digest('hex')
        .slice(0, 32);

      // Convert key to WordArray
      const keyWordArray = CryptoJS.enc.Hex.parse(aesKey);

      // Create cipher parameters
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(accessKeyData.cipher)
      });

      // Decrypt using AES
      const decrypted = CryptoJS.AES.decrypt(
        cipherParams,
        keyWordArray,
        {
          iv: CryptoJS.enc.Base64.parse(accessKeyData.iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      // Get decrypted base signature
      const decryptedBaseSignature = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedBaseSignature) {
        throw new Error('Decryption resulted in empty string');
      }

      // Return concatenated signature
      return decryptedBaseSignature + doc.fileName;
    } catch (error) {
      console.error('Decryption error details:', error);
      throw new Error('Failed to decrypt signature');
    }
  };

  const handleView = async (doc) => {
    try {
      if (!publicKey) {
        throw new Error("Please connect your wallet");
      }

      // Parse the access key data
      const accessKeyData = JSON.parse(doc.accessKey);
      
      // Decrypt signature using public key from wallet
      const decryptedSignature = decryptSignature(accessKeyData, publicKey.toString(), doc);

      // Verify decrypted signature is not empty
      if (!decryptedSignature) {
        throw new Error("Failed to decrypt signature");
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/api/file/retrieve`, {
        cid: doc.cid,
        fileName: doc.fileName,
        fileHash: doc.fileHash,
        signature: decryptedSignature,
        accessKey: doc.accessKey
      }, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error viewing document:", error);
      alert(error.message || "Failed to view document");
    }
  };

  const handleDownload = async (doc) => {
    try {
      if (!publicKey) {
        throw new Error("Please connect your wallet");
      }

      // Parse the access key data
      const accessKeyData = JSON.parse(doc.accessKey);
      
      // Decrypt signature
      const decryptedSignature = decryptSignature(accessKeyData, publicKey.toString(), doc);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/api/file/retrieve`, {
        cid: doc.cid,
        fileName: doc.fileName,
        fileHash: doc.fileHash,
        signature: decryptedSignature,
        accessKey: doc.accessKey
      }, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert(error.message || "Failed to download document");
    }
  };

  if (loading) {
    return <div>Loading shared documents...</div>;
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Shared With You</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            <span className="text-lg font-medium">Shared Documents</span>
          </div>
        </CardHeader>
        <CardContent>
          {sharedDocuments.length > 0 ? (
            <div className="space-y-3">
              {sharedDocuments.map((doc) => (
                <div
                  key={doc.publicKey}
                  className="flex justify-between items-center p-3 bg-accent/20 rounded-md"
                >
                  <div>
                    <p className="font-medium">{doc.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleView(doc)}>
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">
              No documents have been shared with you
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default SharedComponent;
