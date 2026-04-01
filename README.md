# Staq Credential Protocol

**Open credential infrastructure for verifiable skills on Solana.**

Issue, verify, and score non-transferable credentials that any Solana program can read. Built for education, hiring, DeFi, and identity — starting with financial literacy in India.

## How it works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Issuers   │────▶│  Staq Protocol   │◀────│   Verifiers     │
│             │     │  (Anchor + SAS)  │     │                 │
│ • Staq App  │     │                  │     │ • DeFi protocols│
│ • Bootcamps │     │ Credential PDAs  │     │ • Job platforms │
│ • Universities│   │ Issuer Registry  │     │ • DAOs          │
│ • Employers │     │ Staq Score       │     │ • Any Solana app│
└─────────────┘     └──────────────────┘     └─────────────────┘
```

**Issuers** write credentials. **Verifiers** read them. **Users** own them permanently.

## Quick Start — Verify a credential (3 lines)

```js
import { Connection } from '@solana/web3.js';
import { verifyStaqCredential } from '@staq/credentials';

const cred = await verifyStaqCredential(connection, userWallet, 'credit-score');
if (cred) {
  console.log(`Verified: ${cred.tier} tier, score ${cred.score}`);
}
```

## Quick Start — Get a user's reputation score

```js
import { getStaqScore } from '@staq/credentials';

const score = await getStaqScore(connection, userWallet);
// 0-1000 reputation derived from all credentials
// Use it for: lower collateral, priority access, hiring signals
```

## Why this matters

**The problem:** Certificates are PDFs. They can be faked in 2 minutes. They live on someone else's server. They can't be verified without calling the issuer. They can't be used by other apps.

**The fix:** Credentials on Solana. Non-transferable (Token-2022). Permanent. Verifiable by any program. No API key needed — just read the blockchain.

**The vision:** A portable skill identity that follows the user everywhere. Staq issues financial literacy credentials. A bootcamp issues coding credentials. An employer issues work history. The user's wallet becomes their verified resume.

## Architecture

| Component | Description |
|-----------|-------------|
| **Anchor Program** | Issuer registry + credential PDAs + staking escrow |
| **Token-2022 SBTs** | NonTransferable + MetadataPointer + Metadata for each credential |
| **TypeScript SDK** | `@staq/credentials` — verify and score in 3 lines |
| **Staq Score** | 0-1000 reputation number derived from all credentials |
| **Staq App** | Live consumer app — first issuer on the protocol |

## Project Structure

```
staq-protocol/
├── programs/staq-credential/   # Anchor program (Rust)
├── packages/sdk/               # @staq/credentials TypeScript SDK
├── demo/                       # Demo: DeFi app reading credentials
├── docs/                       # Protocol spec + developer guide
└── README.md
```

## Live Demo

- **App:** [staq.slayerblade.site](https://staq.slayerblade.site)
- **Credentials on Solana Explorer:** [Example SBT](https://explorer.solana.com/address/CMcXGv5jqSujkju1v3XgCHHA4kb8RwyGXaBhnoP18Gqh?cluster=devnet)
- **Flux Token:** [GEjTzMRTUHnfPB8z8VKka79XQqEmFB7FeSRcjonQ8huG](https://explorer.solana.com/address/GEjTzMRTUHnfPB8z8VKka79XQqEmFB7FeSRcjonQ8huG?cluster=devnet)

## Team

| Person | Role |
|--------|------|
| **Arnav** | Protocol design, SDK, consumer app, pitch |
| **Federico Alvarez** | Anchor program, on-chain architecture |

## Hackathon

**Solana Frontier** (Colosseum) — April 6 – May 11, 2026

## License

MIT
