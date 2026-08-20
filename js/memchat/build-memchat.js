#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const sourceDir = path.join(root, 'js', 'memchat');
const srcDir = path.join(sourceDir, 'src');
const output = path.join(root, 'js', 'memchat.user.js');
const metadataPath = path.join(sourceDir, 'metadata.user.js');
const metadata = fs.readFileSync(metadataPath, 'utf8').trim();
const moduleFiles = [
    '01-config-and-state.js',
    '02-storage-and-transport.js',
    '03-chat.js',
    '04-hatiko.js',
    '05-calculator.js',
    '06-schedule.js',
    '07-settings-panels.js',
    '08-clear-and-actions.js',
    '09-ui.js',
    '10-events-and-init.js',
];

const missing = moduleFiles.filter(file => !fs.existsSync(path.join(srcDir, file)));
if (missing.length) {
    throw new Error(`Missing source modules: ${missing.join(', ')}`);
}

const modules = moduleFiles.map(file => {
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8').trim();
    return `\n\n/* ===== ${file} ===== */\n\n${content}`;
}).join('');

fs.writeFileSync(output, `${metadata}\n${modules}\n\n// ─── Production entrypoint ───────────────────────────────────────────────────\ninitialize();\n`, 'utf8');
console.log(`Built ${path.relative(root, output)} from ${moduleFiles.length} local modules`);
