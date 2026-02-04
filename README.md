# $KILLSWITCH

**AI Agent Safety Control - Emergency kill switch and guardrails for AI agents**

$KILLSWITCH is a comprehensive safety ecosystem for AI agents, powered by Runtime Fence technology. Think of it as a kill switch for your AI - instantly stop any agent, block dangerous actions, and monitor everything in real-time.

**🌐 Live Demo:** [killswitch.protocol14019.com](https://killswitch.protocol14019.com)

[![Tests](https://img.shields.io/badge/tests-82%2F82%20passing-brightgreen)](https://github.com/RunTimeAdmin/ai-agent-killswitch/actions) [![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE) [![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/) [![Security](https://img.shields.io/badge/security-6%20modules-red)](docs/Security-Hardening.md) [![Uptime](https://img.shields.io/badge/uptime-99.9%25-green)](https://status.killswitch.protocol14019.com)

---

## 🚀 Features

### Core Capabilities

- **🔴 Kill Switch** - Instantly stop any AI agent with one click
- **🚫 Action Blocking** - Define what actions agents cannot take
- **🛡️ Target Protection** - Block access to sensitive files, APIs, or systems
- **💰 Spending Limits** - Control how much an agent can spend
- **📊 Risk Scoring** - Automatic risk assessment of every action
- **📝 Audit Logging** - Complete trail of all agent activity
- **📧 Email/SMS Alerts** - Get notified of suspicious behavior
- **🖥️ Cross-Platform** - Windows, macOS, and Linux support

### Security Hardening (6 Core Modules)

- **🔒 Runtime Fence** - Real-time action validation and monitoring
- **☠️ Kill Switch** - SIGTERM → SIGKILL emergency termination
- **📝 Audit Logging** - Complete cryptographic audit trail
- **⚡ Sub-Second Response** - Kill signals under 100ms
- **🛡️ SPIFFE Identity** - Cryptographic workload identity
- **🗳️ Token Governance** - Decentralized oversight with $KILLSWITCH voting

---

## 📦 Quick Start

### Installation

```bash
pip install killswitch-agent
```

Or clone and install:

```bash
git clone https://github.com/RunTimeAdmin/ai-agent-killswitch.git
cd ai-agent-killswitch/packages/python
pip install -e .
```

### Basic Usage

```python
from runtime_fence import RuntimeFence, FenceConfig

# Create a fence
fence = RuntimeFence(FenceConfig(
    agent_id="my-agent",
    blocked_actions=["delete", "exec", "sudo"],
    blocked_targets=[".env", "production", "wallet"],
    spending_limit=100.0
))

# Validate an action
result = fence.validate("read", "document.txt")
if result.allowed:
    # Proceed with action
    pass
else:
    print(f"Blocked: {result.reasons}")

# Kill switch
fence.kill("Emergency stop")
```

### Wrap Any Function

```python
@fence.wrap_function("api_call", "external_service")
def call_external_api(data):
    return requests.post("https://api.example.com", json=data)

# Now the function goes through the fence automatically
call_external_api({"key": "value"})
```

---

## 🖥️ Desktop App (System Tray)

### Windows

```bash
install_fence.bat
```

### Mac/Linux

```bash
chmod +x install_fence.sh
./install_fence.sh
```

Look for the shield icon in your system tray. Right-click for options.

---

## ⌨️ CLI Commands

```bash
fence version --check    # Check for updates
fence update             # Upgrade to latest version
fence status             # Show fence status
fence scan               # Detect AI agents on your system
fence test               # Run quick validation test
fence start              # Launch tray app
```

---

## 🤖 Supported Agent Types

$KILLSWITCH includes presets for common AI agents:

| Agent Type | Blocked Actions | Use Case |
| --- | --- | --- |
| **Coding Assistant** | exec, shell, rm, sudo | Copilot, Cursor, Aider |
| **Email Bot** | send_bulk, forward_all, export | Email automation |
| **Data Analyst** | delete, drop_table, export_pii | Data processing |
| **Web Browser** | login, purchase, submit_form | Web scraping |
| **Autonomous Agent** | spawn_agent, modify_self, execute_code | AutoGPT, BabyAGI |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Your AI Agent                        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   $KILLSWITCH                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Validator   │  │ Risk Scorer │  │ Kill Switch │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Audit Log   │  │ Alerts      │  │ Settings    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼ (if allowed)
┌─────────────────────────────────────────────────────────┐
│                   External World                         │
│         (APIs, Files, Databases, Network)               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 API Reference

### REST Endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/runtime/assess` | POST | Validate an action |
| `/api/runtime/kill` | POST | Activate kill switch |
| `/api/runtime/status` | GET | Get fence status |
| `/api/settings` | GET/POST | Manage settings |
| `/api/audit-logs` | GET | View audit logs |
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Get JWT token |

### Authentication

```bash
# Using JWT token
curl -H "Authorization: Bearer <token>" https://api.runtimefence.com/api/runtime/status

# Using API key
curl -H "X-API-Key: ks_xxxxx" https://api.runtimefence.com/api/runtime/status
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# API
KILLSWITCH_API_URL=http://localhost:3001
KILLSWITCH_API_KEY=your_api_key

# Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your_password
ALERT_TO_EMAILS=admin@company.com

# SMS (Twilio)
TWILIO_SID=your_sid
TWILIO_TOKEN=your_token
TWILIO_FROM=+1234567890
ALERT_SMS_NUMBERS=+1234567890
```

### Settings UI

Access the web dashboard at `http://localhost:3000/settings` to configure:

- Agent presets (Coding, Email, Data, Web, Autonomous)
- Blocked actions and targets
- Spending limits
- Risk thresholds
- Auto-kill settings
- Email/SMS alerts

---

## 🛠️ Development

```bash
# Clone repo
git clone https://github.com/RunTimeAdmin/ai-agent-killswitch.git
cd ai-agent-killswitch

# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test
```

---

## 📁 Project Structure

```
ai-agent-killswitch/
├── apps/
│   └── web/              # Next.js dashboard
├── packages/
│   ├── core/             # Kill switch engine
│   ├── sdk/              # TypeScript SDK
│   ├── cli/              # Command-line tools
│   └── python/           # Python fence wrapper
├── services/
│   └── api/              # Express REST API
└── docs/                 # Documentation
```

---

## 🌐 About

Built by **RunTimeAdmin** | David Cooper | CCIE #14019

**Related Projects:**

- 📖 [The AI Agent Kill Switch Book](https://runtimefence.com/books)
- 🛡️ [$KILLSWITCH Documentation](https://github.com/RunTimeAdmin/ai-agent-killswitch/wiki)
- 🔴 [$KILLSWITCH Token](https://runtimefence.com/killswitch)

**Why This Matters:**

> "When AI agents go rogue in Kubernetes, you need a kill switch. Not a button. A network-level containment system."

As Fortune, Palo Alto Networks, and Andrej Karpathy warn of the emerging AI security crisis, we're building real solutions—not just launching tokens.

$KILLSWITCH provides the guardrails that prevent AI agents from causing catastrophic damage, while the token enables community governance and sustainable development of the ecosystem.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/API-Reference.md) | Full REST API documentation with examples |
| [Integration Guide](docs/Integration-Guide.md) | LangChain, AutoGPT, OpenAI, Anthropic integration |
| [Troubleshooting & FAQ](docs/Troubleshooting-FAQ.md) | Common issues and solutions |
| [Security Hardening](wiki/Security-Hardening.md) | 10 security modules documentation |
| [GitHub Wiki](https://github.com/RunTimeAdmin/ai-agent-killswitch/wiki) | Full wiki documentation |

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Live Demo:** [killswitch.protocol14019.com](https://killswitch.protocol14019.com)
- **Documentation:** [killswitch.protocol14019.com/docs](https://killswitch.protocol14019.com/docs)
- **GitHub:** [github.com/RunTimeAdmin/ai-agent-killswitch](https://github.com/RunTimeAdmin/ai-agent-killswitch)
- **Twitter:** [@protocol14019](https://x.com/protocol14019)
- **Email:** [help@protocol14019.com](mailto:help@protocol14019.com)
- **Token:** [Buy on Jupiter](https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon)

---

## ⚡ Quick Demo

```python
# Stop an agent from deleting files
from runtime_fence import RuntimeFence

fence = RuntimeFence()
result = fence.validate("delete", "production_database.sql")
# Returns: {"allowed": False, "reasons": ["Action 'delete' is blocked"]}

# Get risk score for a transaction
result = fence.validate("transfer", "0x...", amount=1000000)
# Returns: {"allowed": False, "risk_score": 95, "reasons": ["High-value transfer blocked"]}

# Emergency stop
fence.kill("Suspicious activity detected")
# All agent operations halted immediately
```

---

**🛡️ Protect your AI. Before it protects itself.**

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📊 Status

- [x] Core kill switch engine
- [x] Python SDK
- [x] TypeScript SDK
- [x] REST API
- [x] Web dashboard
- [x] CLI tools
- [x] Desktop tray app
- [x] Audit logging
- [x] Risk scoring
- [x] USD Subscriptions (Stripe)
- [x] Crypto payments (SOL/USDC)
- [x] $KILLSWITCH token utility
- [x] Token-weighted governance
- [x] Usage tracking & limits
- [x] SPIFFE/SPIRE identity integration
- [x] Security hardening (10 modules)
- [x] Live demo site
- [ ] Mobile app (coming soon)

---

## 💰 $KILLSWITCH Token

**Contract:** `56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon`

[Buy on Jupiter](https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon)

### Token Holder Benefits

| Holdings | Discount | Governance |
|----------|----------|------------|
| 1,000+ | - | Vote on proposals |
| 10,000+ | 10% off | Vote on proposals |
| 100,000+ | 20% off | Vote on proposals |
| 1,000,000+ | 40% off | 2x voting power |

### Subscription Tiers

| Tier | Price | With Max Discount |
|------|-------|-------------------|
| Basic | $5/mo | $3/mo |
| Pro | $50/mo | $30/mo |
| Team | $250/mo | $150/mo |
| Enterprise | $1,000/mo | $600/mo |
| VIP | $5,000/mo | $3,000/mo |

---

## 🎯 Roadmap

### Phase 1: Core Platform ✅

- Runtime Fence engine
- Python and TypeScript SDKs
- REST API
- Web dashboard

### Phase 2: Monetization ✅

- USD subscriptions (Stripe)
- Crypto payments (SOL/USDC)
- $KILLSWITCH token utility
- Token-weighted governance
- Usage-based tier limits

### Phase 3: Ecosystem 🚧

- Mobile app (iOS/Android)
- Third-party integrations
- Plugin marketplace
- Enterprise features
- Multi-agent orchestration

---

**$KILLSWITCH - Because every AI needs an off switch.**
