# Oracle Staking Model

**Protocol:** $KILLSWITCH  
**Version:** 1.0

---

## Overview

Staked Security Oracles are the enforcement layer of $KILLSWITCH. They execute kill commands at machine speed while token holders provide economic security and oversight.

**Key Principle:** The people holding the kill switch must have skin in the game.

---

## How Oracles Work

### The Kill Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Detection     │────▶│  Oracle Network │────▶│   Execution     │
│  (Monitoring)   │     │   (Validation)  │     │  (Revocation)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      <100ms                  <200ms                  <200ms
                                                 
                         Total: <500ms
```

1. **Detection:** Automated monitoring detects manifest violation
2. **Trigger:** Cryptographically signed Kill Request sent to Oracle network
3. **Validation:** Staked Oracles run verification logic (sub-second)
4. **Consensus:** Threshold met (e.g., 3-of-5 Oracles agree)
5. **Execution:** Agent's SPIFFE ID revoked, gateway blocks all traffic

---

## Oracle Economics

### Staking Requirements

| Oracle Tier | Minimum Stake | Max Agents | Response SLA |
|-------------|---------------|------------|--------------|
| **Bronze** | 100,000 $KILLSWITCH | 100 | <1000ms |
| **Silver** | 500,000 $KILLSWITCH | 500 | <500ms |
| **Gold** | 1,000,000 $KILLSWITCH | 2,000 | <200ms |
| **Platinum** | 5,000,000 $KILLSWITCH | Unlimited | <100ms |

### Revenue Model

Oracles earn fees for successful validations:

```
Per-Kill Fee = Base Fee + (Agent Value × Risk Multiplier)

Example:
- Base Fee: 10 $KILLSWITCH
- Agent daily volume: $100,000
- Risk Multiplier: 0.01%
- Total Fee: 10 + 10 = 20 $KILLSWITCH per kill
```

**Monthly Revenue Potential:**
- Bronze Oracle (100 agents, 5 kills/day avg): ~3,000 $KILLSWITCH/month
- Gold Oracle (2,000 agents, 5 kills/day avg): ~60,000 $KILLSWITCH/month

---

## Slashing Conditions

Oracles lose stake when they fail the network.

### Slashing Schedule

| Violation | Penalty | Description |
|-----------|---------|-------------|
| **False Positive** | 1% of stake | Killed a compliant agent |
| **Missed Kill** | 2% of stake | Failed to respond to valid kill request |
| **Collusion** | 50% of stake | Coordinated false kills |
| **Downtime** | 0.1%/hour | Offline during SLA window |
| **Malicious Kill** | 100% of stake | Intentionally killed agent for profit |

### Slashing Process

```
1. Violation Detected
   ↓
2. Challenge Period (24 hours)
   - Oracle can submit evidence
   - Other Oracles vote on validity
   ↓
3. Token Holder Vote (if disputed)
   - 51% threshold
   - 48-hour voting window
   ↓
4. Execution
   - Stake slashed
   - Funds go to Insurance Pool
```

---

## Oracle Operations

### Technical Requirements

```yaml
# Minimum Oracle Node Specs
hardware:
  cpu: 8 cores
  ram: 32GB
  storage: 500GB SSD
  network: 1Gbps dedicated

software:
  os: Ubuntu 22.04 LTS
  runtime: Docker 24.0+
  killswitch_node: v1.0.0+

network:
  latency_to_gateway: <50ms
  uptime_sla: 99.9%
  geographic_redundancy: recommended
```

### Running an Oracle

```bash
# Install Oracle node
curl -sSL https://get.killswitch.ai/oracle | bash

# Configure with stake
killswitch-oracle init \
  --wallet 0x... \
  --stake 100000 \
  --tier bronze

# Start Oracle
killswitch-oracle start --daemon

# Monitor performance
killswitch-oracle status
```

### Oracle Dashboard Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Response Time | <200ms | >500ms |
| Uptime | 99.9% | <99.5% |
| Consensus Rate | >95% | <90% |
| False Positive Rate | <0.1% | >0.5% |

---

## Governance Integration

### What Token Holders Control

| Decision | Voting Threshold | Timeframe |
|----------|------------------|-----------|
| Oracle Elections | 51% | 7 days |
| Slashing Rate Changes | 67% | 14 days |
| Tier Requirements | 51% | 7 days |
| Fee Structure | 51% | 7 days |
| Emergency Oracle Removal | 75% | 24 hours |

### What Oracles Control

| Decision | Mechanism | Speed |
|----------|-----------|-------|
| Individual Kills | Consensus (3/5) | <500ms |
| Manifest Violations | Automated | <100ms |
| Emergency Pause | Any single Oracle | Instant |

**Critical Distinction:**
- **Token holders** set the rules (governance)
- **Oracles** enforce the rules (execution)
- No voting required for real-time kills

---

## Oracle Reputation System

### Reputation Score (0-100)

```
Score = (Accuracy × 40) + (Uptime × 30) + (Speed × 20) + (Stake × 10)

Where:
- Accuracy = (Correct Kills / Total Kills) × 100
- Uptime = Hours Online / Total Hours × 100
- Speed = (SLA Target / Actual Response) × 100 (capped at 100)
- Stake = (Your Stake / Max Tier Stake) × 100
```

### Reputation Tiers

| Score | Status | Benefits |
|-------|--------|----------|
| 90-100 | **Elite** | 2x fees, priority routing |
| 70-89 | **Trusted** | Standard fees |
| 50-69 | **Probation** | 50% fees, monitoring |
| <50 | **Suspended** | No new agents, review required |

---

## Insurance Pool

A portion of all fees funds the Insurance Pool for false positive compensation.

### Pool Mechanics

```
Fee Distribution:
├── 70% → Oracle (revenue)
├── 20% → Insurance Pool (reserves)
└── 10% → Protocol Treasury (development)
```

### Pool Size Target

| Network TVL | Target Pool | Current APY |
|-------------|-------------|-------------|
| <$10M | $500K | 5% |
| $10M-$100M | $5M | 8% |
| >$100M | $50M | 12% |

---

## Becoming an Oracle

### Step-by-Step Process

1. **Acquire Stake**
   - Minimum 100,000 $KILLSWITCH
   - Must be held in approved staking contract

2. **Technical Setup**
   - Deploy Oracle node
   - Pass connectivity tests
   - Achieve <100ms latency to 3+ gateways

3. **Registration**
   - Submit Oracle application
   - Token holder vote (7 days)
   - 51% approval required

4. **Activation**
   - Stake locked for minimum 30 days
   - Start receiving kill requests
   - Begin earning fees

### Exit Process

```
1. Submit Exit Request
   ↓
2. Cooldown Period (7 days)
   - Continue processing kills
   - No new agent assignments
   ↓
3. Final Settlement
   - Pending rewards distributed
   - Stake unlocked (minus any pending slashes)
   ↓
4. Oracle Deactivated
```

---

## Security Considerations

### Attack Vectors & Mitigations

| Attack | Risk | Mitigation |
|--------|------|------------|
| Oracle Collusion | HIGH | Geographic distribution, stake slashing |
| Stake Manipulation | MEDIUM | Lock periods, gradual unstaking |
| DDoS on Oracles | MEDIUM | Redundancy, CDN protection |
| False Positive Farming | LOW | Reputation system, slashing |

### Network Health Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Active Oracles | >20 | 10-20 | <10 |
| Geographic Spread | >5 regions | 3-5 | <3 |
| Avg Response Time | <200ms | 200-500ms | >500ms |
| Consensus Success | >99% | 95-99% | <95% |

---

## Related Documentation

- [Security Manifest Template](Security-Manifest-Template.md)
- [False Positive Recourse](False-Positive-Recourse.md)
- [Token Utility](Token-Utility.md)
