#!/usr/bin/env node
'use strict';

const { execute } = require('./executor');

const HELP = `
Autonomous Agent Executor
Automatically handles confirmations, error recovery, and iterative task planning.

Usage:
  node cli.js --task <name> [options]

Options:
  --task <name>          Task identifier to execute (required)
  --auto-confirm         Auto-accept all confirmations (default: true)
  --no-auto-confirm      Disable auto-confirmation
  --max-retries <n>      Max retry attempts (default: 3)
  --retry-delay <ms>     Initial retry delay in ms (default: 1000)
  --backoff-factor <n>   Exponential backoff multiplier (default: 2)
  --timeout <ms>         Execution timeout in ms (default: 30000)
  --plan-on-failure      Enable task decomposition on failure (default: true)
  --no-plan-on-failure   Disable task decomposition
  --max-subtasks <n>     Max subtasks during decomposition (default: 5)
  --verbose              Enable verbose logging
  --log-file <path>      Write logs to file
  --config <path>        Load config from JSON file
  --dry-run              Simulate execution without running tasks
  --help, -h             Show this help message
  --version, -v          Show version

Examples:
  node cli.js --task analyze-data
  node cli.js --task deploy-service --auto-confirm --max-retries 5
  node cli.js --task complex-workflow --verbose --log-file run.log
  node cli.js --config config.json --task my-task
  node cli.js --task test-task --dry-run
`.trim();

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {};
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      console.log(HELP);
      process.exit(0);
    }

    if (arg === '--version' || arg === '-v') {
      const pkg = require('../package.json');
      console.log(pkg.version);
      process.exit(0);
    }

    if (arg === '--task' && args[i + 1]) {
      result.task = args[++i];
    } else if (arg === '--max-retries' && args[i + 1]) {
      result.maxRetries = parseInt(args[++i], 10);
    } else if (arg === '--retry-delay' && args[i + 1]) {
      result.retryDelay = parseInt(args[++i], 10);
    } else if (arg === '--backoff-factor' && args[i + 1]) {
      result.backoffFactor = parseFloat(args[++i]);
    } else if (arg === '--timeout' && args[i + 1]) {
      result.timeout = parseInt(args[++i], 10);
    } else if (arg === '--max-subtasks' && args[i + 1]) {
      result.maxSubtasks = parseInt(args[++i], 10);
    } else if (arg === '--log-file' && args[i + 1]) {
      result.logFile = args[++i];
    } else if (arg === '--config' && args[i + 1]) {
      result.config = args[++i];
    } else if (arg === '--auto-confirm') {
      result.autoConfirm = true;
    } else if (arg === '--no-auto-confirm') {
      result.autoConfirm = false;
    } else if (arg === '--plan-on-failure') {
      result.planOnFailure = true;
    } else if (arg === '--no-plan-on-failure') {
      result.planOnFailure = false;
    } else if (arg === '--verbose') {
      result.verbose = true;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      console.error('Use --help for usage information.');
      process.exit(1);
    }

    i++;
  }

  return result;
}

async function main() {
  const parsed = parseArgs(process.argv);

  if (!parsed.task && !parsed.config) {
    console.error('Error: --task <name> is required');
    console.error('Use --help for usage information.');
    process.exit(1);
  }

  try {
    const result = await execute(parsed);
    if (!result) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error(`Fatal: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, main };
