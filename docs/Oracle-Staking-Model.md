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
| **False Positive** | 5% of stake | Killed a compliant agent |
| **Missed Kill** | 2% of stake | Failed to respond to valid kill request |
| **Collusion** | 100% of stake | Coordinated false kills + permanent ban |
| **Downtime** | 0.1% per 5min | Offline during SLA window |
| **Malicious Kill** | 100% of stake | Intentionally killed agent for profit |

### Slashing Distribution (Burn Mechanism)

Slashed funds are NOT fully redistributed. A portion is burned for deflationary pressure.

```
Slash Distribution:
├── 60% → Victim Compensation (paid to affected agent owner)
├── 25% → Insurance Pool (reserves)
└── 15% → BURNED (removed from circulation)
```

**Example:** Oracle slashed 100,000 $KILLSWITCH for false positive:
- 60,000 → Agent owner (compensation)
- 25,000 → Insurance Pool
- 15,000 → Burned forever

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
   - Distribution: 60% victim / 25% pool / 15% burned
```

---

## Oracle Operations

### Technical Requirements (Sentinel Standard)

Oracles must meet the "Sentinel" standard. This is not running on a Raspberry Pi.

```yaml
# Sentinel Oracle Node Specs
infrastructure:
  runtime: Kubernetes v1.28+
  cni: Cilium (required for eBPF enforcement)
  kernel: Linux 5.15+ (required for advanced eBPF hooks)
  
hardware:
  cpu: 16 cores (dedicated)
  ram: 64GB ECC
  storage: 1TB NVMe SSD
  network: 10Gbps dedicated

software:
  os: Ubuntu 22.04 LTS
  sentinel_engine: v1.0.0+ (from official repo)
  spire_agent: v1.8.0+
  cilium: v1.14+

network:
  latency_to_spire_server: <50ms RTT
  latency_to_gateway: <50ms
  uptime_sla: 99.9%
  geographic_redundancy: required for Gold+

ebpf_capabilities:
  - kprobe/kretprobe hooks
  - tracepoint monitoring
  - XDP packet filtering
  - cgroup/socket filtering
```

**Why These Requirements:**
- **Kubernetes + Cilium:** Network policy enforcement at kernel speed
- **Linux 5.15+:** Required for BPF CO-RE and advanced tracing
- **<50ms to SPIRE:** SVID revocation must propagate instantly

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

## Guardian Multisig (Emergency Brake)

In the event of a catastrophic protocol bug (e.g., Oracles killing everything), the network has an emergency stop.

### Trigger Conditions

| Trigger | Mechanism | Speed |
|---------|-----------|-------|
| **Guardian Multisig** | 5-of-7 signatures | Instant |
| **Supermajority Vote** | 66% token holders | 24 hours |
| **Cascade Detection** | >10 kills/minute network-wide | Automatic |

### Guardian Council

7 elected Guardians hold multisig keys. Any 5 can trigger Global Pause.

**Guardian Requirements:**
- Minimum 1,000,000 $KILLSWITCH staked
- 6-month minimum tenure as Oracle
- Reputation score >90
- Geographic diversity (no 2 Guardians same region)

**Guardian Election:**
- Annual vote by token holders
- 51% approval required
- Maximum 2 consecutive terms

### Global Pause Actions

```
When Global Pause triggered:
1. All slashing logic suspended
2. All Cilium policies reverted to "Monitor Mode" (log only, no kill)
3. All pending kills frozen
4. 72-hour investigation window
5. Guardian vote to resume or extend pause
```

---

## Security Considerations

### Attack Vectors & Mitigations

| Attack | Risk | Mitigation |
|--------|------|------------|
| Oracle Collusion | HIGH | Geographic distribution, stake slashing, burn |
| Stake Manipulation | MEDIUM | Lock periods, gradual unstaking |
| DDoS on Oracles | MEDIUM | Redundancy, CDN protection |
| False Positive Farming | LOW | Reputation system, slashing |
| Protocol Bug | CRITICAL | Guardian Multisig emergency brake |

### Network Health Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Active Oracles | >20 | 10-20 | <10 |
| Geographic Spread | >5 regions | 3-5 | <3 |
| Avg Response Time | <200ms | 200-500ms | >500ms |
| Consensus Success | >99% | 95-99% | <95% |
| Burn Rate (30d) | <0.1% supply | 0.1-0.5% | >0.5% |

---

## Related Documentation

- [Security Manifest Template](Security-Manifest-Template.md)
- [False Positive Recourse](False-Positive-Recourse.md)
- [Token Utility](Token-Utility.md)
