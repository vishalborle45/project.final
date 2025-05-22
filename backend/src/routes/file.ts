import { Router } from 'express';
import multer from 'multer';
import { uploadFile, retrieveFile, deleteFile } from '../controllers/fileHandling';
import { authenticate } from '../middleware/authMiddleware';

const filerouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

filerouter.post('/upload', upload.single('file'),authenticate, uploadFile);
filerouter.post('/retrieve',authenticate, retrieveFile);
filerouter.post('/delete',authenticate, deleteFile);

export default filerouter;