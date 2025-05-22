import PinataSDK from '@pinata/sdk';
import axios from 'axios';
import { Readable } from 'stream';

if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
  throw new Error('Pinata API credentials not found in environment variables');
}

const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_API_SECRET
});

export const uploadToIPFS = async (data: Buffer): Promise<string> => {
  try {
    await pinata.testAuthentication();
    const stream = BufferToStream(data);
    const options = {
      pinataMetadata: {
        name: `Upload-${Date.now()}`
      }
    };
    const result = await pinata.pinFileToIPFS(stream, options);
    return result.IpfsHash;
  } catch (error: any) {
    console.error('Pinata upload error:', error);
    throw new Error(`Failed to upload to Pinata: ${error.message}`);
  }
};

export const retrieveFromIPFS = async (cid: string): Promise<Buffer> => {
  try {
    if (!cid) throw new Error('CID is required');
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 10000 // 10 second timeout
    });
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('Pinata retrieve error:', error);
    throw new Error(`Failed to retrieve from Pinata gateway: ${error.message}`);
  }
};

export const deleteFromIPFS = async (cid: string): Promise<void> => {
  try {
    if (!cid) throw new Error('CID is required');
    await pinata.testAuthentication();
    await pinata.unpin(cid);
    console.log('Successfully unpinned file from Pinata:', cid);
  } catch (error: any) {
    console.error('Pinata unpin error:', error);
    throw new Error(`Failed to unpin from Pinata: ${error.message}`);
  }
};

// Helper: Convert Buffer to Readable Stream
function BufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
