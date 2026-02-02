# Runtime Fence

**AI Agent Safety Control - Kill switch and guardrails for AI agents**

Runtime Fence is a security layer that wraps around AI agents, monitoring and controlling their actions in real-time. Think of it as a fence around your AI - every action must pass through it before reaching the outside world.

## Features

- **Kill Switch** - Instantly stop any AI agent with one click
- **Action Blocking** - Define what actions agents cannot take
- **Target Protection** - Block access to sensitive files, APIs, or systems
- **Spending Limits** - Control how much an agent can spend
- **Risk Scoring** - Automatic risk assessment of every action
- **Audit Logging** - Complete trail of all agent activity
- **Email/SMS Alerts** - Get notified of suspicious behavior
- **Cross-Platform** - Windows, macOS, and Linux support

## Quick Start

### Installation

```bash
pip install runtime-fence
```

Or clone and install:

```bash
git clone https://github.com/Protocol14019/ai-agent-killswitch.git
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

### Desktop App (System Tray)

```bash
# Windows
install_fence.bat

# Mac/Linux
chmod +x install_fence.sh
./install_fence.sh
```

Look for the shield icon in your system tray. Right-click for options.

## CLI Commands

```bash
fence version --check    # Check for updates
fence update             # Upgrade to latest version
fence status             # Show fence status
fence scan               # Detect AI agents on your system
fence test               # Run quick validation test
fence start              # Launch tray app
```

## Supported Agent Types

Runtime Fence includes presets for common AI agents:

| Agent Type | Blocked Actions | Use Case |
|------------|-----------------|----------|
| Coding Assistant | exec, shell, rm, sudo | Copilot, Cursor, Aider |
| Email Bot | send_bulk, forward_all, export | Email automation |
| Data Analyst | delete, drop_table, export_pii | Data processing |
| Web Browser | login, purchase, submit_form | Web scraping |
| Autonomous Agent | spawn_agent, modify_self, execute_code | AutoGPT, BabyAGI |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Your AI Agent                        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   RUNTIME FENCE                          │
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

## API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
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

## Configuration

### Environment Variables

```bash
# API
RUNTIME_FENCE_API_URL=http://localhost:3001
RUNTIME_FENCE_API_KEY=your_api_key

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

## Development

```bash
# Clone repo
git clone https://github.com/Protocol14019/ai-agent-killswitch.git
cd ai-agent-killswitch

# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test
```

## Project Structure

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

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Documentation](https://github.com/Protocol14019/ai-agent-killswitch/wiki)
- [Issues](https://github.com/Protocol14019/ai-agent-killswitch/issues)
- [Website](https://runtimefence.com)

---

Built with security in mind. Protect your AI agents today.
