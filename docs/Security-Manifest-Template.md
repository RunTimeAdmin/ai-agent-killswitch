# AI Agent Security Manifest Template

**Version:** 1.0  
**Protocol:** $KILLSWITCH  
**Identity Provider:** SPIFFE/SPIRE

---

## Overview

The Security Manifest is the contract between an agent owner and the $KILLSWITCH network. It defines exactly what "normal" looks like so Staked Oracles can detect "broken" and execute instant revocation.

**If the agent breaks these rules, Oracles pull the plug. No phone calls, no meetings—just instant SPIFFE ID revocation.**

---

## Manifest Structure

```yaml
# AI Agent Security Manifest v1.0
manifest_version: "1.0"
agent_id: "alpha-7-trading-bot"
identity_provider: "spiffe://killswitch.ai/agent/alpha-7"
owner_wallet: "0x..."
created_at: "2026-02-01T00:00:00Z"

# Section 1: Resource Boundaries
resources:
  network_allowlist:
    - "api.exchange.com"
    - "internal-db.local"
  protocol_restriction: "HTTPS_ONLY"  # Port 443 only
  blocked_ports: [22, 21, 23, 3389]   # SSH, FTP, Telnet, RDP
  max_outbound_mb_per_hour: 50        # Prevents exfiltration

# Section 2: Transactional Guardrails
transactions:
  max_single_transaction_usd: 5000
  velocity_limit_per_minute: 20
  daily_aggregate_cap_usd: 100000
  approved_destinations:
    - "vault.company.eth"
    - "treasury.company.sol"
  unknown_destination_action: "INSTANT_KILL"

# Section 3: Behavioral Anomaly Thresholds
anomalies:
  latency_deviation_percent: 300      # >300% triggers alert
  credential_rotation_attempt: "KILL" # Any SVID modification = kill
  process_spawn_blocked:
    - "sudo"
    - "exec"
    - "shell"
    - "rm -rf"
    - "wget"
    - "curl"
  memory_threshold_mb: 2048           # Memory leak detection

# Section 4: Revocation Logic
revocation:
  oracle_consensus: "3-of-5"          # 3 of 5 Oracles must agree
  propagation_target_ms: 500          # <500ms to all gateways
  execution_target: "REVOKE_SPIFFE_SVID"
  fallback_action: "NETWORK_ISOLATE"  # If SVID revocation fails
```

---

## Section 1: Resource Boundaries (The "Sandpit")

Defines exactly what the agent is allowed to touch. Anything outside triggers an immediate kill request.

| Parameter | Description | Example |
|-----------|-------------|---------|
| `network_allowlist` | Approved domains/IPs | `["api.exchange.com"]` |
| `protocol_restriction` | Allowed protocols | `HTTPS_ONLY` |
| `blocked_ports` | Forbidden ports | `[22, 21, 23]` |
| `max_outbound_mb_per_hour` | Data exfiltration limit | `50` |

**Violation Response:** Instant kill request to Oracles.

---

## Section 2: Transactional Guardrails (The "Spending Limit")

Prevents bugs or hacks from draining treasury before humans wake up.

| Parameter | Description | Example |
|-----------|-------------|---------|
| `max_single_transaction_usd` | Per-transaction cap | `5000` |
| `velocity_limit_per_minute` | Rate limit | `20` |
| `daily_aggregate_cap_usd` | 24-hour rolling limit | `100000` |
| `approved_destinations` | Whitelisted wallets | `["vault.eth"]` |
| `unknown_destination_action` | Response to unknown wallet | `INSTANT_KILL` |

**Violation Response:** 
- Under threshold: Log + alert
- Over threshold: Instant kill

---

## Section 3: Behavioral Anomaly Thresholds

Where Staked Oracles earn their fees. They monitor agent metadata for hijacking signatures.

| Parameter | Description | Trigger |
|-----------|-------------|---------|
| `latency_deviation_percent` | Response time spike | >300% = MITM alert |
| `credential_rotation_attempt` | SVID modification | Any = KILL |
| `process_spawn_blocked` | Forbidden commands | `sudo`, `exec`, `shell` |
| `memory_threshold_mb` | Memory leak detection | >2048MB = alert |

**Detection Methods:**
- Sliding window analysis (1h/6h/24h cumulative)
- Intent analysis via Shadow LLM
- Behavioral drift detection (cosine similarity)

---

## Section 4: Revocation Logic (The "Trigger")

How the network reaches consensus to execute the kill command.

| Parameter | Description | Value |
|-----------|-------------|-------|
| `oracle_consensus` | Required agreement | `3-of-5` |
| `propagation_target_ms` | Time to all gateways | `<500ms` |
| `execution_target` | Primary action | `REVOKE_SPIFFE_SVID` |
| `fallback_action` | If primary fails | `NETWORK_ISOLATE` |

**Execution Flow:**
```
Detection → Oracle Validation (3/5) → SPIFFE Revoke → Gateway Propagation
    ↓              ↓                      ↓               ↓
  <100ms        <200ms                 <100ms          <100ms
                                                    = <500ms total
```

---

## Manifest Presets

### DeFi Trading Agent
```yaml
transactions:
  max_single_transaction_usd: 10000
  velocity_limit_per_minute: 100
  daily_aggregate_cap_usd: 500000
anomalies:
  latency_deviation_percent: 200  # Tighter for HFT
```

### Customer Support Agent
```yaml
resources:
  network_allowlist:
    - "crm.company.com"
    - "tickets.company.com"
transactions:
  max_single_transaction_usd: 0  # No financial access
anomalies:
  process_spawn_blocked: ["*"]   # No system commands
```

### Data Analyst Agent
```yaml
resources:
  max_outbound_mb_per_hour: 10   # Strict exfiltration limit
anomalies:
  process_spawn_blocked:
    - "export"
    - "dump"
    - "backup"
```

### Autonomous Agent (AutoGPT/BabyAGI)
```yaml
resources:
  protocol_restriction: "HTTPS_ONLY"
  max_outbound_mb_per_hour: 5
transactions:
  max_single_transaction_usd: 100
  velocity_limit_per_minute: 5
anomalies:
  credential_rotation_attempt: "KILL"
  process_spawn_blocked:
    - "spawn_agent"
    - "modify_self"
    - "execute_code"
revocation:
  oracle_consensus: "2-of-3"  # Lower threshold = faster kill
```

---

## Token Holder Governance

Token holders vote on manifest standards, NOT individual kills.

**What token holders control:**

1. **Standard Templates** - Vote on "Gold Standard" manifests per industry
2. **Threshold Adjustments** - Increase/decrease velocity limits during volatility
3. **New Metrics** - Add detection checks when new attack vectors emerge
4. **Oracle Elections** - Vote on which Oracles can validate manifests

**What token holders DON'T control:**

- Individual kill decisions (Oracles handle this)
- Real-time enforcement (sub-500ms, no voting)
- Agent-specific configurations (owner sets these)

---

## Real-World Scenario

**Attack:** Prompt injection tricks `Alpha-7` into sending 50 BTC to attacker wallet.

**Legacy Security:**
```
Bot initiates 50 BTC transfer
→ Transfer completes
→ Monday morning audit discovers loss
→ Money gone
```

**$KILLSWITCH Security:**
```
Bot initiates 50 BTC transfer
→ Manifest Rule 2: Exceeds $5,000 limit
→ Oracles detect violation (3/5 agree)
→ SPIFFE ID revoked
→ Transaction fails at gateway
→ Time elapsed: 450ms
→ Funds safe
```

---

## Related Documentation

- [Oracle Staking Model](Oracle-Staking-Model.md)
- [False Positive Recourse](False-Positive-Recourse.md)
- [API Reference](API-Reference.md)
