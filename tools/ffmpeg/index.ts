#!/usr/bin/env node
import { runTool } from '../run-tool.js';

/**
 * Proxy for the `ffmpeg` CLI installed via pnpm.
 */
runTool('ffmpeg');
