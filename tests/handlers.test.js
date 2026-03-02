'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Logger, ConfirmationHandler, ErrorHandler, PlanningHandler, ERROR_TYPES } = require('../scripts/handlers');
const { DEFAULTS } = require('../scripts/config');

function makeLogger() {
  return new Logger(false, null);
}

describe('handlers.js', () => {
  describe('ConfirmationHandler', () => {
    const handler = new ConfirmationHandler(DEFAULTS, makeLogger());

    it('should detect confirmation prompts', () => {
      assert.ok(handler.isConfirmationPrompt('Are you sure?'));
      assert.ok(handler.isConfirmationPrompt('Proceed with operation?'));
      assert.ok(handler.isConfirmationPrompt('Continue?'));
      assert.ok(handler.isConfirmationPrompt('[y/n]'));
    });

    it('should not flag non-confirmation text as prompts', () => {
      assert.equal(handler.isConfirmationPrompt('Task completed'), false);
      assert.equal(handler.isConfirmationPrompt('Processing...'), false);
    });

    it('should auto-confirm when autoConfirm is true', () => {
      const result = handler.handle('Proceed?');
      assert.equal(result, true);
    });

    it('should decline when autoConfirm is false', () => {
      const h = new ConfirmationHandler({ ...DEFAULTS, autoConfirm: false }, makeLogger());
      const result = h.handle('Proceed?');
      assert.equal(result, false);
    });
  });

  describe('ErrorHandler', () => {
    const handler = new ErrorHandler(DEFAULTS, makeLogger());

    it('should classify network errors as transient', () => {
      assert.equal(handler.classify(new Error('ECONNRESET')), ERROR_TYPES.TRANSIENT);
      assert.equal(handler.classify(new Error('rate limit exceeded')), ERROR_TYPES.TRANSIENT);
    });

    it('should classify permission errors as fatal', () => {
      assert.equal(handler.classify(new Error('Permission denied')), ERROR_TYPES.FATAL);
      assert.equal(handler.classify(new Error('Access denied')), ERROR_TYPES.FATAL);
    });

    it('should classify timeout errors as timeout', () => {
      const e = new Error('Request timed out');
      e.code = 'ETIMEDOUT';
      assert.equal(handler.classify(e), ERROR_TYPES.TIMEOUT);
    });

    it('should classify unknown errors as recoverable', () => {
      assert.equal(handler.classify(new Error('Something weird happened')), ERROR_TYPES.RECOVERABLE);
    });

    it('should not retry fatal errors', () => {
      assert.equal(handler.shouldRetry(new Error('Permission denied'), 0), false);
    });

    it('should not retry when max retries reached', () => {
      const config = { ...DEFAULTS, maxRetries: 2 };
      const h = new ErrorHandler(config, makeLogger());
      assert.equal(h.shouldRetry(new Error('Network error'), 2), false);
    });

    it('should retry transient errors within limit', () => {
      assert.equal(handler.shouldRetry(new Error('ECONNRESET'), 0), true);
    });

    it('should compute delay with backoff', () => {
      const config = { retryDelay: 1000, backoffFactor: 2 };
      const h = new ErrorHandler(config, makeLogger());
      assert.equal(h.computeDelay(0), 1000);
      assert.equal(h.computeDelay(1), 2000);
      assert.equal(h.computeDelay(2), 4000);
    });

    it('should return retry decision object', () => {
      const decision = handler.handle(new Error('ECONNRESET'), 0);
      assert.equal(decision.retry, true);
      assert.ok(decision.delay >= 0);
      assert.ok(decision.type);
    });
  });

  describe('PlanningHandler', () => {
    const handler = new PlanningHandler(DEFAULTS, makeLogger());

    it('should plan after max retries exceeded', () => {
      assert.ok(handler.shouldPlan('task', DEFAULTS.maxRetries));
    });

    it('should not plan before max retries', () => {
      assert.equal(handler.shouldPlan('task', 1), false);
    });

    it('should not plan when planOnFailure is false', () => {
      const h = new PlanningHandler({ ...DEFAULTS, planOnFailure: false }, makeLogger());
      assert.equal(h.shouldPlan('task', DEFAULTS.maxRetries), false);
    });

    it('should decompose task into subtasks', () => {
      const subtasks = handler.decompose('my-task');
      assert.ok(Array.isArray(subtasks));
      assert.ok(subtasks.length > 0);
      assert.ok(subtasks.length <= DEFAULTS.maxSubtasks);
    });

    it('should respect maxSubtasks config', () => {
      const h = new PlanningHandler({ ...DEFAULTS, maxSubtasks: 2 }, makeLogger());
      const subtasks = h.decompose('my-task');
      assert.ok(subtasks.length <= 2);
    });

    it('should include task name in subtask identifiers', () => {
      const subtasks = handler.decompose('special-task');
      assert.ok(subtasks.every(s => s.includes('special-task')));
    });
  });
});
