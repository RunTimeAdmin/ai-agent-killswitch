# False Kill Post-Mortem Report Template

**Protocol:** $KILLSWITCH  
**Document Type:** Compensation Claim  
**Version:** 1.0

---

## Instructions

Complete this template when filing a compensation claim for a false positive kill. Submit via:
- **CLI:** `killswitch dispute file --template postmortem.yaml`
- **API:** `POST /api/disputes` with `claim_type: "false_positive"`
- **Dashboard:** Disputes → New Claim → Upload Report

---

## SECTION 1: Incident Summary

```yaml
incident:
  report_id: "RPT-2026-02-01-001"  # Auto-generated
  agent_id: "alpha-7-trading-bot"
  spiffe_id: "spiffe://killswitch.ai/agent/alpha-7"
  owner_wallet: "0x..."
  
  kill_event:
    kill_id: "kill_abc123"
    timestamp: "2026-02-01T22:30:45Z"
    oracle_consensus: "3-of-5"
    participating_oracles:
      - oracle_id: "oracle-1"
        vote: "kill"
      - oracle_id: "oracle-2"
        vote: "no_kill"
      - oracle_id: "oracle-3"
        vote: "kill"
      - oracle_id: "oracle-4"
        vote: "no_kill"
      - oracle_id: "oracle-5"
        vote: "kill"
    
  triggered_rule:
    manifest_section: "transactions"
    rule_name: "max_single_transaction_usd"
    threshold: 5000
    reported_value: 5001  # What Oracle reported
    actual_value: 4999    # What actually happened
```

---

## SECTION 2: Impact Assessment

```yaml
impact:
  downtime:
    agent_offline_start: "2026-02-01T22:30:45Z"
    agent_offline_end: "2026-02-01T23:15:00Z"
    total_downtime_minutes: 44
    
  financial_loss:
    missed_opportunities:
      - description: "Missed arbitrage trade ETH/USDC"
        estimated_profit_usd: 2500
        evidence: "ipfs://Qm..."  # Link to trade signal logs
      - description: "Failed customer order processing"
        estimated_profit_usd: 800
        evidence: "ipfs://Qm..."
    
    direct_costs:
      - description: "Emergency engineer callout"
        cost_usd: 500
        invoice: "ipfs://Qm..."
      - description: "Manual transaction processing"
        cost_usd: 200
        
    total_claimed_usd: 4000
    
  operational_impact:
    customers_affected: 12
    sla_violations: 1
    reputation_damage: "moderate"  # none, minor, moderate, severe
```

---

## SECTION 3: Root Cause Analysis

```yaml
root_cause:
  category: "oracle_data_error"  # See categories below
  
  technical_details:
    what_happened: |
      Oracle-1, Oracle-3, and Oracle-5 received stale price data from 
      CoinGecko API showing transaction value as $5,001 USD. Actual 
      on-chain value at tx timestamp was $4,999 USD (ETH price: $3,245.67).
      
    why_it_happened: |
      15-second delay in price feed propagation caused Oracles to 
      calculate USD value using outdated ETH/USD rate ($3,247.00 vs 
      actual $3,245.67).
      
    evidence:
      - type: "blockchain_tx"
        hash: "0x..."
        description: "Original transaction showing 1.539 ETH"
      - type: "price_feed_log"
        source: "CoinGecko API"
        timestamp: "2026-02-01T22:30:30Z"
        value: "ETH/USD: 3247.00"
      - type: "on_chain_price"
        source: "Chainlink Oracle"
        timestamp: "2026-02-01T22:30:45Z"
        value: "ETH/USD: 3245.67"
        
  contributing_factors:
    - "Price feed latency exceeded 10-second threshold"
    - "Manifest did not include buffer for price volatility"
    - "Oracle consensus achieved before price reconciliation"
```

### Root Cause Categories

| Category | Description |
|----------|-------------|
| `oracle_data_error` | Oracle received/processed incorrect data |
| `manifest_misconfiguration` | Manifest rules too strict for use case |
| `network_latency` | Kill executed before data synchronized |
| `oracle_malfunction` | Oracle node bug or failure |
| `oracle_collusion` | Coordinated malicious behavior |
| `svid_rotation_failure` | SPIFFE credential issue |
| `external_dependency` | Third-party API/feed failure |

---

## SECTION 4: Evidence Package

```yaml
evidence:
  audit_logs:
    source: "killswitch_audit_api"
    export_hash: "sha256:abc123..."
    ipfs_cid: "Qm..."
    time_range:
      from: "2026-02-01T22:00:00Z"
      to: "2026-02-01T23:30:00Z"
      
  blockchain_records:
    - chain: "ethereum"
      tx_hash: "0x..."
      block: 19234567
      description: "Original transaction"
    - chain: "solana"
      tx_hash: "..."
      description: "Kill signal broadcast"
      
  oracle_logs:
    - oracle_id: "oracle-1"
      log_hash: "sha256:..."
      ipfs_cid: "Qm..."
    - oracle_id: "oracle-3"
      log_hash: "sha256:..."
      ipfs_cid: "Qm..."
      
  third_party_data:
    - source: "CoinGecko"
      endpoint: "/api/v3/simple/price"
      response_hash: "sha256:..."
    - source: "Chainlink"
      contract: "0x..."
      round_id: 123456
      
  screenshots:
    - description: "Dashboard showing agent status at kill time"
      ipfs_cid: "Qm..."
    - description: "Transaction receipt"
      ipfs_cid: "Qm..."
```

---

## SECTION 5: Compensation Request

```yaml
compensation:
  claim_breakdown:
    direct_financial_loss: 3300
    downtime_penalty: 400       # 44 min × $9.09/min (based on tier)
    emergency_costs: 700
    subtotal: 4400
    
    # Adjustments
    owner_contribution: 0       # If owner manifest was misconfigured
    insurance_deductible: 400   # Per-incident deductible
    
    total_requested: 4000
    
  payment_details:
    preferred_currency: "USDC"
    wallet_address: "0x..."
    chain: "ethereum"
    
  source_preference:
    primary: "oracle_stake"     # Slash responsible Oracles
    secondary: "insurance_pool" # If Oracle stake insufficient
```

---

## SECTION 6: Remediation Requests

```yaml
remediation:
  oracle_actions:
    - oracle_id: "oracle-1"
      requested_action: "slash"
      slash_percentage: 1
      reason: "Used stale price data without verification"
    - oracle_id: "oracle-3"
      requested_action: "warning"
      reason: "Should have abstained given data uncertainty"
      
  protocol_improvements:
    - category: "price_feed"
      suggestion: "Require multi-source price verification for transactions >$1000"
    - category: "manifest"
      suggestion: "Add recommended 5% buffer to financial thresholds"
      
  owner_commitments:
    - "Will update manifest to include 10% price volatility buffer"
    - "Will implement pre-flight transaction simulation"
```

---

## SECTION 7: Attestation

```yaml
attestation:
  owner_statement: |
    I, the undersigned agent owner, attest that the information provided 
    in this post-mortem report is true and accurate to the best of my 
    knowledge. I understand that false claims may result in penalties 
    including loss of staked tokens and protocol access.
    
  signature:
    wallet: "0x..."
    message_hash: "sha256:..."
    signature: "0x..."
    timestamp: "2026-02-01T23:45:00Z"
    
  witnesses:  # Optional, for high-value claims
    - wallet: "0x..."
      role: "Technical auditor"
      signature: "0x..."
```

---

## Submission Checklist

Before submitting, verify:

- [ ] All timestamps are in UTC ISO 8601 format
- [ ] Evidence files uploaded to IPFS with valid CIDs
- [ ] Blockchain transaction hashes verified on-chain
- [ ] Financial claims have supporting documentation
- [ ] Owner signature is valid and wallet matches agent owner
- [ ] Report submitted within 72 hours of incident

---

## Processing Timeline

| Stage | SLA | Description |
|-------|-----|-------------|
| Acknowledgment | 1 hour | Automated receipt confirmation |
| Initial Review | 24 hours | Arbitration committee reviews claim |
| Oracle Response | 24 hours | Accused Oracles submit defense |
| Decision | 48 hours | Ruling issued |
| Payment | 24 hours | Compensation distributed |
| **Total** | **5 days** | End-to-end resolution |

---

## CLI Submission

```bash
# Generate template
killswitch dispute template > postmortem.yaml

# Fill in details, then submit
killswitch dispute file \
  --report postmortem.yaml \
  --evidence-dir ./evidence/ \
  --sign

# Check status
killswitch dispute status RPT-2026-02-01-001
```

---

## Related Documentation

- [False Positive Recourse](False-Positive-Recourse.md)
- [Oracle Staking Model](Oracle-Staking-Model.md)
- [Security Manifest Template](Security-Manifest-Template.md)
