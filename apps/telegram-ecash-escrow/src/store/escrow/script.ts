import {
  OP_1,
  OP_2,
  OP_3,
  OP_4,
  OP_5,
  OP_6,
  OP_BOOLOR,
  OP_CAT,
  OP_CHECKDATASIGVERIFY,
  OP_CHECKSIG,
  OP_DEPTH,
  OP_DUP,
  OP_ELSE,
  OP_ENDIF,
  OP_EQUAL,
  OP_EQUALVERIFY,
  OP_FROMALTSTACK,
  OP_HASH160,
  OP_IF,
  OP_SWAP,
  OP_TOALTSTACK,
  OP_VERIFY,
  Script,
  pushBytesOp,
  shaRmd160,
  strToBytes
} from 'ecash-lib';

export class Escrow {
  public sellerPk: Uint8Array;
  public buyerPk: Uint8Array;
  public arbiPk: Uint8Array;
  public modPk: Uint8Array;
  public nonce: string;

  constructor({
    sellerPk,
    buyerPk,
    arbiPk,
    modPk,
    nonce
  }: {
    sellerPk: Uint8Array;
    buyerPk: Uint8Array;
    arbiPk: Uint8Array;
    modPk: Uint8Array;
    nonce: string;
  }) {
    this.sellerPk = sellerPk;
    this.buyerPk = buyerPk;
    this.arbiPk = arbiPk;
    this.modPk = modPk;
    this.nonce = nonce;
  }

  /** Build the Script enforcing the Agora offer covenant. */
  public script(): Script {
    const sellerPkh = shaRmd160(this.sellerPk);
    const buyerPkh = shaRmd160(this.buyerPk);
    const arbiPkh = shaRmd160(this.arbiPk);
    const modPkh = shaRmd160(this.modPk);
    const nonce = strToBytes(this.nonce);

    return Script.fromOps([
      OP_DUP, // We need to use the byte again afterwards
      //Get the hashed public keys we need to compare against (ours, and the oracle)
      OP_1,
      OP_EQUAL,
      OP_IF,
      pushBytesOp(sellerPkh), //<hash160(SellerPubKey)> # Oracle pub key
      pushBytesOp(buyerPkh), //<hash160(BuyerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_2, //# = release to buyer from arbitrator
      OP_EQUAL,
      OP_IF,
      pushBytesOp(arbiPkh), //<hash160(ArbPubKey)> # Oracle pub key
      pushBytesOp(buyerPkh), //<hash160(BuyerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_3, //# = return to seller from buyer
      OP_EQUAL,
      OP_IF,
      pushBytesOp(buyerPkh), //<hash160(BuyerPubKey)> # Oracle pub key
      pushBytesOp(sellerPkh), //<hash160(SellerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_4, //# = return to seller from arbitrator
      OP_EQUAL,
      OP_IF,
      pushBytesOp(arbiPkh), //<hash160(ArbPubKey)> # Oracle pub key
      pushBytesOp(sellerPkh), //<hash160(SellerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_5, //# = release to buyer from moderator
      OP_EQUAL,
      OP_IF,
      pushBytesOp(modPkh), //<hash160(ArbPubKey)> # Oracle pub key
      pushBytesOp(buyerPkh), //<hash160(SellerPubKey)> # Spender pub key
      OP_ELSE,
      OP_DUP,
      OP_6, //# = return to seller from moderator
      OP_EQUALVERIFY,
      pushBytesOp(modPkh), //<hash160(ArbPubKey)> # Oracle pub key
      pushBytesOp(sellerPkh), //<hash160(SellerPubKey)> # Spender pub key
      OP_ENDIF,
      OP_ENDIF,
      OP_ENDIF,
      OP_ENDIF,
      OP_ENDIF,
      //# Put the hashed public keys on the alt stack
      OP_TOALTSTACK,
      OP_TOALTSTACK, //# Stack is effectively reset to the input
      //# On the alt stack we have: [ hash160(SpenderPubKey), hash160(OraclePubKey) ]
      pushBytesOp(nonce), //<EscrowKey> # Append the nonce to the escrow key to make the message
      OP_CAT, //# Stack is [ ..., <OraclePubKey>, <0x01 || EscrowKey> ]
      OP_SWAP, //# Use this later; verify the oracle public key hash first
      OP_DUP,
      OP_HASH160,
      OP_FROMALTSTACK, //# Grab hashed pub key from alt stack
      OP_EQUALVERIFY, //# Public key checks out; now verify the oracle signature
      OP_CHECKDATASIGVERIFY, //# Now verify the sender
      OP_DUP,
      OP_HASH160,
      OP_FROMALTSTACK,
      OP_EQUALVERIFY,
      OP_CHECKSIG
    ]);
  }
}

export class EscrowFee {
  public sellerPk: Uint8Array;
  public buyerPk: Uint8Array;
  public arbiPk: Uint8Array;
  public modPk: Uint8Array;
  public nonce: string;

  constructor({
    sellerPk,
    buyerPk,
    arbiPk,
    modPk,
    nonce
  }: {
    sellerPk: Uint8Array;
    buyerPk: Uint8Array;
    arbiPk: Uint8Array;
    modPk: Uint8Array;
    nonce: string;
  }) {
    this.sellerPk = sellerPk;
    this.buyerPk = buyerPk;
    this.arbiPk = arbiPk;
    this.modPk = modPk;
    this.nonce = nonce;
  }

  public script(): Script {
    const sellerPkh = shaRmd160(this.sellerPk);
    const buyerPkh = shaRmd160(this.buyerPk);
    const arbiPkh = shaRmd160(this.arbiPk);
    const modPkh = shaRmd160(this.modPk);
    const nonce = strToBytes(this.nonce);

    return Script.fromOps([
      OP_DEPTH, // Count stack size
      OP_2,
      OP_EQUAL, // Does the input stack only have two items?
      OP_IF, // If yes, this is arb/mod collecting fee; check both PKH
      OP_DUP,
      OP_HASH160,
      OP_DUP, // Duplicate the hash for two comparisons
      pushBytesOp(arbiPkh), // Check if it's arbitrator
      OP_EQUAL,
      OP_SWAP, // Bring the hash back to top
      pushBytesOp(modPkh), // Check if it's moderator
      OP_EQUAL,
      OP_BOOLOR, // Either arbitrator OR moderator is valid
      OP_VERIFY, // Must be one of them
      OP_CHECKSIG,
      OP_ELSE, // Escrow spending cases
      OP_DUP,
      OP_3, // = return from buyer
      OP_EQUAL,
      OP_IF,
      pushBytesOp(buyerPkh), // Buyer as oracle
      OP_ELSE,
      OP_DUP,
      OP_4, // = return from arbitrator
      OP_EQUAL,
      OP_IF,
      pushBytesOp(arbiPkh), // Arbitrator as oracle
      OP_ELSE,
      OP_DUP,
      OP_6, // = return from moderator
      OP_EQUALVERIFY, // Must be 6, else unknown action
      pushBytesOp(modPkh), // Moderator as oracle
      OP_ENDIF,
      OP_ENDIF,
      pushBytesOp(sellerPkh), // Seller is always the spender in return cases
      // Put the hashed public keys on the alt stack
      OP_TOALTSTACK,
      OP_TOALTSTACK, // Stack is effectively reset to the input
      // On the alt stack we have: [ hash160(SpenderPubKey), hash160(OraclePubKey) ]
      pushBytesOp(nonce), // Append the nonce to make the message
      OP_CAT, // Stack is [ ..., <OraclePubKey>, <ActionByte || EscrowKey> ]
      OP_SWAP, // Verify the oracle public key hash first
      OP_DUP,
      OP_HASH160,
      OP_FROMALTSTACK, // Grab oracle hash from alt stack
      OP_EQUALVERIFY, // Public key checks out; verify oracle signature
      OP_CHECKDATASIGVERIFY, // Verify the sender
      OP_DUP,
      OP_HASH160,
      OP_FROMALTSTACK,
      OP_EQUALVERIFY,
      OP_CHECKSIG,
      OP_ENDIF
    ]);
  }
}

export class EscrowBuyerDepositFee {
  public sellerPk: Uint8Array;
  public buyerPk: Uint8Array;
  public arbiPk: Uint8Array;
  public modPk: Uint8Array;
  public nonce: string;

  constructor({
    sellerPk,
    buyerPk,
    arbiPk,
    modPk,
    nonce
  }: {
    sellerPk: Uint8Array;
    buyerPk: Uint8Array;
    arbiPk: Uint8Array;
    modPk: Uint8Array;
    nonce: string;
  }) {
    this.sellerPk = sellerPk;
    this.buyerPk = buyerPk;
    this.arbiPk = arbiPk;
    this.modPk = modPk;
    this.nonce = nonce;
  }

  public script(): Script {
    const sellerPkh = shaRmd160(this.sellerPk);
    const buyerPkh = shaRmd160(this.buyerPk);
    const arbiPkh = shaRmd160(this.arbiPk);
    const modPkh = shaRmd160(this.modPk);
    const nonce = strToBytes(this.nonce);

    return Script.fromOps([
      OP_DEPTH, // Count stack size
      OP_2,
      OP_EQUAL, // Does the input stack only have two items?
      OP_IF, // If yes, this is arb/mod collecting fee; check both PKH
      OP_DUP,
      OP_HASH160,
      OP_DUP, // Duplicate the hash for two comparisons
      pushBytesOp(arbiPkh), // Check if it's arbitrator
      OP_EQUAL,
      OP_SWAP, // Bring the hash back to top
      pushBytesOp(modPkh), // Check if it's moderator
      OP_EQUAL,
      OP_BOOLOR, // Either arbitrator OR moderator is valid
      OP_VERIFY, // Must be one of them
      OP_CHECKSIG,
      OP_ELSE, // Escrow spending cases
      OP_DUP,
      OP_1, // = release from seller
      OP_EQUAL,
      OP_IF,
      pushBytesOp(sellerPkh), // seller as oracle
      OP_ELSE,
      OP_DUP,
      OP_2, // = release from arbitrator
      OP_EQUAL,
      OP_IF,
      pushBytesOp(arbiPkh), // Arbitrator as oracle
      OP_ELSE,
      OP_DUP,
      OP_5, // = release from moderator
      OP_EQUALVERIFY, // Must be 6, else unknown action
      pushBytesOp(modPkh), // Moderator as oracle
      OP_ENDIF,
      OP_ENDIF,
      pushBytesOp(buyerPkh), // Buyer is always the spender in return cases
      // Put the hashed public keys on the alt stack
      OP_TOALTSTACK,
      OP_TOALTSTACK, // Stack is effectively reset to the input
      // On the alt stack we have: [ hash160(SpenderPubKey), hash160(OraclePubKey) ]
      pushBytesOp(nonce), // Append the nonce to make the message
      OP_CAT, // Stack is [ ..., <OraclePubKey>, <ActionByte || EscrowKey> ]
      OP_SWAP, // Verify the oracle public key hash first
      OP_DUP,
      OP_HASH160,
      OP_FROMALTSTACK, // Grab oracle hash from alt stack
      OP_EQUALVERIFY, // Public key checks out; verify oracle signature
      OP_CHECKDATASIGVERIFY, // Verify the sender
      OP_DUP,
      OP_HASH160,
      OP_FROMALTSTACK,
      OP_EQUALVERIFY,
      OP_CHECKSIG,
      OP_ENDIF
    ]);
  }
}
