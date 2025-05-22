import { create } from 'ipfs-http-client';

const ipfs = create({ host: '127.0.0.1', port: 5001, protocol: 'http' });

export const uploadToIPFS = async (data: Buffer): Promise<string> => {
    try {
        const result = await ipfs.add(data);
        return result.cid.toString();
    } catch (error: any) {
        console.error('IPFS upload error:', error);
        throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
};

export const retrieveFromIPFS = async (cid: string): Promise<Buffer> => {
    try {
        const chunks: Uint8Array[] = [];
        for await (const chunk of ipfs.cat(cid)) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    } catch (error) {
        throw new Error('Failed to retrieve from IPFS');
    }
};

export const deleteFromIPFS = async (cid: string): Promise<void> => {
    try {
        await ipfs.pin.rm(cid);
        console.log('Successfully unpinned file from IPFS:', cid);
    } catch (error: any) {
        console.error('IPFS delete error:', error);
        throw new Error(`Failed to delete from IPFS: ${error.message}`);
    }
};