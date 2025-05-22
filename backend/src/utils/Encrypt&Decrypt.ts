import * as crypto from 'crypto';

export const encryptFile = (buffer: Buffer, signature: string): Buffer => {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(signature, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encryptedData = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return encryptedData;
};

export const decryptFile = (encryptedData: Buffer, signature: string): Buffer => {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(signature, 'salt', 32);
    const iv = encryptedData.subarray(0, 16);
    const encryptedContent = encryptedData.subarray(16);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decryptedData = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
    return decryptedData;
};

export const hashFile = (buffer: Buffer): string => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};