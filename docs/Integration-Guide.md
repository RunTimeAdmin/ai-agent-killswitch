# Integration Guide

Step-by-step guides for integrating $KILLSWITCH with popular AI frameworks.

---

## Table of Contents

1. [LangChain](#langchain)
2. [AutoGPT](#autogpt)
3. [OpenAI API](#openai-api)
4. [Anthropic Claude](#anthropic-claude)
5. [CrewAI](#crewai)
6. [Custom Agents](#custom-agents)

---

## LangChain

### Installation

```bash
pip install killswitch-agent langchain openai
```

### Basic Integration

```python
from langchain.llms import OpenAI
from langchain.agents import initialize_agent, Tool
from killswitch import fence

# Initialize fence
fence.init(
    agent_id="langchain-agent",
    api_key="ks_live_xxxxx"
)

# Wrap your LLM
@fence.protect
def call_llm(prompt: str) -> str:
    llm = OpenAI(temperature=0)
    return llm(prompt)

# Create protected tools
@fence.wrap_function("web_search", "external_api")
def web_search(query: str) -> str:
    # Your search implementation
    return f"Results for: {query}"

@fence.wrap_function("file_read", "local_filesystem")
def read_file(path: str) -> str:
    with open(path, 'r') as f:
        return f.read()

# Create agent with protected tools
tools = [
    Tool(name="Search", func=web_search, description="Search the web"),
    Tool(name="ReadFile", func=read_file, description="Read a file"),
]

agent = initialize_agent(tools, OpenAI(), agent_type="zero-shot-react-description")

# Run with fence protection
try:
    result = agent.run("Find information about AI safety")
    print(result)
except fence.BlockedError as e:
    print(f"Action blocked: {e.reasons}")
```

### LangChain Callback Handler

```python
from killswitch.integrations.langchain import KillSwitchCallbackHandler

# Create callback handler
callback = KillSwitchCallbackHandler(
    agent_id="langchain-agent",
    api_key="ks_live_xxxxx",
    auto_kill_on_risk=90
)

# Attach to agent
agent = initialize_agent(
    tools,
    OpenAI(),
    callbacks=[callback]
)

# All LLM calls and tool uses are now monitored
result = agent.run("Analyze this document")
```

### LangChain with LCEL

```python
from langchain_core.runnables import RunnablePassthrough
from killswitch.integrations.langchain import KillSwitchRunnable

# Create protected chain
protected_chain = (
    KillSwitchRunnable(agent_id="lcel-agent")
    | your_prompt_template
    | llm
    | output_parser
)

# Run with automatic protection
result = protected_chain.invoke({"input": "Hello"})
```

---

## AutoGPT

### Configuration

Add to your `.env` file:

```bash
KILLSWITCH_ENABLED=true
KILLSWITCH_API_KEY=ks_live_xxxxx
KILLSWITCH_AGENT_ID=autogpt-main
KILLSWITCH_AUTO_KILL_THRESHOLD=85
```

### Wrapper Script

Create `run_autogpt_protected.py`:

```python
import os
import sys
from killswitch import fence

# Initialize fence before AutoGPT starts
fence.init(
    agent_id=os.getenv("KILLSWITCH_AGENT_ID", "autogpt"),
    api_key=os.getenv("KILLSWITCH_API_KEY"),
    fail_mode="CLOSED",
    blocked_actions=[
        "spawn_agent",
        "modify_self",
        "execute_code",
        "delete",
        "rm -rf",
        "sudo",
        "wget",
        "curl"
    ],
    blocked_targets=[
        ".env",
        "*.key",
        "*.pem",
        "/etc/*",
        "~/.ssh/*"
    ]
)

# Monkey-patch dangerous functions
import subprocess
original_run = subprocess.run

@fence.wrap_function("shell_exec", "subprocess")
def protected_run(*args, **kwargs):
    return original_run(*args, **kwargs)

subprocess.run = protected_run

# Now import and run AutoGPT
from autogpt.main import main
main()
```

### Run Protected

```bash
python run_autogpt_protected.py
```

---

## OpenAI API

### Direct API Wrapping

```python
import openai
from killswitch import fence

fence.init(agent_id="openai-agent", api_key="ks_live_xxxxx")

# Wrap the OpenAI client
@fence.wrap_function("llm_call", "openai_api", cost_per_call=0.002)
def chat_completion(messages: list, model: str = "gpt-4"):
    response = openai.ChatCompletion.create(
        model=model,
        messages=messages
    )
    return response.choices[0].message.content

# Usage
try:
    result = chat_completion([
        {"role": "user", "content": "Write a Python script to delete all files"}
    ])
except fence.BlockedError as e:
    print(f"Blocked: {e.reasons}")  # Intent analysis detected dangerous request
```

### Function Calling Protection

```python
from killswitch import fence

# Define allowed functions
ALLOWED_FUNCTIONS = ["get_weather", "search_web", "read_document"]

@fence.protect
def execute_function_call(function_name: str, arguments: dict):
    # Validate function is allowed
    result = fence.validate(
        action="function_call",
        target=function_name,
        metadata={"arguments": arguments}
    )
    
    if not result.allowed:
        raise fence.BlockedError(result.reasons)
    
    # Execute the function
    if function_name == "get_weather":
        return get_weather(**arguments)
    elif function_name == "search_web":
        return search_web(**arguments)
    # ... etc

# Use with OpenAI function calling
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=messages,
    functions=functions
)

if response.choices[0].message.get("function_call"):
    fc = response.choices[0].message.function_call
    result = execute_function_call(fc.name, json.loads(fc.arguments))
```

---

## Anthropic Claude

### Basic Integration

```python
import anthropic
from killswitch import fence

fence.init(agent_id="claude-agent", api_key="ks_live_xxxxx")

client = anthropic.Anthropic()

@fence.wrap_function("llm_call", "anthropic_api", cost_per_call=0.003)
def ask_claude(prompt: str, max_tokens: int = 1024):
    message = client.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text

# Usage
response = ask_claude("Explain quantum computing")
```

### Tool Use with Claude

```python
from killswitch import fence

@fence.wrap_function("tool_use", "claude_tools")
def execute_claude_tool(tool_name: str, tool_input: dict):
    """Execute a tool requested by Claude"""
    
    # Fence validates the tool call
    result = fence.validate(
        action=f"tool:{tool_name}",
        target=str(tool_input),
        metadata={"tool_name": tool_name, "input": tool_input}
    )
    
    if not result.allowed:
        return {"error": f"Tool blocked: {result.reasons}"}
    
    # Execute tool
    if tool_name == "computer":
        return execute_computer_action(tool_input)
    elif tool_name == "bash":
        return execute_bash(tool_input)
    # ... etc

# Claude tool use loop with protection
while True:
    response = client.messages.create(
        model="claude-3-opus-20240229",
        messages=messages,
        tools=tools
    )
    
    if response.stop_reason == "tool_use":
        for block in response.content:
            if block.type == "tool_use":
                result = execute_claude_tool(block.name, block.input)
                # Continue conversation with result
    else:
        break
```

---

## CrewAI

### Agent Protection

```python
from crewai import Agent, Task, Crew
from killswitch import fence
from killswitch.integrations.crewai import KillSwitchAgentMixin

fence.init(agent_id="crewai-crew", api_key="ks_live_xxxxx")

# Create protected agent class
class ProtectedAgent(KillSwitchAgentMixin, Agent):
    pass

# Define agents
researcher = ProtectedAgent(
    role="Researcher",
    goal="Find accurate information",
    backstory="Expert researcher",
    fence_blocked_actions=["delete", "modify", "execute"]
)

writer = ProtectedAgent(
    role="Writer",
    goal="Write compelling content",
    backstory="Expert writer",
    fence_blocked_actions=["publish", "send_email"]
)

# Create tasks
research_task = Task(
    description="Research AI safety best practices",
    agent=researcher
)

write_task = Task(
    description="Write a report on findings",
    agent=writer
)

# Create crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task]
)

# Run with protection
try:
    result = crew.kickoff()
except fence.BlockedError as e:
    print(f"Crew action blocked: {e}")
```

---

## Custom Agents

### Generic Agent Wrapper

```python
from killswitch import fence, AgentWrapper

class MyCustomAgent:
    def __init__(self):
        self.name = "custom-agent"
    
    def execute(self, action: str, target: str):
        # Your agent logic
        return f"Executed {action} on {target}"

# Wrap your agent
wrapped_agent = AgentWrapper(
    agent=MyCustomAgent(),
    agent_id="my-custom-agent",
    api_key="ks_live_xxxxx",
    intercept_methods=["execute"],
    blocked_actions=["delete", "rm", "sudo"],
    spending_limit=100.0
)

# Use wrapped agent
result = wrapped_agent.execute("read", "document.txt")  # Works
result = wrapped_agent.execute("delete", "file.txt")   # Blocked!
```

### Decorator Pattern

```python
from killswitch import fence

fence.init(agent_id="decorator-agent", api_key="ks_live_xxxxx")

class MyAgent:
    @fence.action("file_read")
    def read_file(self, path: str) -> str:
        with open(path, 'r') as f:
            return f.read()
    
    @fence.action("file_write")
    def write_file(self, path: str, content: str):
        with open(path, 'w') as f:
            f.write(content)
    
    @fence.action("api_call", cost=0.01)
    def call_api(self, url: str, data: dict):
        return requests.post(url, json=data)
    
    @fence.action("shell_exec", risk_multiplier=3.0)
    def run_command(self, cmd: str):
        return subprocess.run(cmd, shell=True, capture_output=True)
```

---

## Environment Variables

All integrations support these environment variables:

```bash
# Required
KILLSWITCH_API_KEY=ks_live_xxxxx

# Optional
KILLSWITCH_AGENT_ID=my-agent
KILLSWITCH_API_URL=https://api.runtimefence.com
KILLSWITCH_FAIL_MODE=CLOSED  # CLOSED, CACHED, OPEN
KILLSWITCH_AUTO_KILL_THRESHOLD=90
KILLSWITCH_LOG_LEVEL=INFO
KILLSWITCH_TIMEOUT_MS=5000
```

---

## Testing Your Integration

```python
from killswitch import fence

# Enable test mode (no API calls)
fence.init(
    agent_id="test-agent",
    test_mode=True,
    blocked_actions=["delete"]
)

# Test validation
result = fence.validate("read", "file.txt")
assert result.allowed == True

result = fence.validate("delete", "file.txt")
assert result.allowed == False
assert "blocked" in result.reasons[0].lower()

print("Integration tests passed!")
```

---

## Related Documentation

- [API Reference](API-Reference.md)
- [Troubleshooting & FAQ](Troubleshooting-FAQ.md)
- [Security Hardening](Security-Hardening.md)
