import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from '@solana/web3.js';
import { DocumentStorage } from "../../anchor/document_storage";
import idl from '../../anchor/document_storage.json';

export class SolanaService {
  private program: Program<DocumentStorage>;
  private connection: Connection;
  private wallet: anchor.Wallet;
  private programId: PublicKey;

  constructor(connection: Connection, wallet: anchor.Wallet, programIdString: string = "2aReMC6cg9RoeLrVtnXrpgaPKLo6cakpv7Ft77XQgR18") {
    this.connection = connection;
    this.wallet = wallet;
    this.programId = new PublicKey(programIdString);
    
    // Setup the provider
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' }
    );
    
    // Create the program interface
    this.program = new Program(
      idl as any,
      provider
    ) as Program<DocumentStorage>;
  }

  /**
   * Find the PDA for user documents
   */
  async findUserDocumentsPDA(userPublicKey: PublicKey): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddressSync(
      [Buffer.from("user_documents"), userPublicKey.toBuffer()],
      this.programId
    );
  }

  /**
   * Find the PDA for a specific document
   */
  async findDocumentPDA(userPublicKey: PublicKey, fileName: string): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddressSync(
      [Buffer.from("document"), userPublicKey.toBuffer(), Buffer.from(fileName)],
      this.programId
    );
  }

  /**
   * Initialize user document storage
   */
  async initializeUserDocuments(): Promise<string> {
    const [userDocumentsPDA] = await this.findUserDocumentsPDA(this.wallet.publicKey);
    
    const tx = await this.program.methods
      .initialize()
      .accounts({
        userDocuments: userDocumentsPDA,
        user: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }

  /**
   * Add a new document
   */
  async addDocument(fileName: string, cid: string, fileHash: string): Promise<string> {
    const [userDocumentsPDA] = await this.findUserDocumentsPDA(this.wallet.publicKey);
    const [documentPDA] = await this.findDocumentPDA(this.wallet.publicKey, fileName);
    
    const tx = await this.program.methods
      .addDocument(
        fileName,
        cid,
        fileHash
      )
      .accounts({
        userDocuments: userDocumentsPDA,
        document: documentPDA,
        user: this.wallet.publicKey,
        owner: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  }

  /**
   * Share a document with another user
   */
  async shareDocument(fileName: string, recipient: PublicKey, accessKey: string): Promise<string> {
    const [documentPDA] = await this.findDocumentPDA(this.wallet.publicKey, fileName);
    
    const tx = await this.program.methods
      .shareDocument(
        accessKey
      )
      .accounts({
        document: documentPDA,
        sharer: this.wallet.publicKey,
        recipient: recipient,
      })
      .rpc();
    
    return tx;
  }

  /**
   * Revoke access to a document for a specific recipient
   */
  async revokeAccess(fileName: string, recipient: PublicKey): Promise<string> {
    const [documentPDA] = await this.findDocumentPDA(this.wallet.publicKey, fileName);
    
    const tx = await this.program.methods
      .revokeAccess()
      .accounts({
        document: documentPDA,
        owner: this.wallet.publicKey,
        recipient: recipient,
      })
      .rpc();
    
    return tx;
  }

  /**
   * Close (delete) a document
   */
  async closeDocument(fileName: string): Promise<string> {
    const [userDocumentsPDA] = await this.findUserDocumentsPDA(this.wallet.publicKey);
    const [documentPDA] = await this.findDocumentPDA(this.wallet.publicKey, fileName);
    
    const tx = await this.program.methods
      .closeDocument()
      .accounts({
        userDocuments: userDocumentsPDA,
        document: documentPDA,
        user: this.wallet.publicKey,
        owner: this.wallet.publicKey,
      })
      .rpc();
    
    return tx;
  }

  /**
   * Get all documents owned by the current user
   */
  async getUserDocuments(): Promise<any[]> {
    const documents = await this.program.account.document.all([
      {
        memcmp: {
          offset: 8, // Skip the account discriminator (8 bytes)
          bytes: this.wallet.publicKey.toBase58(),
        },
      },
    ]);
    
    return documents.map(doc => ({
      publicKey: doc.publicKey.toString(),
      owner: doc.account.owner.toString(),
      fileName: doc.account.fileName,
      cid: doc.account.cid,
      fileHash: doc.account.fileHash,
      createdAt: new Date(doc.account.createdAt.toNumber() * 1000),
      sharedWith: doc.account.sharedWith.map(shared => ({
        recipient: shared.recipient.toString(),
        accessKey: shared.accessKey,
        sharedAt: new Date(shared.sharedAt.toNumber() * 1000)
      }))
    }));
  }

  /**
   * Get all documents shared with the current user
   */
  async getSharedDocuments(): Promise<any[]> {
    // Get all documents
    const allDocuments = await this.program.account.document.all();
    
    // Filter for ones shared with the current user
    const sharedWithMe = allDocuments.filter(doc => 
      doc.account.sharedWith.some(shared => 
        shared.recipient.toString() === this.wallet.publicKey.toString()
      )
    );
    
    // Format the response
    return sharedWithMe.map(doc => {
      // Find the specific sharing info for this user
      const shareInfo = doc.account.sharedWith.find(
        shared => shared.recipient.toString() === this.wallet.publicKey.toString()
      );
      
      return {
        publicKey: doc.publicKey.toString(),
        owner: doc.account.owner.toString(),
        fileName: doc.account.fileName,
        cid: doc.account.cid,
        fileHash: doc.account.fileHash,
        createdAt: new Date(doc.account.createdAt.toNumber() * 1000),
        accessKey: shareInfo.accessKey,
        sharedAt: new Date(shareInfo.sharedAt.toNumber() * 1000)
      };
    });
  }

  /**
   * Get a specific document by its fileName
   */
  async getDocument(fileName: string): Promise<any> {
    const [documentPDA] = await this.findDocumentPDA(this.wallet.publicKey, fileName);
    
    try {
      const documentAccount = await this.program.account.document.fetch(documentPDA);
      
      return {
        publicKey: documentPDA.toString(),
        owner: documentAccount.owner.toString(),
        fileName: documentAccount.fileName,
        cid: documentAccount.cid,
        fileHash: documentAccount.fileHash,
        createdAt: new Date(documentAccount.createdAt.toNumber() * 1000),
        sharedWith: documentAccount.sharedWith.map(shared => ({
          recipient: shared.recipient.toString(),
          accessKey: shared.accessKey,
          sharedAt: new Date(shared.sharedAt.toNumber() * 1000)
        }))
      };
    } catch (error) {
      console.error("Error fetching document:", error);
      return null;
    }
  }

  /**
   * Get user document stats (count of documents)
   */
  async getUserDocumentStats(): Promise<any> {
    const [userDocumentsPDA] = await this.findUserDocumentsPDA(this.wallet.publicKey);
    
    try {
      const userDocumentsAccount = await this.program.account.userDocuments.fetch(userDocumentsPDA);
      
      return {
        owner: userDocumentsAccount.owner.toString(),
        documentCount: userDocumentsAccount.documentCount.toNumber()
      };
    } catch (error) {
      console.error("Error fetching user document stats:", error);
      return null;
    }
  }
}