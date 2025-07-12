/**
 * Build Configuration for @0xheartcode/forgerunner-abis package
 * 
 * This file contains the contracts and deployment addresses that will be included
 * in the generated npm package. Modify this file to add/remove contracts or update
 * deployment addresses.
 */

// List of specific contracts to include
// Set to ['*'] to scan src/ directory recursively for ALL contracts (excludes interfaces)
// Example: List specific contracts
// const CONTRACT_NAMES = ["Counter"];

// Default: Use wildcard to scan src/ for ALL contracts
const CONTRACT_NAMES = ['*'];

// Allow mismatched contract names (filename vs contract name inside file)
// When true, scans compiled artifacts to find actual contract names
const ALLOW_MISMATCHED_NAMES = false;

// Allow interfaces to be included in the ABI package
// When true, includes interface files (starting with 'I') in the build
const ALLOW_INTERFACES = false;

// Deployment addresses for each network
const deployments = {
  "Testnet": {
    "CounterCA": "0x1234567890123456789012345678901234567890",
  }
};

module.exports = {
  CONTRACT_NAMES,
  deployments,
  ALLOW_MISMATCHED_NAMES,
  ALLOW_INTERFACES
};
