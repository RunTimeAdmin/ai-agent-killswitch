# $KILLSWITCH Wiki

Welcome to the $KILLSWITCH documentation - the emergency kill switch for AI agents.

## 🆕 Latest: Security Hardening 100% Complete

**10 security modules | 7,693 lines of protection code**

See [Security Hardening](Security-Hardening) for full details.

## Quick Links

### Getting Started
- [Installation Guide](Installation)
- [Quick Start](Quick-Start)
- [API Reference](API-Reference)
- [Configuration](Configuration)

### Core Documentation
- [Architecture](Architecture)
- [SPIFFE Integration](SPIFFE-Integration)
- [Security Hardening](Security-Hardening) **✅ COMPLETE**
- [Agent Presets](Agent-Presets)

### Business
- [Token Utility](Token-Utility)
- [Subscriptions](Subscriptions)
- [Enterprise Edition](Enterprise-Edition)

## What is $KILLSWITCH?

$KILLSWITCH is a safety ecosystem for AI agents, powered by Runtime Fence technology and SPIFFE identity. Every action an agent tries to take must pass through the fence first. If the action is risky or blocked, the fence stops it.

**Key Differentiators:**
- Unique SPIFFE ID per agent (not shared API keys)
- <30 second kill switch (vs 24 hours for competitors)
- Immutable audit logs with hash chain
- Circuit breaker auto-kill on anomalies
- Token-weighted governance

Think of it like an emergency stop button for your AI - one click and everything halts.

## $KILLSWITCH Token

**Contract:** `56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon`

[Buy on Jupiter](https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon)

### Token Benefits
| Holdings | Discount | Governance |
|----------|----------|------------|
| 1,000+ | - | Vote on proposals |
| 10,000+ | 10% off | Vote on proposals |
| 100,000+ | 20% off | Vote on proposals |
| 1,000,000+ | 40% off | 2x voting power |

## Core Concepts

### SPIFFE Identity
Each agent gets a unique cryptographic identity: `spiffe://killswitch.ai/agent/{uuid}`. This enables instant revocation and perfect forensics. See [SPIFFE Integration](SPIFFE-Integration).

### Kill Switch
The emergency stop button. When activated, the agent's SPIFFE ID is revoked and ALL actions are blocked within 30 seconds.

### Runtime Fence
The underlying technology that wraps around your AI agent. It intercepts every action and validates it before allowing it through.

### Risk Scoring
Every action is assigned a risk score (0-100). Higher scores mean more risk.

### Circuit Breaker
Automatically kills agents that:
- Have 10+ consecutive failures
- Exceed 80% error rate
- Trigger anomaly detection (score >90)

## Getting Started

```bash
pip install runtime-fence
```

See [Installation](Installation) for detailed instructions.
