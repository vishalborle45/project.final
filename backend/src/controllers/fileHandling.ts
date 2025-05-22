import { Request, Response } from 'express';
import { encryptFile, decryptFile, hashFile } from '../utils/Encrypt&Decrypt';
import { uploadToIPFS, retrieveFromIPFS, deleteFromIPFS } from '../utils/ipfs';


export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { signature } = req.body;
        if (!signature) {
            return res.status(400).json({ error: 'Signature is required' });
        }

        const fileBuffer = req.file.buffer;
        const fileHash = hashFile(fileBuffer);
        const encryptedData = encryptFile(fileBuffer, signature);
        const cid = await uploadToIPFS(encryptedData);
        
        res.json({
            success: true,
            cid,
            hash: fileHash
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process file' });
    }
};

export const retrieveFile = async (req: Request, res: Response) => {
    try {
        const { cid, signature, fileHash } = req.body;
        
        if (!cid || !signature || !fileHash) {
            return res.status(400).json({ error: 'CID and signature are required' });
        }

        const encryptedData = await retrieveFromIPFS(cid);
        const decryptedData = decryptFile(encryptedData, signature);
        
        const computedHash = hashFile(decryptedData);
        if (computedHash !== fileHash) {
            return res.status(400).json({ error: 'File hash verification failed' });
        }
        
        const fileName = req.body.fileName || '';
        const ext = fileName.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (['jpg', 'jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'gif') contentType = 'image/gif';
        else if (ext === 'pdf') contentType = 'application/pdf';
        else if (['mp4', 'webm'].includes(ext)) contentType = `video/${ext}`;
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.send(decryptedData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { cid, fileName } = req.body;
        if (!cid || !fileName) {
            return res.status(400).json({ error: 'CID and fileName are required' });
        }

        const blockchainDeleteStatus = req.body.blockchainStatus;
        if (!blockchainDeleteStatus) {
            return res.status(400).json({ error: 'Document must be deleted from blockchain first' });
        }

        await deleteFromIPFS(cid);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
};