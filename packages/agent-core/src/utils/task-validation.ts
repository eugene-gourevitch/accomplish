import path from 'path';
import os from 'os';
import type { TaskConfig } from '../common/types/task.js';
import { sanitizeString } from './sanitize.js';

/**
 * Checks that a working directory is within allowed base paths
 * (user home directory or OS temp directory) to prevent path traversal.
 */
function isAllowedWorkingDirectory(dir: string): boolean {
  const resolved = path.resolve(dir);
  const homeDir = os.homedir();
  const tempDir = os.tmpdir();
  const allowed = [homeDir, tempDir];
  return allowed.some((base) => resolved === base || resolved.startsWith(base + path.sep));
}

/**
 * Validates and sanitizes a TaskConfig object.
 * Ensures all fields are properly typed, trimmed, and within length limits.
 *
 * @param config - The task configuration to validate
 * @returns A sanitized TaskConfig with all fields validated
 */
export function validateTaskConfig(config: TaskConfig): TaskConfig {
  const prompt = sanitizeString(config.prompt, 'prompt');
  const validated: TaskConfig = { prompt };

  if (config.taskId) {
    validated.taskId = sanitizeString(config.taskId, 'taskId', 128);
  }
  if (config.sessionId) {
    validated.sessionId = sanitizeString(config.sessionId, 'sessionId', 128);
  }
  if (config.workingDirectory) {
    validated.workingDirectory = sanitizeString(config.workingDirectory, 'workingDirectory', 1024);
    if (!isAllowedWorkingDirectory(validated.workingDirectory)) {
      throw new Error(
        `workingDirectory must be within the user home or temp directory, got: ${validated.workingDirectory}`,
      );
    }
  }
  if (Array.isArray(config.allowedTools)) {
    validated.allowedTools = config.allowedTools
      .filter((tool): tool is string => typeof tool === 'string')
      .map((tool) => sanitizeString(tool, 'allowedTools', 64))
      .slice(0, 20);
  }
  if (config.systemPromptAppend) {
    validated.systemPromptAppend = sanitizeString(config.systemPromptAppend, 'systemPromptAppend');
  }
  if (config.outputSchema && typeof config.outputSchema === 'object') {
    validated.outputSchema = config.outputSchema;
  }

  return validated;
}
