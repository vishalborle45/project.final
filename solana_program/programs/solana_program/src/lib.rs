use anchor_lang::prelude::*;

declare_id!("2aReMC6cg9RoeLrVtnXrpgaPKLo6cakpv7Ft77XQgR18");

#[program]
pub mod document_storage {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let user_documents = &mut ctx.accounts.user_documents;
        user_documents.owner = ctx.accounts.user.key();
        user_documents.document_count = 0;
        
        msg!("User document storage initialized");
        Ok(())
    }
    
    pub fn add_document(
        ctx: Context<AddDocument>,
        file_name: String,
        cid: String,
        file_hash: String,
    ) -> Result<()> {
        // Validate input lengths
        require!(file_name.len() <= 100, DocumentError::InvalidFileName);
        require!(cid.len() <= 100, DocumentError::InvalidCID);
        require!(file_hash.len() <= 100, DocumentError::InvalidHash);
        
        let user_documents = &mut ctx.accounts.user_documents;
        let document = &mut ctx.accounts.document;
        
        // Initialize document
        document.owner = ctx.accounts.user.key();
        document.file_name = file_name;
        document.cid = cid;
        document.file_hash = file_hash;
        document.created_at = Clock::get()?.unix_timestamp;
        document.shared_with = Vec::new();
        
        // Update document count
        user_documents.document_count = user_documents.document_count.checked_add(1)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        
        msg!("Document added successfully");
        Ok(())
    }

    pub fn share_document(
        ctx: Context<ShareDocument>,
        access_key: String,
    ) -> Result<()> {
        let document = &mut ctx.accounts.document;
        
        // Validate owner
        require!(document.owner == ctx.accounts.sharer.key(), DocumentError::NotDocumentOwner);
        
        // Check if already shared - we need to explicitly handle this error to match our test
        let recipient_key = ctx.accounts.recipient.key();
        for shared in document.shared_with.iter() {
            if shared.recipient == recipient_key {
                return err!(DocumentError::AlreadySharedWithRecipient);
            }
        }
        
        // Make sure access key isn't too large
        require!(access_key.len() <= 500, DocumentError::AccessKeyTooLong);
        
        // Add recipient to shared list
        document.shared_with.push(SharedWith {
            recipient: recipient_key,
            access_key, // Encrypted key that allows the recipient to decrypt the file
            shared_at: Clock::get()?.unix_timestamp,
        });
        
        msg!("Document shared successfully");
        Ok(())
    }

    pub fn revoke_access(ctx: Context<RevokeAccess>) -> Result<()> {
        let document = &mut ctx.accounts.document;
        let owner_key = ctx.accounts.owner.key();
        let recipient_key = ctx.accounts.recipient.key();
        
        // Validate owner
        require!(document.owner == owner_key, DocumentError::NotDocumentOwner);
        
        // Find the index of the recipient to remove
        let recipient_index = document.shared_with
            .iter()
            .position(|shared| shared.recipient == recipient_key)
            .ok_or(DocumentError::RecipientNotFound)?;
        
        // Remove recipient from the shared_with list
        document.shared_with.remove(recipient_index);
        
        msg!("Access revoked successfully for recipient");
        Ok(())
    }

    pub fn close_document(ctx: Context<CloseDocument>) -> Result<()> {
        let user_documents = &mut ctx.accounts.user_documents;
        
        // Safely decrement document count
        user_documents.document_count = user_documents.document_count.saturating_sub(1);
        
        // When account is closed using the close constraint,
        // Solana will automatically remove all the data
        
        msg!("Document closed and completely removed including all shared access");
        Ok(())
    }
}

#[account]
pub struct UserDocuments {
    pub owner: Pubkey,
    pub document_count: u64,
}

#[account]
pub struct Document {
    pub owner: Pubkey,
    pub file_name: String,
    pub cid: String,         // Content Identifier from IPFS
    pub file_hash: String,   // Hash of the file for verification
    pub created_at: i64,
    pub shared_with: Vec<SharedWith>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SharedWith {
    pub recipient: Pubkey,
    pub access_key: String,  // Encrypted key for the recipient to access the file
    pub shared_at: i64,
}

#[error_code]
pub enum DocumentError {
    #[msg("Not the document owner")]
    NotDocumentOwner,
    #[msg("Document already shared with this recipient")]
    AlreadySharedWithRecipient,
    #[msg("Invalid file name length")]
    InvalidFileName,
    #[msg("Invalid CID length")]
    InvalidCID,
    #[msg("Invalid hash length")]
    InvalidHash,
    #[msg("Recipient not found in shared list")]
    RecipientNotFound,
    #[msg("Access key is too long")]
    AccessKeyTooLong,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, 
        payer = user, 
        space = 8 + 32 + 8,
        seeds = [b"user_documents", user.key().as_ref()],
        bump
    )]
    pub user_documents: Account<'info, UserDocuments>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(file_name: String, cid: String, file_hash: String)]
pub struct AddDocument<'info> {
    #[account(
        mut,
        seeds = [b"user_documents", user.key().as_ref()],
        bump,
        has_one = owner @ DocumentError::NotDocumentOwner
    )]
    pub user_documents: Account<'info, UserDocuments>,
    
    #[account(
        init,
        payer = user,
        // Increase space for shared_with to accommodate more recipients
        // Add more precise calculation based on expected max recipients
        space = 8 + // discriminator
               32 + // owner pubkey
               4 + file_name.len() + // string length prefix + content 
               4 + cid.len() + // string length prefix + content
               4 + file_hash.len() + // string length prefix + content
               8 + // created_at timestamp
               4 + // vec length prefix
               // Space for shared_with vector entries (estimate 2-3 recipients max)
               3 * (32 + // recipient pubkey
                    4 + 500 + // access_key (string length + content)
                    8), // shared_at timestamp
        seeds = [b"document", user.key().as_ref(), file_name.as_bytes()],
        bump
    )]
    pub document: Account<'info, Document>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: This is the owner of user documents, verified in constraint above
    pub owner: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ShareDocument<'info> {
    #[account(mut)]
    pub document: Account<'info, Document>,
    
    #[account(mut)]
    pub sharer: Signer<'info>,
    
    /// CHECK: Recipient's public key
    pub recipient: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RevokeAccess<'info> {
    #[account(mut)]
    pub document: Account<'info, Document>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// CHECK: Recipient's public key to revoke access from
    pub recipient: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct CloseDocument<'info> {
    #[account(
        mut,
        seeds = [b"user_documents", user.key().as_ref()],
        bump,
        has_one = owner @ DocumentError::NotDocumentOwner
    )]
    pub user_documents: Account<'info, UserDocuments>,
    
    #[account(
        mut,
        close = user,
        constraint = document.owner == user.key() @ DocumentError::NotDocumentOwner,
        seeds = [b"document", user.key().as_ref(), document.file_name.as_bytes()],
        bump
    )]
    pub document: Account<'info, Document>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: This is the user documents owner, verified in constraint above
    pub owner: UncheckedAccount<'info>,
}