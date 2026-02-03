# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           $KILLSWITCH PROTOCOL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 3: TOKEN ECONOMICS                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │ Governance  │  │ Staking     │  │ Discounts   │  │ Revenue    │ │   │
│  │  │ Voting      │  │ Rewards     │  │ 10-40%      │  │ Share      │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 2: SPIFFE IDENTITY                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │ Unique ID   │  │ Auto-Rotate │  │ Instant     │  │ Immutable  │ │   │
│  │  │ Per Agent   │  │ Credentials │  │ Revocation  │  │ Audit Logs │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 1: RUNTIME FENCE                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │ Action      │  │ Risk        │  │ Circuit     │  │ Kill       │ │   │
│  │  │ Monitoring  │  │ Scoring     │  │ Breaker     │  │ Switch     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   AI Agent   │────▶│  Runtime     │────▶│   Target     │
│              │     │  Fence       │     │   Service    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    ▼                    │
       │           ┌──────────────┐              │
       │           │  Risk Score  │              │
       │           │  (0-100)     │              │
       │           └──────────────┘              │
       │                    │                    │
       │         ┌──────────┴──────────┐        │
       │         ▼                     ▼        │
       │  ┌────────────┐       ┌────────────┐   │
       │  │  ALLOW     │       │  BLOCK     │   │
       │  │  (score<70)│       │  (score≥70)│   │
       │  └────────────┘       └────────────┘   │
       │                              │         │
       │                              ▼         │
       │                    ┌──────────────┐    │
       │                    │  Kill Switch │    │
       │                    │  (if needed) │    │
       │                    └──────────────┘    │
       │                              │         │
       ▼                              ▼         ▼
┌─────────────────────────────────────────────────────┐
│                    AUDIT LOG                         │
│  [SPIFFE ID] [Action] [Risk Score] [Result] [Time]  │
└─────────────────────────────────────────────────────┘
```

## Kill Switch Flow

```
┌─────────────┐
│  Dashboard  │
│  KILL btn   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ POST /api/kill  │
│ { spiffeId,     │
│   reason }      │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Supabase            │
│ agent_identities    │
│ status = 'revoked'  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Supabase            │
│ kill_signals        │
│ (real-time)         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ All Services        │◀──── Subscribed to kill_signals
│ Reject Agent        │
└─────────────────────┘
          │
          ▼
    ┌───────────┐
    │  Agent    │
    │  KILLED   │
    │  (<30s)   │
    └───────────┘
```

## Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
├────────────────────────────────────────────────────────────────┤
│  /                    Landing page                              │
│  /agents              Agent dashboard + kill controls           │
│  /subscription        Pricing + tier management                 │
│  /governance          Proposal voting                           │
│  /admin               Metrics + user management                 │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                        API LAYER (Next.js)                      │
├────────────────────────────────────────────────────────────────┤
│  /api/auth            Wallet-based JWT auth                     │
│  /api/kill            SPIFFE revocation endpoint                │
│  /api/health          System status                             │
│  /api/governance/*    Voting endpoints                          │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                        SERVICES                                 │
├────────────────────────────────────────────────────────────────┤
│  SpiffeIdentityService    Agent registration + SVID issuance   │
│  CircuitBreaker           Auto-kill on anomalies               │
│  ImmutableAuditLogger     Hash-chained audit trail             │
│  useWallet                Solana token balance                 │
│  useAuth                  Session management                   │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                        DATABASE (Supabase)                      │
├────────────────────────────────────────────────────────────────┤
│  users                 Wallet addresses + tiers                 │
│  agent_identities      SPIFFE registry                          │
│  kill_signals          Real-time broadcast                      │
│  audit_logs            Immutable trail                          │
│  proposals             Governance voting                        │
│  subscriptions         Stripe + crypto payments                 │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN (Solana)                      │
├────────────────────────────────────────────────────────────────┤
│  $KILLSWITCH Token    56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon │
│  Token Balance        getTokenAccountsByOwner RPC               │
│  Tier Calculation     Balance → discount + voting power         │
└────────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AUTHENTICATION                                      │   │
│  │  • Phantom wallet signature                          │   │
│  │  • JWT tokens (7-day expiry)                         │   │
│  │  • SPIFFE IDs for agents                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AUTHORIZATION                                       │   │
│  │  • Token holder tiers (1K/10K/100K/1M)              │   │
│  │  • SPIFFE ID → permissions mapping                   │   │
│  │  • RLS policies in Supabase                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MONITORING                                          │   │
│  │  • Circuit breaker (failure detection)              │   │
│  │  • Anomaly scoring                                   │   │
│  │  • Rate limiting                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ENFORCEMENT                                         │   │
│  │  • Instant kill via SPIFFE revocation               │   │
│  │  • Real-time broadcast to all services              │   │
│  │  • Immutable audit logging                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Related Pages

- [[Home]]
- [[SPIFFE-Integration]]
- [[Enterprise-Edition]]
- [[API-Reference]]
