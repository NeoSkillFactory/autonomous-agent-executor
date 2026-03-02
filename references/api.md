# API Reference

## Module: executor.js

### `execute(options)`

The main entry point for autonomous task execution.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options.task` | string | Yes | Task identifier to execute |
| `options.autoConfirm` | boolean | No | Auto-accept confirmations (default: `true`) |
| `options.maxRetries` | number | No | Max retry attempts (default: `3`) |
| `options.retryDelay` | number | No | Initial retry delay in ms (default: `1000`) |
| `options.backoffFactor` | number | No | Exponential backoff multiplier (default: `2`) |
| `options.timeout` | number | No | Execution timeout in ms (default: `30000`) |
| `options.planOnFailure` | boolean | No | Enable task decomposition (default: `true`) |
| `options.maxSubtasks` | number | No | Max subtasks for decomposition (default: `5`) |
| `options.verbose` | boolean | No | Enable verbose logging (default: `false`) |
| `options.logFile` | string | No | Log file path (default: `null`) |
| `options.config` | string | No | Config file path (default: `null`) |
| `options.dryRun` | boolean | No | Dry run mode (default: `false`) |

**Returns:** `Promise<ExecutionResult | null>`

```typescript
interface ExecutionResult {
  success: boolean;
  output: string;
  attempts?: number;
  dryRun?: boolean;
  subtasks?: SubtaskResult[];
  context: ExecutionSummary;
}

interface SubtaskResult {
  subtask: string;
  success: boolean;
  output?: string;
  error?: string;
}

interface ExecutionSummary {
  task: string;
  status: 'pending' | 'running' | 'retrying' | 'planning' | 'success' | 'failure';
  attempts: number;
  elapsedMs: number;
  errorCount: number;
  subtaskCount: number;
}
```

**Example:**

```javascript
const { execute } = require('./scripts/executor');

const result = await execute({
  task: 'my-task',
  maxRetries: 3,
  verbose: true,
});
```

---

### `executeWithPlanning(taskName, config, logger)`

Lower-level function that manages the full execution lifecycle including task decomposition.

**Parameters:**
- `taskName` (string) — Task to execute
- `config` (object) — Resolved configuration object
- `logger` (Logger) — Logger instance

**Returns:** `Promise<ExecutionResult>`

**Throws:** Error with `.context` and `.subtaskResults` properties on failure.

---

### `executeWithRetry(taskName, config, logger)`

Executes a single task with retry logic and exponential backoff.

**Parameters:**
- `taskName` (string) — Task to execute
- `config` (object) — Resolved configuration object
- `logger` (Logger) — Logger instance

**Returns:** `Promise<{ success, output, attempts }>`

**Throws:** Error with `.attempts` property when retries exhausted.

---

### `ExecutionContext`

Tracks state across the execution lifecycle.

```javascript
const ctx = new ExecutionContext('my-task', config);
ctx.status       // 'pending' | 'running' | 'retrying' | 'planning' | 'success' | 'failure'
ctx.attempt      // Current attempt number (0-based)
ctx.startTime    // Unix timestamp of execution start
ctx.errors       // Array of recorded errors
ctx.elapsed()    // Elapsed time in ms
ctx.isTimedOut() // true if elapsed > config.timeout
ctx.toSummary()  // Returns ExecutionSummary object
```

---

## Module: handlers.js

### `Logger`

```javascript
const logger = new Logger(verbose, logFile);
logger.info('message');
logger.warn('message');
logger.error('message');
logger.debug('message');  // Only outputs when verbose=true
logger.close();           // Flush and close log file stream
```

---

### `ConfirmationHandler`

```javascript
const handler = new ConfirmationHandler(config, logger);

handler.isConfirmationPrompt('Are you sure?'); // true
handler.handle('Proceed?');                    // true (if autoConfirm) or false
```

---

### `ErrorHandler`

```javascript
const handler = new ErrorHandler(config, logger);

handler.classify(error);
// Returns: 'transient' | 'recoverable' | 'fatal' | 'timeout' | 'permission'

handler.shouldRetry(error, attemptNumber);
// Returns: boolean

handler.computeDelay(attempt);
// Returns: number (ms)

handler.handle(error, attempt);
// Returns: { retry: boolean, delay: number, type: string }
```

**Error Classification:**

| Type | Description | Retried? |
|------|-------------|---------|
| `transient` | Network errors, rate limits | Yes |
| `recoverable` | Unknown/generic errors | Yes |
| `fatal` | Permission denied, syntax errors | No |
| `timeout` | Execution timeout | Yes |
| `permission` | Access denied | No |

---

### `PlanningHandler`

```javascript
const handler = new PlanningHandler(config, logger);

handler.shouldPlan('task-name', failureCount);
// Returns: boolean

handler.decompose('task-name', context);
// Returns: string[] — array of subtask names
```

---

## Module: config.js

### `buildConfig(cliArgs, envOverrides)`

Merges all configuration sources (defaults → file → env → CLI) and validates the result.

```javascript
const { buildConfig } = require('./scripts/config');

const config = buildConfig({
  task: 'my-task',
  maxRetries: 5,
  verbose: true,
});
```

### Configuration Schema

```typescript
interface Config {
  task?: string;
  autoConfirm: boolean;   // default: true
  maxRetries: number;     // default: 3, range: 0–100
  retryDelay: number;     // default: 1000ms, range: 0–60000
  backoffFactor: number;  // default: 2, range: 1–10
  timeout: number;        // default: 30000ms, range: 1000–600000
  planOnFailure: boolean; // default: true
  maxSubtasks: number;    // default: 5, range: 1–20
  verbose: boolean;       // default: false
  logFile: string | null; // default: null
  dryRun: boolean;        // default: false
}
```

---

## CLI Reference

```
node scripts/cli.js [options]

Required:
  --task <name>           Task identifier

Optional:
  --auto-confirm          Auto-accept confirmations (default: on)
  --no-auto-confirm       Disable auto-confirmation
  --max-retries <n>       Max retries (default: 3)
  --retry-delay <ms>      Retry delay (default: 1000)
  --backoff-factor <n>    Backoff multiplier (default: 2)
  --timeout <ms>          Timeout (default: 30000)
  --plan-on-failure       Enable decomposition (default: on)
  --no-plan-on-failure    Disable decomposition
  --max-subtasks <n>      Max subtasks (default: 5)
  --verbose               Verbose output
  --log-file <path>       Log file path
  --config <path>         Config JSON file
  --dry-run               Simulate execution
  --help, -h              Show help
  --version, -v           Show version

Exit Codes:
  0  Success
  1  Failure
```
