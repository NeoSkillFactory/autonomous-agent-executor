---
name: autonomous-agent-executor
description: Automatically handles confirmations, error recovery, and iterative task planning for OpenClaw agents without user intervention.
---

# Autonomous Agent Executor

## 1. Description

**Purpose:** Enable fully automated agent task execution with built-in confirmation handling, error recovery, and iterative task planning.

**Value:** Eliminates manual confirmations and interruptions while maintaining reliability through intelligent retry logic and dynamic task decomposition.

## 2. Capabilities

- Auto-confirmation handling for all prompt types
- Error recovery with configurable retry logic and exponential backoff
- Dynamic task decomposition when tasks exceed complexity threshold
- Session context preservation across retries and planning iterations
- CLI-configurable behavior via flags and config files
- Comprehensive logging for debugging and monitoring
- Proper exit codes for integration with CI/CD pipelines

## 3. Out of Scope

- Core agent logic replacement
- UI or web interface (CLI-only)
- Security or permission-related decisions
- Persistent state management beyond single execution sessions
- Monitoring dashboards or analytics

## 4. Triggers

This skill activates when users request:
- "Run this autonomously without asking for confirmations"
- "Execute this task automatically with error recovery"
- "Handle all prompts automatically and continue on failure"
- "Run this agent task with full autonomy"
- "Execute this workflow with automatic error handling"
- "Run this task with retry logic and planning"
- "Execute this without interruption or user input"

Keywords: `autonomous`, `auto-confirm`, `auto execute`, `no confirmation`, `retry logic`, `error recovery`, `self-healing`, `unattended`

## 5. Key Files

| File | Purpose |
|------|---------|
| `scripts/executor.js` | Core autonomous execution engine and control flow |
| `scripts/cli.js` | CLI command parsing and entry point |
| `scripts/handlers.js` | Confirmation, error, and planning handler logic |
| `scripts/config.js` | Configuration management and validation |
| `references/examples.md` | Usage scenarios and best practices |
| `references/api.md` | Integration API documentation |

## 6. How to Use

### Basic Autonomous Execution

```bash
node scripts/cli.js --task "analyze-data"
```

### With Auto-Confirm and Custom Retries

```bash
node scripts/cli.js --task "deploy-service" --auto-confirm --max-retries 5
```

### With Config File

```bash
node scripts/cli.js --config config.json --task "complex-workflow"
```

### With Verbose Logging

```bash
node scripts/cli.js --task "my-task" --verbose --log-file execution.log
```

### CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--task <name>` | required | Task identifier to execute |
| `--auto-confirm` | true | Automatically accept all confirmation prompts |
| `--max-retries <n>` | 3 | Maximum retry attempts on failure |
| `--retry-delay <ms>` | 1000 | Initial retry delay in milliseconds |
| `--backoff-factor <n>` | 2 | Exponential backoff multiplier |
| `--timeout <ms>` | 30000 | Task execution timeout |
| `--plan-on-failure` | true | Enable task decomposition on persistent failure |
| `--max-subtasks <n>` | 5 | Maximum subtasks during decomposition |
| `--verbose` | false | Enable detailed logging output |
| `--log-file <path>` | none | Write logs to file in addition to stdout |
| `--config <path>` | none | Load configuration from JSON file |
| `--dry-run` | false | Simulate execution without running tasks |

## 7. Acceptance Criteria

- [x] Autonomous confirmation handling for various prompt types
- [x] Full error recovery cycle with retry and backoff
- [x] Task planning iteration on persistent failure
- [x] Cross-retry context preservation
- [x] CLI options fully functional
- [x] Proper exit codes (0 = success, 1 = failure)
- [x] Comprehensive logging output
- [x] Documentation complete and accurate
