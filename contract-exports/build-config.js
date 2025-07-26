/**
 * Build Configuration for contract-exports
 * 
 * Controls which contracts are flattened and exported.
 * Flattened contracts are useful for verification, audits, and external deployments.
 */

// List of specific contracts to flatten
// Set to ['*'] to scan src/ directory recursively for ALL contracts
// Example: ['Counter', 'MyToken'] for specific contracts
const CONTRACT_NAMES = ['*'];

// Output directory for flattened contracts
// Relative to contract-exports/ directory
const OUTPUT_DIR = '../exp-contracts';

// Remove all comments from flattened output
// Useful for reducing file size and cleaner verification
const DISABLE_COMMENTS = false;

// Preserve original directory structure in output
// true:  src/tokens/MyToken.sol → exp-contracts/tokens/MyToken.sol
// false: src/tokens/MyToken.sol → exp-contracts/MyToken.sol
const PRESERVE_STRUCTURE = false;

module.exports = {
  CONTRACT_NAMES,
  OUTPUT_DIR,
  DISABLE_COMMENTS,
  PRESERVE_STRUCTURE
};