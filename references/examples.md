# Usage Examples

## Basic Autonomous Execution

Run a task with all default autonomous settings:

```bash
node scripts/cli.js --task analyze-data
```

Expected output:
```
[2026-03-02T10:00:00.000Z] [INFO] Autonomous Agent Executor started
[2026-03-02T10:00:00.001Z] [INFO] Task: analyze-data
[2026-03-02T10:00:00.012Z] [INFO] Task "analyze-data" completed in 23ms after 1 attempt(s)
[2026-03-02T10:00:00.012Z] [INFO] Execution completed successfully
```

## Dry Run Mode

Simulate execution without actually running tasks:

```bash
node scripts/cli.js --task deploy-service --dry-run
```

Useful for verifying configuration before running in production.

## Custom Retry Configuration

Override retry settings for unreliable tasks:

```bash
node scripts/cli.js \
  --task fetch-external-data \
  --max-retries 5 \
  --retry-delay 2000 \
  --backoff-factor 1.5
```

This will retry up to 5 times with delays: 2000ms, 3000ms, 4500ms, 6750ms, 10125ms.

## Verbose Logging with File Output

Enable detailed logs and write to a file:

```bash
node scripts/cli.js \
  --task complex-analysis \
  --verbose \
  --log-file /tmp/execution.log
```

## Using a Config File

Create `config.json`:
```json
{
  "autoConfirm": true,
  "maxRetries": 3,
  "retryDelay": 1000,
  "backoffFactor": 2,
  "timeout": 60000,
  "planOnFailure": true,
  "maxSubtasks": 4,
  "verbose": false
}
```

Run with config:
```bash
node scripts/cli.js --config config.json --task my-task
```

## Disabling Auto-Confirmation

If you want confirmations to not be auto-accepted (for testing):

```bash
node scripts/cli.js --task safe-task --no-auto-confirm
```

## Task Decomposition on Failure

When a task fails repeatedly, the executor decomposes it into subtasks:

```bash
node scripts/cli.js \
  --task complex-workflow \
  --max-retries 2 \
  --plan-on-failure \
  --max-subtasks 4 \
  --verbose
```

The executor will:
1. Attempt `complex-workflow` up to 2 times
2. On persistent failure, decompose into subtasks:
   - `validate-prerequisites:complex-workflow`
   - `prepare-environment:complex-workflow`
   - `execute-core:complex-workflow`
   - `verify-output:complex-workflow`
3. Execute each subtask autonomously
4. Aggregate results

## Programmatic Integration

```javascript
const { execute } = require('./scripts/executor');

async function runAutonomously() {
  try {
    const result = await execute({
      task: 'data-pipeline',
      autoConfirm: true,
      maxRetries: 3,
      verbose: true,
    });
    console.log('Success:', result.output);
    return result;
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

runAutonomously();
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Execution succeeded |
| `1` | Execution failed (retries exhausted or fatal error) |

## Common Scenarios

### CI/CD Pipeline Integration

```bash
#!/bin/bash
set -e

node scripts/cli.js \
  --task build-and-test \
  --auto-confirm \
  --max-retries 2 \
  --timeout 120000 \
  --log-file ci-execution.log

echo "Autonomous execution completed successfully"
```

### Handling Intermittent Network Failures

```bash
node scripts/cli.js \
  --task api-sync \
  --max-retries 5 \
  --retry-delay 500 \
  --backoff-factor 2
```

### Long-Running Tasks with Extended Timeout

```bash
node scripts/cli.js \
  --task ml-training \
  --timeout 600000 \
  --max-retries 1 \
  --verbose
```
