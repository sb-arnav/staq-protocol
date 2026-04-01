import { PublicKey } from '@solana/web3.js';

// Program ID — will be set when Federico deploys
const STAQ_PROGRAM_ID = new PublicKey(
  process.env.STAQ_PROGRAM_ID || '11111111111111111111111111111111'
);

/**
 * StaqCredentials — SDK for the Staq Credential Protocol on Solana.
 *
 * Issue and verify non-transferable credentials that any Solana program can read.
 *
 * Quick start:
 *   const staq = new StaqCredentials(connection);
 *   const cred = await staq.verify(userWallet, "credit-score");
 *   if (cred) console.log(`Tier: ${cred.tier}, Score: ${cred.score}`);
 */
export class StaqCredentials {
  constructor(connection, programId = STAQ_PROGRAM_ID) {
    this.connection = connection;
    this.programId = programId;
  }

  /**
   * Derive the PDA for a credential.
   * @param {PublicKey} issuer - The issuer's public key
   * @param {PublicKey} user - The user's wallet
   * @param {string} slug - Credential identifier (e.g. "credit-score")
   * @returns {[PublicKey, number]} PDA address and bump
   */
  findCredentialAddress(issuer, user, slug) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('credential'),
        issuer.toBuffer(),
        user.toBuffer(),
        Buffer.from(slug),
      ],
      this.programId,
    );
  }

  /**
   * Derive the PDA for an issuer.
   * @param {PublicKey} issuer - The issuer's public key
   * @returns {[PublicKey, number]}
   */
  findIssuerAddress(issuer) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('issuer'), issuer.toBuffer()],
      this.programId,
    );
  }

  /**
   * Verify if a credential exists and return its data.
   * This is the most common operation — any app can call this.
   *
   * @param {PublicKey} issuer - Who issued the credential
   * @param {PublicKey} user - The user's wallet
   * @param {string} slug - Credential identifier
   * @returns {Object|null} Credential data or null if not found
   *
   * @example
   * const staq = new StaqCredentials(connection);
   * const cred = await staq.verify(STAQ_ISSUER, userWallet, "credit-score");
   * if (cred && cred.tier === "gold") {
   *   // Offer better rates to financially literate users
   * }
   */
  async verify(issuer, user, slug) {
    const [pda] = this.findCredentialAddress(issuer, user, slug);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseCredential(account.data);
  }

  /**
   * Check if an issuer is registered and active.
   * @param {PublicKey} issuer
   * @returns {Object|null} Issuer data or null
   */
  async checkIssuer(issuer) {
    const [pda] = this.findIssuerAddress(issuer);
    const account = await this.connection.getAccountInfo(pda);
    if (!account) return null;
    return this._parseIssuer(account.data);
  }

  /**
   * Get all credentials for a user from a specific issuer.
   * Uses getProgramAccounts with filters — may be slow on mainnet.
   *
   * @param {PublicKey} issuer
   * @param {PublicKey} user
   * @returns {Array<Object>} Array of credentials
   */
  async getAllCredentials(issuer, user) {
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { memcmp: { offset: 8, bytes: issuer.toBase58() } },
        { memcmp: { offset: 40, bytes: user.toBase58() } },
      ],
    });
    return accounts.map((a) => this._parseCredential(a.account.data)).filter(Boolean);
  }

  /**
   * Calculate a user's Staq Score — a reputation number derived from all credentials.
   * Higher tier + higher score = higher Staq Score.
   *
   * @param {PublicKey} issuer - The issuer to score against
   * @param {PublicKey} user - The user's wallet
   * @returns {number} Score from 0-1000
   */
  async getScore(issuer, user) {
    const creds = await this.getAllCredentials(issuer, user);
    if (creds.length === 0) return 0;

    const tierWeights = { platinum: 100, gold: 75, silver: 50, bronze: 25 };
    let total = 0;
    for (const cred of creds) {
      const tierWeight = tierWeights[cred.tier] || 25;
      const scoreWeight = (cred.score || 0) / 100;
      total += tierWeight * scoreWeight;
    }
    // Normalize to 0-1000 scale, cap at 1000
    return Math.min(1000, Math.round(total));
  }

  // ── Internal parsers — will be updated when we have the IDL ──

  _parseCredential(data) {
    // Placeholder — real implementation uses Anchor's BorshAccountsCoder
    // once we have Federico's IDL
    try {
      // Skip 8-byte discriminator
      const buf = Buffer.from(data);
      return {
        issuer: new PublicKey(buf.slice(8, 40)),
        user: new PublicKey(buf.slice(40, 72)),
        slug: buf.slice(76, 76 + buf.readUInt32LE(72)).toString('utf8'),
        tier: 'unknown', // parsed from data once IDL is available
        score: 0,
        timestamp: 0,
        raw: buf,
      };
    } catch {
      return null;
    }
  }

  _parseIssuer(data) {
    try {
      const buf = Buffer.from(data);
      return {
        issuer: new PublicKey(buf.slice(8, 40)),
        active: buf[72] === 1,
        raw: buf,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Well-known issuers.
 * As more platforms join the protocol, this list grows.
 */
export const KNOWN_ISSUERS = {
  STAQ: new PublicKey('BqHeLU3efLtFuyVe3XPq6UM11o3dN4WMyVwGrtgogagT'),
};

/**
 * Tier definitions used across the protocol.
 */
export const TIERS = {
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BRONZE: 'bronze',
};

/**
 * Quick helper — verify a Staq-issued credential in one line.
 *
 * @example
 * import { verifyStaqCredential } from '@staq/credentials';
 * const cred = await verifyStaqCredential(connection, userWallet, "credit-score");
 */
export async function verifyStaqCredential(connection, user, slug) {
  const client = new StaqCredentials(connection);
  return client.verify(KNOWN_ISSUERS.STAQ, user, slug);
}

/**
 * Quick helper — get a user's Staq Score.
 *
 * @example
 * import { getStaqScore } from '@staq/credentials';
 * const score = await getStaqScore(connection, userWallet);
 * // score is 0-1000
 */
export async function getStaqScore(connection, user) {
  const client = new StaqCredentials(connection);
  return client.getScore(KNOWN_ISSUERS.STAQ, user);
}
