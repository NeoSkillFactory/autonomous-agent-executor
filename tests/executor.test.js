'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execute, executeWithRetry, ExecutionContext, TASK_STATUS } = require('../scripts/executor');
const { buildConfig } = require('../scripts/config');
const { Logger } = require('../scripts/handlers');

describe('executor.js', () => {
  describe('ExecutionContext', () => {
    it('should initialize with pending status', () => {
      const config = buildConfig({});
      const ctx = new ExecutionContext('test-task', config);
      assert.equal(ctx.status, TASK_STATUS.PENDING);
      assert.equal(ctx.task, 'test-task');
      assert.equal(ctx.attempt, 0);
    });

    it('should track elapsed time', () => {
      const config = buildConfig({});
      const ctx = new ExecutionContext('t', config);
      const elapsed = ctx.elapsed();
      assert.ok(elapsed >= 0);
      assert.ok(elapsed < 1000);
    });

    it('should record errors', () => {
      const config = buildConfig({});
      const ctx = new ExecutionContext('t', config);
      ctx.recordError(new Error('test error'));
      assert.equal(ctx.errors.length, 1);
      assert.equal(ctx.errors[0].message, 'test error');
    });

    it('should return a summary object', () => {
      const config = buildConfig({});
      const ctx = new ExecutionContext('t', config);
      const summary = ctx.toSummary();
      assert.equal(summary.task, 't');
      assert.ok('status' in summary);
      assert.ok('attempts' in summary);
      assert.ok('elapsedMs' in summary);
    });

    it('should detect timeout', () => {
      const config = buildConfig({});
      const ctx = new ExecutionContext('t', config);
      ctx.startTime = Date.now() - (config.timeout + 1000);
      assert.ok(ctx.isTimedOut());
    });
  });

  describe('execute()', () => {
    it('should execute a task successfully with dry-run', async () => {
      const result = await execute({ task: 'test-dry-run', dryRun: true });
      assert.ok(result);
      assert.equal(result.success, true);
      assert.equal(result.dryRun, true);
    });

    it('should return null when no task is specified', async () => {
      const result = await execute({});
      assert.equal(result, null);
    });

    it('should include context in result', async () => {
      const result = await execute({ task: 'ctx-task', dryRun: true });
      assert.ok(result.context);
      assert.equal(result.context.task, 'ctx-task');
      assert.equal(result.context.status, TASK_STATUS.SUCCESS);
    });

    it('should complete a normal task', async () => {
      const result = await execute({ task: 'simple-task' });
      assert.ok(result);
      assert.equal(result.success, true);
    });

    it('should respect verbose config', async () => {
      const result = await execute({ task: 'verbose-task', dryRun: true, verbose: true });
      assert.equal(result.success, true);
    });
  });

  describe('executeWithRetry()', () => {
    it('should succeed on first attempt', async () => {
      const config = buildConfig({ dryRun: true });
      const logger = new Logger(false, null);
      const result = await executeWithRetry('simple', config, logger);
      assert.equal(result.success, true);
      assert.equal(result.attempts, 1);
      logger.close();
    });
  });

  describe('TASK_STATUS', () => {
    it('should have all required status values', () => {
      assert.ok('PENDING' in TASK_STATUS);
      assert.ok('RUNNING' in TASK_STATUS);
      assert.ok('RETRYING' in TASK_STATUS);
      assert.ok('PLANNING' in TASK_STATUS);
      assert.ok('SUCCESS' in TASK_STATUS);
      assert.ok('FAILURE' in TASK_STATUS);
    });
  });
});
