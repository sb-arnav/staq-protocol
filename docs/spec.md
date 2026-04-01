# Staq Credential Protocol — Spec v2

## Change from v1: Multi-Issuer Support

The credential registry is no longer Staq-only. Any approved issuer can write credentials.

### New Instructions (for Federico)

**1. `register_issuer(issuer: Pubkey, name: String)`**
- Called by protocol admin (Staq Authority) only
- Creates a PDA: `["issuer", issuer.key()]`
- Stores: issuer pubkey, name, registered_at, active: bool
- Only registered issuers can call `register_credential`

**2. `register_credential` (MODIFIED)**
- Now checks: is the caller a registered issuer?
- PDA seed changes: `["credential", issuer.key(), user.key(), credential_slug.as_bytes()]`
- Adding issuer to the seed means different issuers can issue credentials with the same slug without collision
- Stores: issuer, user, slug, tier, score, mint_address, timestamp

**3. `verify_credential(issuer: Pubkey, user: Pubkey, credential_slug: String)` (VIEW)**
- Anyone derives the PDA and reads the account
- Returns: exists/not, tier, score, issuer, timestamp

**4. `deactivate_issuer(issuer: Pubkey)`**
- Called by protocol admin only
- Sets active: false on the issuer PDA
- Existing credentials remain valid but issuer can't write new ones

### Staq Score (Future — not needed for hackathon MVP)

An on-chain derived number from all credentials a user holds. Computed client-side by reading all credential PDAs for a wallet. Not an instruction — just a read pattern.

### Everything else from v1 stays the same

Staking escrow, Token-2022 Flux, NonTransferable SBTs — all unchanged.
