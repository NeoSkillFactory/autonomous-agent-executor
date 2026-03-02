'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../scripts/cli');

describe('cli.js', () => {
  describe('parseArgs()', () => {
    function parse(args) {
      return parseArgs(['node', 'cli.js', ...args]);
    }

    it('should parse --task', () => {
      const result = parse(['--task', 'my-task']);
      assert.equal(result.task, 'my-task');
    });

    it('should parse --max-retries', () => {
      const result = parse(['--max-retries', '5']);
      assert.equal(result.maxRetries, 5);
    });

    it('should parse --retry-delay', () => {
      const result = parse(['--retry-delay', '2000']);
      assert.equal(result.retryDelay, 2000);
    });

    it('should parse --backoff-factor', () => {
      const result = parse(['--backoff-factor', '1.5']);
      assert.equal(result.backoffFactor, 1.5);
    });

    it('should parse --timeout', () => {
      const result = parse(['--timeout', '60000']);
      assert.equal(result.timeout, 60000);
    });

    it('should parse --max-subtasks', () => {
      const result = parse(['--max-subtasks', '3']);
      assert.equal(result.maxSubtasks, 3);
    });

    it('should set autoConfirm=true with --auto-confirm', () => {
      const result = parse(['--auto-confirm']);
      assert.equal(result.autoConfirm, true);
    });

    it('should set autoConfirm=false with --no-auto-confirm', () => {
      const result = parse(['--no-auto-confirm']);
      assert.equal(result.autoConfirm, false);
    });

    it('should set planOnFailure=true with --plan-on-failure', () => {
      const result = parse(['--plan-on-failure']);
      assert.equal(result.planOnFailure, true);
    });

    it('should set planOnFailure=false with --no-plan-on-failure', () => {
      const result = parse(['--no-plan-on-failure']);
      assert.equal(result.planOnFailure, false);
    });

    it('should parse --verbose', () => {
      const result = parse(['--verbose']);
      assert.equal(result.verbose, true);
    });

    it('should parse --dry-run', () => {
      const result = parse(['--dry-run']);
      assert.equal(result.dryRun, true);
    });

    it('should parse --log-file', () => {
      const result = parse(['--log-file', '/tmp/test.log']);
      assert.equal(result.logFile, '/tmp/test.log');
    });

    it('should parse --config', () => {
      const result = parse(['--config', '/tmp/config.json']);
      assert.equal(result.config, '/tmp/config.json');
    });

    it('should handle multiple flags together', () => {
      const result = parse(['--task', 'my-task', '--max-retries', '5', '--verbose', '--dry-run']);
      assert.equal(result.task, 'my-task');
      assert.equal(result.maxRetries, 5);
      assert.equal(result.verbose, true);
      assert.equal(result.dryRun, true);
    });

    it('should return empty object for no args', () => {
      const result = parse([]);
      assert.deepEqual(result, {});
    });
  });
});
