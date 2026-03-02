'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildConfig, validate, DEFAULTS } = require('../scripts/config');

describe('config.js', () => {
  describe('DEFAULTS', () => {
    it('should have all expected default keys', () => {
      assert.ok('autoConfirm' in DEFAULTS);
      assert.ok('maxRetries' in DEFAULTS);
      assert.ok('retryDelay' in DEFAULTS);
      assert.ok('backoffFactor' in DEFAULTS);
      assert.ok('timeout' in DEFAULTS);
      assert.ok('planOnFailure' in DEFAULTS);
      assert.ok('maxSubtasks' in DEFAULTS);
      assert.ok('verbose' in DEFAULTS);
      assert.ok('logFile' in DEFAULTS);
      assert.ok('dryRun' in DEFAULTS);
    });

    it('should have correct default values', () => {
      assert.equal(DEFAULTS.autoConfirm, true);
      assert.equal(DEFAULTS.maxRetries, 3);
      assert.equal(DEFAULTS.retryDelay, 1000);
      assert.equal(DEFAULTS.backoffFactor, 2);
      assert.equal(DEFAULTS.timeout, 30000);
      assert.equal(DEFAULTS.planOnFailure, true);
      assert.equal(DEFAULTS.maxSubtasks, 5);
      assert.equal(DEFAULTS.verbose, false);
      assert.equal(DEFAULTS.logFile, null);
      assert.equal(DEFAULTS.dryRun, false);
    });
  });

  describe('buildConfig()', () => {
    it('should return defaults when called with empty args', () => {
      const config = buildConfig({});
      assert.equal(config.maxRetries, 3);
      assert.equal(config.autoConfirm, true);
      assert.equal(config.verbose, false);
    });

    it('should override defaults with provided values', () => {
      const config = buildConfig({ maxRetries: 7, verbose: true });
      assert.equal(config.maxRetries, 7);
      assert.equal(config.verbose, true);
      assert.equal(config.autoConfirm, true);
    });

    it('should coerce string numbers to actual numbers', () => {
      const config = buildConfig({ maxRetries: '5' });
      assert.equal(typeof config.maxRetries, 'number');
      assert.equal(config.maxRetries, 5);
    });

    it('should throw on invalid number range', () => {
      assert.throws(() => buildConfig({ maxRetries: 200 }), /must be <= 100/);
    });

    it('should throw on negative retryDelay', () => {
      assert.throws(() => buildConfig({ retryDelay: -1 }), /must be >= 0/);
    });
  });

  describe('validate()', () => {
    it('should pass through valid config unchanged', () => {
      const input = { maxRetries: 5, verbose: true };
      const result = validate(input);
      assert.equal(result.maxRetries, 5);
      assert.equal(result.verbose, true);
    });

    it('should ignore unknown keys', () => {
      const result = validate({ unknown: 'value', maxRetries: 2 });
      assert.ok(!('unknown' in result));
      assert.equal(result.maxRetries, 2);
    });
  });
});
