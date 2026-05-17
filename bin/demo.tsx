#!/usr/bin/env tsx
import React from 'react';
import { render } from 'ink';
import { App } from '../src/App.js';

process.stdout.write('\x1b[?1003l');

const autoMode = process.argv.includes('--auto');
render(<App autoMode={autoMode} />, { patchConsole: false });
