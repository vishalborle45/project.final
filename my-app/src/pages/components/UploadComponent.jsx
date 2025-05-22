// components/Upload.jsx
import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useSolanaService } from "../../hooks/UseSolanaService";

const UploadComponent = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [customName, setCustomName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { solanaService, loading: solanaLoading } = useSolanaService();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !solanaService) return;
    
    try {
      setIsUploading(true);
      const baseSignature = localStorage.getItem('signature');
      const signature = baseSignature ? baseSignature + (customName || selectedFile.name) : null;

      if (!signature) {
        alert('Signature not found. Please connect your wallet first.');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('signature', signature);
      formData.append('customName', customName || selectedFile.name);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_API_URL}/api/file/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const data = response.data;
      
      if (!data.success || !data.cid || !data.hash) {
        throw new Error('Invalid response from server');
      }
      
      try {
        const fileName = customName || selectedFile.name;
        await solanaService.addDocument(fileName, data.cid, data.hash);
        alert('File uploaded successfully!');
        setSelectedFile(null);
        setCustomName("");
      } catch (error) {
        throw new Error(`Failed to store metadata on blockchain: ${error.message}`);
      }
    } catch (error) {
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Upload Files</h1>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            <span className="text-lg font-medium">Upload a Document</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-md p-6 text-center">
            <Input
              type="file"
              className="hidden"
              id="file-upload"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-center block"
            >
              <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="mb-2">
                Drag and drop files here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, JPG, PNG
              </p>
            </label>
            {selectedFile && (
              <div className="mt-4 p-2 bg-accent rounded">
                <p className="text-sm break-all">{selectedFile.name}</p>
              </div>
            )}
          </div>
          {selectedFile && (
            <div className="mt-4">
              <Input
                type="text"
                placeholder="Enter custom name for file (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={!selectedFile || isUploading || solanaLoading || !solanaService}
            onClick={handleUpload}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default UploadComponent;
