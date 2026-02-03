# Token Utility

The $KILLSWITCH token provides real utility within the ecosystem.

## Token Details

| Property | Value |
|----------|-------|
| **Name** | $KILLSWITCH |
| **Network** | Solana |
| **Contract** | `56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon` |
| **Total Supply** | 1,000,000,000 |

[Buy on Jupiter](https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon)

## Token Holder Benefits

### Subscription Discounts

Hold tokens to get discounts on all subscription tiers:

| Holdings | Discount |
|----------|----------|
| 1,000+ | No discount (governance only) |
| 10,000+ | 10% off |
| 100,000+ | 20% off |
| 1,000,000+ | 40% off |

### Governance Voting

Token holders can vote on proposals that shape the future of $KILLSWITCH:

- **1,000+ tokens** - Vote on proposals
- **1,000,000+ tokens** - 2x voting power

### What You Can Vote On

- Feature prioritization
- Fee structure changes
- Treasury allocation
- Partnership decisions
- Protocol upgrades

## How Discounts Work

1. Connect your Solana wallet
2. System checks your $KILLSWITCH balance
3. Discount automatically applied to subscription

```python
# Example: Token balance check
from token_utility import TokenUtilityService

token_service = TokenUtilityService()
info = await token_service.getTokenHolderInfo("your_wallet_address")

print(f"Balance: {info.balance}")
print(f"Tier: {info.tier}")
print(f"Discount: {info.discountPercent}%")
print(f"Voting Power: {info.votingPower}")
```

## Governance Participation

### Creating Proposals

Anyone with 1,000+ tokens can create proposals:

```python
from governance_service import governanceService

proposal = await governanceService.createProposal(
    proposerId=user_id,
    walletAddress="your_wallet",
    title="Add mobile app support",
    description="Proposal to prioritize iOS/Android development..."
)
```

### Voting

```python
vote = await governanceService.castVote(
    userId=user_id,
    walletAddress="your_wallet",
    proposalId=proposal.id,
    support=True  # or False to vote against
)
```

## Token Tiers

| Tier | Min Balance | Discount | Voting |
|------|-------------|----------|--------|
| None | 0 | 0% | No |
| Holder | 1,000 | 0% | 1x |
| Supporter | 10,000 | 10% | 1x |
| Advocate | 100,000 | 20% | 1x |
| Whale | 1,000,000 | 40% | 2x |

## Payment Options

You can pay for subscriptions with:

- **USD** - Credit card via Stripe
- **SOL** - Solana native token
- **USDC** - Stablecoin on Solana

Token discounts apply to all payment methods.
