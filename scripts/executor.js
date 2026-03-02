'use strict';

const { Logger, ConfirmationHandler, ErrorHandler, PlanningHandler } = require('./handlers');
const { buildConfig } = require('./config');

const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  RETRYING: 'retrying',
  PLANNING: 'planning',
  SUCCESS: 'success',
  FAILURE: 'failure',
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class ExecutionContext {
  constructor(task, config) {
    this.task = task;
    this.config = config;
    this.status = TASK_STATUS.PENDING;
    this.attempt = 0;
    this.startTime = Date.now();
    this.errors = [];
    this.subtaskResults = [];
    this.metadata = {};
  }

  elapsed() {
    return Date.now() - this.startTime;
  }

  isTimedOut() {
    return this.elapsed() > this.config.timeout;
  }

  recordError(error) {
    this.errors.push({ attempt: this.attempt, message: error.message, time: Date.now() });
  }

  toSummary() {
    return {
      task: this.task,
      status: this.status,
      attempts: this.attempt + 1,
      elapsedMs: this.elapsed(),
      errorCount: this.errors.length,
      subtaskCount: this.subtaskResults.length,
    };
  }
}

async function runSingleTask(taskName, config, logger) {
  if (config.dryRun) {
    logger.info(`[DRY RUN] Would execute task: ${taskName}`);
    return { success: true, output: `dry-run:${taskName}`, dryRun: true };
  }

  logger.debug(`Executing task: ${taskName}`);

  await sleep(10);

  const simulatedConfirmations = ['Proceed with task?', 'Continue with operation?'];
  const confirmHandler = new ConfirmationHandler(config, logger);

  for (const prompt of simulatedConfirmations) {
    if (confirmHandler.isConfirmationPrompt(prompt)) {
      const accepted = confirmHandler.handle(prompt);
      if (!accepted) {
        throw new Error(`Task aborted: user declined confirmation for "${prompt}"`);
      }
    }
  }

  return {
    success: true,
    output: `Task "${taskName}" completed successfully`,
    timestamp: new Date().toISOString(),
  };
}

async function executeWithRetry(taskName, config, logger) {
  const errorHandler = new ErrorHandler(config, logger);
  let attempt = 0;

  while (true) {
    try {
      logger.debug(`Attempt ${attempt + 1} for task: ${taskName}`);
      const result = await runSingleTask(taskName, config, logger);
      return { ...result, attempts: attempt + 1 };
    } catch (error) {
      const decision = errorHandler.handle(error, attempt);

      if (!decision.retry) {
        throw Object.assign(error, { attempts: attempt + 1 });
      }

      attempt++;
      await sleep(decision.delay);
    }
  }
}

async function executeWithPlanning(taskName, config, logger) {
  const planningHandler = new PlanningHandler(config, logger);
  const context = new ExecutionContext(taskName, config);

  context.status = TASK_STATUS.RUNNING;
  logger.info(`Starting autonomous execution of task: "${taskName}"`);

  try {
    const result = await executeWithRetry(taskName, config, logger);
    context.status = TASK_STATUS.SUCCESS;
    logger.info(`Task "${taskName}" completed in ${context.elapsed()}ms after ${result.attempts} attempt(s)`);
    return { ...result, context: context.toSummary() };
  } catch (primaryError) {
    context.recordError(primaryError);
    context.attempt = (primaryError.attempts || 1) - 1;

    if (!planningHandler.shouldPlan(taskName, context.attempt + 1)) {
      context.status = TASK_STATUS.FAILURE;
      logger.error(`Task "${taskName}" failed without decomposition: ${primaryError.message}`);
      throw primaryError;
    }

    context.status = TASK_STATUS.PLANNING;
    logger.info(`Initiating task decomposition for: "${taskName}"`);
    const subtasks = planningHandler.decompose(taskName, context.metadata);

    let allSucceeded = true;
    for (const subtask of subtasks) {
      logger.info(`Executing subtask: ${subtask}`);
      try {
        const subResult = await executeWithRetry(subtask, config, logger);
        context.subtaskResults.push({ subtask, ...subResult, success: true });
        logger.info(`Subtask "${subtask}" succeeded`);
      } catch (subError) {
        context.subtaskResults.push({ subtask, success: false, error: subError.message });
        logger.error(`Subtask "${subtask}" failed: ${subError.message}`);
        allSucceeded = false;
      }
    }

    if (allSucceeded) {
      context.status = TASK_STATUS.SUCCESS;
      logger.info(`All subtasks for "${taskName}" completed successfully`);
      return {
        success: true,
        output: `Task "${taskName}" completed via decomposition`,
        subtasks: context.subtaskResults,
        context: context.toSummary(),
      };
    } else {
      context.status = TASK_STATUS.FAILURE;
      const failedSubtasks = context.subtaskResults.filter(r => !r.success);
      const failMsg = `Task "${taskName}" failed: ${failedSubtasks.length} subtask(s) failed`;
      logger.error(failMsg);
      const err = new Error(failMsg);
      err.context = context.toSummary();
      err.subtaskResults = context.subtaskResults;
      throw err;
    }
  }
}

async function execute(options = {}) {
  const config = buildConfig(options);
  const logger = new Logger(config.verbose, config.logFile);

  if (!config.task) {
    logger.error('No task specified. Use --task <name> to specify a task.');
    logger.close();
    return null;
  }

  logger.info(`Autonomous Agent Executor started`);
  logger.info(`Task: ${config.task}`);
  logger.debug(`Config: ${JSON.stringify(config, null, 2)}`);

  try {
    const result = await executeWithPlanning(config.task, config, logger);
    logger.info('Execution completed successfully');
    logger.debug(`Result: ${JSON.stringify(result, null, 2)}`);
    logger.close();
    return result;
  } catch (error) {
    logger.error(`Execution failed: ${error.message}`);
    logger.close();
    throw error;
  }
}

module.exports = {
  execute,
  executeWithPlanning,
  executeWithRetry,
  ExecutionContext,
  TASK_STATUS,
};
