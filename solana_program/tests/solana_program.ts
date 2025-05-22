import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from '@solana/web3.js';
import { DocumentStorage } from "../target/types/document_storage";
import { expect } from 'chai';
import { BN } from "bn.js";

describe("document_storage", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DocumentStorage as Program<DocumentStorage>;
  
  // Create keypairs for different users
  const ownerKeypair = Keypair.generate();
  const recipientKeypair = Keypair.generate();
  const secondRecipientKeypair = Keypair.generate();
  
  // Document data
  const fileName = "test_document.pdf";
  const cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const fileHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // SHA-256 hash
  
  // Access keys for shared users (encrypted document keys)
  // Use shorter access keys to reduce account size requirements
  const accessKeyForRecipient = "eyJhbGciOiJSU0EtT0FFUCIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJ0ZXN0In0.test123";
  const accessKeyForSecondRecipient = "eyJhbGciOiJSU0EtT0FFUCIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJ0ZXN0Mn0.test456";
  
  // PDAs for our accounts
  let userDocumentsPDA;
  let userDocumentsBump;
  let documentPDA;
  let documentBump;
  let secondDocumentPDA;
  let secondDocumentBump;
  
  const secondFileName = "second_doc.txt";
  const secondCid = "QmSecondDocumentCID123456789";
  const secondFileHash = "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2";
  
  // Find PDAs
  before(async () => {
    // Fund accounts
    const airdropOwner = await provider.connection.requestAirdrop(
      ownerKeypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropOwner);
    
    const airdropRecipient = await provider.connection.requestAirdrop(
      recipientKeypair.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropRecipient);
    
    // Find user documents PDA
    const [userDocumentsPDAAddress, userDocumentsFoundBump] = 
      await PublicKey.findProgramAddressSync(
        [Buffer.from("user_documents"), ownerKeypair.publicKey.toBuffer()],
        program.programId
      );
    userDocumentsPDA = userDocumentsPDAAddress;
    userDocumentsBump = userDocumentsFoundBump;
    
    // Find document PDA
    const [documentPDAAddress, documentFoundBump] = 
      await PublicKey.findProgramAddressSync(
        [Buffer.from("document"), ownerKeypair.publicKey.toBuffer(), Buffer.from(fileName)],
        program.programId
      );
    documentPDA = documentPDAAddress;
    documentBump = documentFoundBump;
    
    // Find second document PDA
    const [secondDocumentPDAAddress, secondDocumentFoundBump] = 
      await PublicKey.findProgramAddressSync(
        [Buffer.from("document"), ownerKeypair.publicKey.toBuffer(), Buffer.from(secondFileName)],
        program.programId
      );
    secondDocumentPDA = secondDocumentPDAAddress;
    secondDocumentBump = secondDocumentFoundBump;

    console.log("Owner public key:", ownerKeypair.publicKey.toString());
    console.log("User Documents PDA:", userDocumentsPDA.toString());
    console.log("Document PDA:", documentPDA.toString());
    console.log("Second Document PDA:", secondDocumentPDA.toString());
  });

  it("Initializes user document storage", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        userDocuments: userDocumentsPDA,
        user: ownerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ownerKeypair])
      .rpc();
    
    console.log("Initialize transaction signature", tx);
    
    // Verify the user documents account
    const userDocumentsAccount = await program.account.userDocuments.fetch(userDocumentsPDA);
    expect(userDocumentsAccount.owner.toString()).to.equal(ownerKeypair.publicKey.toString());
    expect(userDocumentsAccount.documentCount.toNumber()).to.equal(0);
  });

  it("Adds a document", async () => {
    const tx = await program.methods
      .addDocument(
        fileName,
        cid,
        fileHash
      )
      .accounts({
        userDocuments: userDocumentsPDA,
        document: documentPDA,
        user: ownerKeypair.publicKey,
        owner: ownerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ownerKeypair])
      .rpc();
    
    console.log("Add document transaction signature", tx);
    
    // Verify the document
    const documentAccount = await program.account.document.fetch(documentPDA);
    expect(documentAccount.owner.toString()).to.equal(ownerKeypair.publicKey.toString());
    expect(documentAccount.fileName).to.equal(fileName);
    expect(documentAccount.cid).to.equal(cid);
    expect(documentAccount.fileHash).to.equal(fileHash);
    expect(documentAccount.sharedWith.length).to.equal(0);
    
    // Verify the document count increased
    const userDocumentsAccount = await program.account.userDocuments.fetch(userDocumentsPDA);
    expect(userDocumentsAccount.documentCount.toNumber()).to.equal(1);
  });

  it("Adds a second document", async () => {
    const tx = await program.methods
      .addDocument(
        secondFileName,
        secondCid,
        secondFileHash
      )
      .accounts({
        userDocuments: userDocumentsPDA,
        document: secondDocumentPDA,
        user: ownerKeypair.publicKey,
        owner: ownerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ownerKeypair])
      .rpc();
    
    console.log("Add second document transaction signature", tx);
    
    // Verify the document count increased
    const userDocumentsAccount = await program.account.userDocuments.fetch(userDocumentsPDA);
    expect(userDocumentsAccount.documentCount.toNumber()).to.equal(2);
  });
  
  it("Shares a document with a recipient", async () => {
    const tx = await program.methods
      .shareDocument(
        accessKeyForRecipient
      )
      .accounts({
        document: documentPDA,
        sharer: ownerKeypair.publicKey,
        recipient: recipientKeypair.publicKey,
      })
      .signers([ownerKeypair])
      .rpc();
    
    console.log("Share document transaction signature", tx);
    
    // Verify the document is shared
    const documentAccount = await program.account.document.fetch(documentPDA);
    expect(documentAccount.sharedWith.length).to.equal(1);
    expect(documentAccount.sharedWith[0].recipient.toString()).to.equal(recipientKeypair.publicKey.toString());
    expect(documentAccount.sharedWith[0].accessKey).to.equal(accessKeyForRecipient);
    expect(documentAccount.sharedWith[0].sharedAt).to.be.an.instanceOf(BN);
  });
  
  it("Shares the document with another recipient", async () => {
    const tx = await program.methods
      .shareDocument(
        accessKeyForSecondRecipient
      )
      .accounts({
        document: documentPDA,
        sharer: ownerKeypair.publicKey,
        recipient: secondRecipientKeypair.publicKey,
      })
      .signers([ownerKeypair])
      .rpc();
    
    console.log("Share document with second recipient transaction signature", tx);
    
    // Verify the document is shared with second recipient
    const documentAccount = await program.account.document.fetch(documentPDA);
    expect(documentAccount.sharedWith.length).to.equal(2);
  });

  it("Fails when trying to share a document with the same recipient twice", async () => {
    try {
      await program.methods
        .shareDocument(
          "new_access_key_doesnt_matter"
        )
        .accounts({
          document: documentPDA,
          sharer: ownerKeypair.publicKey,
          recipient: secondRecipientKeypair.publicKey,
        })
        .signers([ownerKeypair])
        .rpc();
      
      // If we get here, the test should fail
      expect.fail("Should have thrown an error for duplicate recipient");
    } catch (error) {
      // Verify it's the correct error
      expect(error.toString()).to.include("Document already shared with this recipient");
    }
  });

  it("Retrieves all documents for owner", async () => {
    // Get all document accounts for the owner
    const documents = await program.account.document.all([
      {
        memcmp: {
          offset: 8, // Skip the account discriminator (8 bytes)
          bytes: ownerKeypair.publicKey.toBase58(),
        },
      },
    ]);
    
    console.log("Total documents owned:", documents.length);
    expect(documents.length).to.equal(2);
    
    // Verify document details
    documents.forEach(doc => {
      expect(doc.account.owner.toString()).to.equal(ownerKeypair.publicKey.toString());
      console.log("Document filename:", doc.account.fileName);
    });
  });
  
  it("Retrieves specific document by PDA", async () => {
    const documentAccount = await program.account.document.fetch(documentPDA);
    
    expect(documentAccount.fileName).to.equal(fileName);
    expect(documentAccount.cid).to.equal(cid);
    expect(documentAccount.fileHash).to.equal(fileHash);
    console.log("Specific document retrieved:", documentAccount.fileName);
  });
  
  it("Recipient can retrieve documents shared with them for their dashboard", async () => {
    // This simulates a query from the recipient's perspective
    // In a real frontend, this would be called when a recipient logs in and views their dashboard
    
    // Get all document accounts from the blockchain
    const allDocuments = await program.account.document.all();
    
    // Filter only documents that have been shared with this specific recipient
    const documentsSharedWithMe = allDocuments.filter(doc => 
      doc.account.sharedWith.some(shared => 
        shared.recipient.toString() === recipientKeypair.publicKey.toString()
      )
    );
    
    console.log(`Recipient dashboard shows ${documentsSharedWithMe.length} shared documents`);
    expect(documentsSharedWithMe.length).to.be.at.least(1);
    
    // For each shared document, extract the recipient-specific encryption details
    // This is what would be used to display and decrypt documents on the recipient's dashboard
    const dashboardItems = documentsSharedWithMe.map(doc => {
      // Find this recipient's specific sharing information
      const myShareInfo = doc.account.sharedWith.find(
        shared => shared.recipient.toString() === recipientKeypair.publicKey.toString()
      );
      
      return {
        documentId: doc.publicKey.toString(),
        owner: doc.account.owner.toString(),
        fileName: doc.account.fileName,
        cid: doc.account.cid,
        fileHash: doc.account.fileHash,
        // This is the recipient-specific encrypted document key
        accessKey: myShareInfo.accessKey,
        // Convert BN to number for display purposes
        sharedAt: new Date(myShareInfo.sharedAt.toNumber() * 1000).toLocaleString(),
      };
    });
    
    console.log("Recipient's dashboard items:", dashboardItems);
    
    // Verify the specific access key for this recipient
    expect(dashboardItems[0].accessKey).to.equal(accessKeyForRecipient);
  });
  
  it("Prevents non-owners from revoking access", async () => {
    try {
      // Try to revoke access using recipient's keypair instead of owner's
      await program.methods
        .revokeAccess()
        .accounts({
          document: documentPDA,
          owner: recipientKeypair.publicKey, // Not the owner
          recipient: secondRecipientKeypair.publicKey,
        })
        .signers([recipientKeypair])
        .rpc();
      
      // If we get here, the test should fail
      expect.fail("Should have thrown an error for non-owner trying to revoke access");
    } catch (error) {
      // Verify it's the correct error
      expect(error.toString()).to.include("Not the document owner");
    }
  });
  
  it("Revokes access from a recipient", async () => {
    // First, verify that the second recipient is still in the shared_with list
    let documentBeforeRevoke = await program.account.document.fetch(documentPDA);
    const secondRecipientExists = documentBeforeRevoke.sharedWith.some(
      shared => shared.recipient.toString() === secondRecipientKeypair.publicKey.toString()
    );
    expect(secondRecipientExists).to.be.true;
    expect(documentBeforeRevoke.sharedWith.length).to.equal(2);

    // Now revoke access for the second recipient
    const tx = await program.methods
      .revokeAccess()
      .accounts({
        document: documentPDA,
        owner: ownerKeypair.publicKey,
        recipient: secondRecipientKeypair.publicKey,
      })
      .signers([ownerKeypair])
      .rpc();
    
    console.log("Revoke access transaction signature", tx);
    
    // Verify access is revoked
    const documentAccount = await program.account.document.fetch(documentPDA);
    
    // Check that the second recipient is no longer in the shared_with list
    const stillShared = documentAccount.sharedWith.some(
      shared => shared.recipient.toString() === secondRecipientKeypair.publicKey.toString()
    );
    
    expect(stillShared).to.be.false;
    expect(documentAccount.sharedWith.length).to.equal(1); // Only first recipient remains
  });
  
  it("Fails when attempting to revoke access from a non-shared recipient", async () => {
    try {
      await program.methods
        .revokeAccess()
        .accounts({
          document: documentPDA,
          owner: ownerKeypair.publicKey,
          recipient: secondRecipientKeypair.publicKey, // Already revoked
        })
        .signers([ownerKeypair])
        .rpc();
      
      // If we get here, the test should fail
      expect.fail("Should have thrown an error for non-shared recipient");
    } catch (error) {
      // Verify it's the correct error
      expect(error.toString()).to.include("Recipient not found");
    }
  });
  
  it("Closes a document", async () => {
    const tx = await program.methods
      .closeDocument()
      .accounts({
        userDocuments: userDocumentsPDA,
        document: secondDocumentPDA,
        user: ownerKeypair.publicKey,
        owner: ownerKeypair.publicKey,
      })
      .signers([ownerKeypair])
      .rpc();
    
    console.log("Close document transaction signature", tx);
    
    // Verify the document count decreased
    const userDocumentsAccount = await program.account.userDocuments.fetch(userDocumentsPDA);
    expect(userDocumentsAccount.documentCount.toNumber()).to.equal(1);
    
    // Verify the document no longer exists
    try {
      await program.account.document.fetch(secondDocumentPDA);
      expect.fail("Document should be closed");
    } catch (error) {
      // Expected error: Account does not exist
      expect(error.toString()).to.include("Account does not exist");
    }
  });
  
  it("Updates user document count correctly", async () => {
    // Get starting document count
    const startingDocumentCount = (await program.account.userDocuments.fetch(userDocumentsPDA)).documentCount.toNumber();
    
    // Add a new document
    const tempFileName = "temp_document.txt";
    const tempCid = "QmTempDocumentCID123456789";
    const tempFileHash = "tempFileHash123456789";
    
    const [tempDocumentPDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("document"), ownerKeypair.publicKey.toBuffer(), Buffer.from(tempFileName)],
      program.programId
    );
    
    // Add document
    await program.methods
      .addDocument(
        tempFileName,
        tempCid,
        tempFileHash
      )
      .accounts({
        userDocuments: userDocumentsPDA,
        document: tempDocumentPDA,
        user: ownerKeypair.publicKey,
        owner: ownerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([ownerKeypair])
      .rpc();
    
    // Verify count increased
    const middleDocumentCount = (await program.account.userDocuments.fetch(userDocumentsPDA)).documentCount.toNumber();
    expect(middleDocumentCount).to.equal(startingDocumentCount + 1);
    
    // Close document
    await program.methods
      .closeDocument()
      .accounts({
        userDocuments: userDocumentsPDA,
        document: tempDocumentPDA,
        user: ownerKeypair.publicKey,
        owner: ownerKeypair.publicKey,
      })
      .signers([ownerKeypair])
      .rpc();
    
    // Verify count decreased back to start
    const endDocumentCount = (await program.account.userDocuments.fetch(userDocumentsPDA)).documentCount.toNumber();
    expect(endDocumentCount).to.equal(startingDocumentCount);
  });
});