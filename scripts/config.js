'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  autoConfirm: true,
  maxRetries: 3,
  retryDelay: 1000,
  backoffFactor: 2,
  timeout: 30000,
  planOnFailure: true,
  maxSubtasks: 5,
  verbose: false,
  logFile: null,
  dryRun: false,
};

const SCHEMA = {
  autoConfirm: { type: 'boolean' },
  maxRetries: { type: 'number', min: 0, max: 100 },
  retryDelay: { type: 'number', min: 0, max: 60000 },
  backoffFactor: { type: 'number', min: 1, max: 10 },
  timeout: { type: 'number', min: 1000, max: 600000 },
  planOnFailure: { type: 'boolean' },
  maxSubtasks: { type: 'number', min: 1, max: 20 },
  verbose: { type: 'boolean' },
  logFile: { type: 'string', nullable: true },
  dryRun: { type: 'boolean' },
  task: { type: 'string', nullable: true },
};

function validateField(key, value, rule) {
  if (value === null || value === undefined) {
    if (rule.nullable) return null;
    throw new Error(`Config field "${key}" cannot be null`);
  }
  if (rule.type === 'boolean' && typeof value !== 'boolean') {
    throw new Error(`Config field "${key}" must be a boolean, got ${typeof value}`);
  }
  if (rule.type === 'number') {
    const n = Number(value);
    if (isNaN(n)) throw new Error(`Config field "${key}" must be a number, got "${value}"`);
    if (rule.min !== undefined && n < rule.min) {
      throw new Error(`Config field "${key}" must be >= ${rule.min}, got ${n}`);
    }
    if (rule.max !== undefined && n > rule.max) {
      throw new Error(`Config field "${key}" must be <= ${rule.max}, got ${n}`);
    }
    return n;
  }
  if (rule.type === 'string' && typeof value !== 'string') {
    throw new Error(`Config field "${key}" must be a string, got ${typeof value}`);
  }
  return value;
}

function validate(config) {
  const result = {};
  for (const [key, rule] of Object.entries(SCHEMA)) {
    if (key in config) {
      result[key] = validateField(key, config[key], rule);
    }
  }
  return result;
}

function loadFromFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Config file not found: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in config file "${resolved}": ${e.message}`);
  }
  return parsed;
}

function mergeConfigs(...sources) {
  return Object.assign({}, ...sources.filter(Boolean));
}

function buildConfig(cliArgs = {}, envOverrides = {}) {
  let fileConfig = {};
  if (cliArgs.config) {
    fileConfig = loadFromFile(cliArgs.config);
  }

  const merged = mergeConfigs(DEFAULTS, fileConfig, envOverrides, cliArgs);
  const validated = validate(merged);

  return mergeConfigs(DEFAULTS, validated);
}

module.exports = { buildConfig, validate, loadFromFile, DEFAULTS };
