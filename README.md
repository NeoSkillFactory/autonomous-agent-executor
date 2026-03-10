# autonomous-agent-executor

![Audit](https://img.shields.io/badge/audit%3A%20PASS-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![OpenClaw](https://img.shields.io/badge/OpenClaw-skill-orange)

> Automatically handles confirmations, error recovery, and iterative task planning for OpenClaw agents without user intervention.

## Description

**Purpose:** Enable fully automated agent task execution with built-in confirmation handling, error recovery, and iterative task planning.

**Value:** Eliminates manual confirmations and interruptions while maintaining reliability through intelligent retry logic and dynamic task decomposition.

## Features

- Auto-confirmation handling for all prompt types
- Error recovery with configurable retry logic and exponential backoff
- Dynamic task decomposition when tasks exceed complexity threshold
- Session context preservation across retries and planning iterations
- CLI-configurable behavior via flags and config files
- Comprehensive logging for debugging and monitoring
- Proper exit codes for integration with CI/CD pipelines

## GitHub

Source code: [github.com/NeoSkillFactory/autonomous-agent-executor](https://github.com/NeoSkillFactory/autonomous-agent-executor)

## License

MIT © NeoSkillFactory