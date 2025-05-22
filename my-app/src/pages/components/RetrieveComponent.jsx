// components/Retrieve.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Download, Eye, Trash2, Share2, X } from "lucide-react";
import { useSolanaService } from "@/hooks/UseSolanaService";
import axios from "axios";
import { createHash } from 'crypto-browserify';
import CryptoJS from 'crypto-js';

// Custom Dialog Component
const CustomDialog = ({ isOpen, onClose, title, description, children, footer }) => {
  const dialogRef = useRef(null);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    };
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    };
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      {/* Dialog */}
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6 mx-4 border border-border"
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
          <h2 id="dialog-title" className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </h2>
          <p id="dialog-description" className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        
        {/* Content */}
        <div className="py-4">
          {children}
        </div>
        
        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          {footer}
        </div>
      </div>
    </div>
  );
};

const RetrieveComponent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [recipientPublicKey, setRecipientPublicKey] = useState("");
  const { solanaService } = useSolanaService();
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedUserToRevoke, setSelectedUserToRevoke] = useState("");

  console.log("api url:  ", process.env.NEXT_PUBLIC_SERVER_API_URL);

  useEffect(() => {
    fetchDocuments();
  }, [solanaService]);

  useEffect(() => {
    const filtered = documents.filter(doc => 
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDocuments(filtered);
  }, [documents, searchQuery]);

  const fetchDocuments = async () => {
    try {
      if (!solanaService) return;
      const userDocs = await solanaService.getUserDocuments();
      // Filter out shared documents (ones with accessKey)
      const ownedDocs = userDocs.filter(doc => !doc.accessKey);
      setDocuments(ownedDocs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is now handled by the useEffect above
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(extension)) return 'video';
    if (extension === 'pdf') return 'pdf';
    return 'other';
  };

  const handleView = async (doc) => {
    try {
      const baseSignature = localStorage.getItem('signature');
      if (!baseSignature) {
        throw new Error("No signature found");
      }
      const signature = baseSignature + doc.fileName;

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/api/file/retrieve`, {
        cid: doc.cid,
        fileName: doc.fileName,
        fileHash: doc.fileHash,
        signature: signature,
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
      // Cleanup URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error viewing document:", error);
      alert("Failed to retrieve document");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const baseSignature = localStorage.getItem('signature');
      if (!baseSignature) {
        throw new Error("No signature found");
      }
      const signature = baseSignature + doc.fileName;

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/api/file/retrieve`, {
        cid: doc.cid,
        fileName: doc.fileName,
        fileHash: doc.fileHash,
        signature: signature,
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
      alert("Failed to download document");
    }
  };

  const handleDelete = async (doc) => {
    try {
      // First delete from blockchain
      await solanaService.closeDocument(doc.fileName);
      
      // Then delete from IPFS through backend
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/api/file/delete`, {
        cid: doc.cid,
        fileName: doc.fileName,
        blockchainStatus: true
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.data.success) {
        throw new Error('Failed to delete file');
      }

      // Update UI by removing the deleted document
      setDocuments(prev => prev.filter(d => d.fileName !== doc.fileName));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
    }
  };

  const openShareDialog = (doc) => {
    setSelectedDoc(doc);
    setDialogOpen(true);
  };

  const closeShareDialog = () => {
    setDialogOpen(false);
    setRecipientPublicKey("");
  };

  const handleShare = async () => {
    try {
      if (!selectedDoc || !recipientPublicKey) {
        alert("Please select a document and enter recipient's public key");
        return;
      }

      const signature = localStorage.getItem('signature');
      if (!signature) {
        throw new Error("No signature found");
      }

      try {
        // Generate AES key from recipient's public key
        const aesKey = createHash('sha256')
          .update(recipientPublicKey)
          .digest('hex')
          .slice(0, 32);

        // Convert key to WordArray
        const keyWordArray = CryptoJS.enc.Hex.parse(aesKey);
        
        // Generate random IV
        const iv = CryptoJS.lib.WordArray.random(16);
        
        // Encrypt the signature
        const encrypted = CryptoJS.AES.encrypt(
          CryptoJS.enc.Utf8.parse(signature),
          keyWordArray,
          {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          }
        );

        // Create the access key object
        const accessKeyData = {
          iv: iv.toString(CryptoJS.enc.Base64),
          cipher: encrypted.ciphertext.toString(CryptoJS.enc.Base64)
        };

        // Convert to string for blockchain storage
        const accessKey = JSON.stringify(accessKeyData);
        
        // Share document on blockchain with encrypted data as access key
        await solanaService.shareDocument(selectedDoc.fileName, recipientPublicKey, accessKey);
        
        // Close dialog and reset form
        closeShareDialog();
        
        alert("Document shared successfully!");
      } catch (encryptionError) {
        console.error("Encryption error:", encryptionError);
        alert("Failed to encrypt signature for sharing");
      }
    } catch (error) {
      console.error("Error sharing document:", error);
      alert("Failed to share document");
    }
  };

  const openRevokeDialog = (doc) => {
    setSelectedDoc(doc);
    setRevokeDialogOpen(true);
  };

  const closeRevokeDialog = () => {
    setRevokeDialogOpen(false);
    setSelectedUserToRevoke("");
    setSelectedDoc(null);
  };

  const handleRevoke = async () => {
    try {
      if (!selectedDoc || !selectedUserToRevoke) {
        alert("Please select a user to revoke access from");
        return;
      }

      await solanaService.revokeAccess(selectedDoc.fileName, selectedUserToRevoke);
      
      // Update the documents list to reflect the change
      await fetchDocuments();
      
      closeRevokeDialog();
      alert("Access revoked successfully!");
    } catch (error) {
      console.error("Error revoking access:", error);
      alert("Failed to revoke access");
    }
  };

  if (loading) {
    return <div>Loading documents...</div>;
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">My Documents</h1>
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>Your Documents</CardHeader>
        <CardContent>
          {filteredDocuments.length > 0 ? (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
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
                    <Button size="sm" variant="ghost" onClick={() => handleView(doc)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openShareDialog(doc)}>
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    {doc.sharedWith && doc.sharedWith.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => openRevokeDialog(doc)}>
                        <X className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">
              No documents found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Custom Dialog for Sharing */}
      <CustomDialog
        isOpen={dialogOpen}
        onClose={closeShareDialog}
        title="Share Document"
        description="Enter the recipient's public key to share this document."
        footer={
          <>
            <Button variant="outline" onClick={closeShareDialog}>
              Cancel
            </Button>
            <Button onClick={handleShare}>
              Share
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected Document: {selectedDoc?.fileName}</p>
            <Input
              placeholder="Enter recipient's public key"
              value={recipientPublicKey}
              onChange={(e) => setRecipientPublicKey(e.target.value)}
            />
          </div>
        </div>
      </CustomDialog>

      {/* Custom Dialog for Revoking Access */}
      <CustomDialog
        isOpen={revokeDialogOpen}
        onClose={closeRevokeDialog}
        title="Revoke Access"
        description="Select a user to revoke access from this document."
        footer={
          <>
            <Button variant="outline" onClick={closeRevokeDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleRevoke}
              variant="destructive"
              disabled={!selectedUserToRevoke}
            >
              Revoke Access
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Document: {selectedDoc?.fileName}</p>
            {selectedDoc?.sharedWith && selectedDoc.sharedWith.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Select user to revoke access:</p>
                {selectedDoc.sharedWith.map((shared) => (
                  <div 
                    key={shared.recipient}
                    className={`p-2 rounded cursor-pointer ${
                      selectedUserToRevoke === shared.recipient 
                        ? 'bg-primary/10 border border-primary' 
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedUserToRevoke(shared.recipient)}
                  >
                    <p className="text-sm font-medium truncate">{shared.recipient}</p>
                    <p className="text-xs text-muted-foreground">
                      Shared on: {new Date(shared.sharedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No users have access to this document.</p>
            )}
          </div>
        </div>
      </CustomDialog>
    </>
  );
};

export default RetrieveComponent;