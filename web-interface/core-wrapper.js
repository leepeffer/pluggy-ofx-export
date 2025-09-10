// CommonJS wrapper for the core package
const { execSync } = require('child_process');
const path = require('path');

// Import the core package using tsx
let Client;
let coreExports;

try {
    // Use tsx to load the TypeScript module
    const corePath = path.join(__dirname, '..', 'packages', 'core', 'src', 'index.ts');
    coreExports = require('tsx/cjs').register()(corePath);
    Client = coreExports.Client;
} catch (error) {
    console.error('Error loading core package:', error);
    throw error;
}

module.exports = {
    Client
};
