#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Starting build process for Render...');

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Compile TypeScript
  console.log('Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}