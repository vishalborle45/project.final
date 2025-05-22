/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/document_storage.json`.
 */
export type DocumentStorage = {
  "address": "2aReMC6cg9RoeLrVtnXrpgaPKLo6cakpv7Ft77XQgR18",
  "metadata": {
    "name": "documentStorage",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addDocument",
      "discriminator": [
        199,
        23,
        223,
        108,
        14,
        241,
        149,
        49
      ],
      "accounts": [
        {
          "name": "userDocuments",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  100,
                  111,
                  99,
                  117,
                  109,
                  101,
                  110,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "document",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  99,
                  117,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "fileName"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "owner",
          "relations": [
            "userDocuments"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "fileName",
          "type": "string"
        },
        {
          "name": "cid",
          "type": "string"
        },
        {
          "name": "fileHash",
          "type": "string"
        }
      ]
    },
    {
      "name": "closeDocument",
      "discriminator": [
        15,
        249,
        134,
        244,
        90,
        126,
        220,
        237
      ],
      "accounts": [
        {
          "name": "userDocuments",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  100,
                  111,
                  99,
                  117,
                  109,
                  101,
                  110,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "document",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  99,
                  117,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "document.file_name",
                "account": "document"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "owner",
          "relations": [
            "userDocuments"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "userDocuments",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  100,
                  111,
                  99,
                  117,
                  109,
                  101,
                  110,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revokeAccess",
      "discriminator": [
        106,
        128,
        38,
        169,
        103,
        238,
        102,
        147
      ],
      "accounts": [
        {
          "name": "document",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "recipient"
        }
      ],
      "args": []
    },
    {
      "name": "shareDocument",
      "discriminator": [
        21,
        207,
        234,
        38,
        150,
        61,
        192,
        253
      ],
      "accounts": [
        {
          "name": "document",
          "writable": true
        },
        {
          "name": "sharer",
          "writable": true,
          "signer": true
        },
        {
          "name": "recipient"
        }
      ],
      "args": [
        {
          "name": "accessKey",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "document",
      "discriminator": [
        226,
        212,
        133,
        177,
        48,
        5,
        171,
        243
      ]
    },
    {
      "name": "userDocuments",
      "discriminator": [
        121,
        214,
        242,
        199,
        91,
        25,
        103,
        77
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notDocumentOwner",
      "msg": "Not the document owner"
    },
    {
      "code": 6001,
      "name": "alreadySharedWithRecipient",
      "msg": "Document already shared with this recipient"
    },
    {
      "code": 6002,
      "name": "invalidFileName",
      "msg": "Invalid file name length"
    },
    {
      "code": 6003,
      "name": "invalidCid",
      "msg": "Invalid CID length"
    },
    {
      "code": 6004,
      "name": "invalidHash",
      "msg": "Invalid hash length"
    },
    {
      "code": 6005,
      "name": "recipientNotFound",
      "msg": "Recipient not found in shared list"
    },
    {
      "code": 6006,
      "name": "accessKeyTooLong",
      "msg": "Access key is too long"
    }
  ],
  "types": [
    {
      "name": "document",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "fileName",
            "type": "string"
          },
          {
            "name": "cid",
            "type": "string"
          },
          {
            "name": "fileHash",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "sharedWith",
            "type": {
              "vec": {
                "defined": {
                  "name": "sharedWith"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "sharedWith",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "accessKey",
            "type": "string"
          },
          {
            "name": "sharedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userDocuments",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "documentCount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
