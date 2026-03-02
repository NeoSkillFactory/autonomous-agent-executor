'use strict';

const ERROR_TYPES = {
  TRANSIENT: 'transient',
  RECOVERABLE: 'recoverable',
  FATAL: 'fatal',
  TIMEOUT: 'timeout',
  PERMISSION: 'permission',
};

const CONFIRMATION_PATTERNS = [
  /^(yes|no)\?/i,
  /continue/i,
  /proceed/i,
  /confirm/i,
  /are you sure/i,
  /\[y\/n\]/i,
  /press enter/i,
  /do you want/i,
];

const TRANSIENT_PATTERNS = [
  /econnreset/i,
  /econnrefused/i,
  /etimedout/i,
  /socket hang up/i,
  /network/i,
  /temporary/i,
  /retry/i,
  /rate.?limit/i,
  /too many requests/i,
  /503/,
  /502/,
];

const FATAL_PATTERNS = [
  /permission denied/i,
  /access denied/i,
  /unauthorized/i,
  /forbidden/i,
  /eacces/i,
  /not found/i,
  /enoent/i,
  /syntax error/i,
  /invalid argument/i,
];

class Logger {
  constructor(verbose = false, logFile = null) {
    this.verbose = verbose;
    this.logFile = logFile;
    this._stream = null;
    if (logFile) {
      const fs = require('fs');
      this._stream = fs.createWriteStream(logFile, { flags: 'a' });
    }
  }

  _write(level, message) {
    const ts = new Date().toISOString();
    const line = `[${ts}] [${level.toUpperCase()}] ${message}`;
    if (level !== 'debug' || this.verbose) {
      process.stdout.write(line + '\n');
    }
    if (this._stream) {
      this._stream.write(line + '\n');
    }
  }

  info(msg) { this._write('info', msg); }
  warn(msg) { this._write('warn', msg); }
  error(msg) { this._write('error', msg); }
  debug(msg) { this._write('debug', msg); }

  close() {
    if (this._stream) {
      this._stream.end();
    }
  }
}

class ConfirmationHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  isConfirmationPrompt(text) {
    return CONFIRMATION_PATTERNS.some(p => p.test(text));
  }

  handle(prompt) {
    if (!this.config.autoConfirm) {
      this.logger.warn(`Confirmation required (autoConfirm=false): ${prompt}`);
      return false;
    }
    this.logger.debug(`Auto-confirming prompt: "${prompt}"`);
    return true;
  }
}

class ErrorHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  classify(error) {
    const msg = (error.message || String(error)).toLowerCase();

    if (error.code === 'ETIMEDOUT' || /timeout/i.test(msg)) {
      return ERROR_TYPES.TIMEOUT;
    }
    if (FATAL_PATTERNS.some(p => p.test(msg))) {
      return ERROR_TYPES.FATAL;
    }
    if (TRANSIENT_PATTERNS.some(p => p.test(msg))) {
      return ERROR_TYPES.TRANSIENT;
    }
    return ERROR_TYPES.RECOVERABLE;
  }

  shouldRetry(error, attemptNumber) {
    const type = this.classify(error);
    if (type === ERROR_TYPES.FATAL || type === ERROR_TYPES.PERMISSION) {
      this.logger.warn(`Fatal error, will not retry: ${error.message}`);
      return false;
    }
    if (attemptNumber >= this.config.maxRetries) {
      this.logger.warn(`Max retries (${this.config.maxRetries}) reached`);
      return false;
    }
    return true;
  }

  computeDelay(attempt) {
    return this.config.retryDelay * Math.pow(this.config.backoffFactor, attempt);
  }

  handle(error, attempt) {
    const type = this.classify(error);
    this.logger.error(`Error [${type}] on attempt ${attempt + 1}: ${error.message}`);

    if (!this.shouldRetry(error, attempt)) {
      return { retry: false, delay: 0, type };
    }

    const delay = this.computeDelay(attempt);
    this.logger.info(`Retrying in ${delay}ms (attempt ${attempt + 2}/${this.config.maxRetries + 1})`);
    return { retry: true, delay, type };
  }
}

class PlanningHandler {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  shouldPlan(task, failureCount) {
    return this.config.planOnFailure && failureCount >= this.config.maxRetries;
  }

  decompose(task, context = {}) {
    this.logger.info(`Decomposing task "${task}" into subtasks`);

    const subtasks = this._generateSubtasks(task, context);
    this.logger.info(`Generated ${subtasks.length} subtask(s)`);
    subtasks.forEach((s, i) => this.logger.debug(`  Subtask ${i + 1}: ${s}`));

    return subtasks;
  }

  _generateSubtasks(task, context) {
    const steps = [];
    const maxSteps = Math.min(this.config.maxSubtasks, 5);

    steps.push(`validate-prerequisites:${task}`);
    if (maxSteps >= 2) steps.push(`prepare-environment:${task}`);
    if (maxSteps >= 3) steps.push(`execute-core:${task}`);
    if (maxSteps >= 4) steps.push(`verify-output:${task}`);
    if (maxSteps >= 5) steps.push(`cleanup:${task}`);

    return steps.slice(0, maxSteps);
  }
}

module.exports = {
  Logger,
  ConfirmationHandler,
  ErrorHandler,
  PlanningHandler,
  ERROR_TYPES,
};
