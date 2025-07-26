# Contract Exports

A simple tool for flattening and exporting Solidity contracts from your Foundry project. This tool uses Foundry's built-in `forge flatten` command to create standalone contract files suitable for verification, audits, and external deployments.

## Features

- **Automatic contract discovery**: Use wildcard (`*`) to export all contracts or specify individual contracts
- **Comment removal**: Optionally remove comments while preserving SPDX license identifiers
- **Directory structure**: Choose to preserve source directory structure or flatten to a single directory
- **Foundry integration**: Leverages `forge flatten` for reliable contract flattening
- **CI/CD ready**: Integrates seamlessly with the existing ForgeRunner Makefile

## Quick Start

```bash
# Export all contracts with default settings
make export-contracts

# Or run directly
cd contract-exports && node build.js
```

## Configuration

Edit `build-config.js` to customize the export behavior:

```javascript
// List of contracts to flatten
// ['*'] = all contracts, or specify individual ones: ['Counter', 'MyToken']
const CONTRACT_NAMES = ['*'];

// Output directory (relative to contract-exports/)
const OUTPUT_DIR = '../exp-contracts';

// Remove all comments except SPDX license
const DISABLE_COMMENTS = false;

// Preserve source directory structure in output
const PRESERVE_STRUCTURE = false;
```

## Examples

### Export all contracts (default)
```javascript
const CONTRACT_NAMES = ['*'];
```
Finds and flattens all `.sol` files in `src/` (excluding test and script files).

### Export specific contracts
```javascript
const CONTRACT_NAMES = ['Counter', 'MyToken', 'Governor'];
```
Only flattens the specified contracts.

### Remove comments for verification
```javascript
const DISABLE_COMMENTS = true;
```
Strips all comments except SPDX license identifiers, useful for contract verification or reducing file size.

### Preserve directory structure
```javascript
const PRESERVE_STRUCTURE = true;
```
- `false`: `src/tokens/ERC20.sol` → `exp-contracts/ERC20.sol`
- `true`: `src/tokens/ERC20.sol` → `exp-contracts/tokens/ERC20.sol`

## Output

Flattened contracts are saved to the configured output directory (default: `exp-contracts/`):

```
exp-contracts/
├── Counter.sol
├── MyToken.sol
└── Governor.sol
```

Each flattened contract contains:
- All imported dependencies inlined
- Proper compilation order
- SPDX license identifier (preserved even with comment removal)
- All necessary code for standalone compilation

## Integration

### Makefile Commands

The tool integrates with ForgeRunner's Makefile:

```bash
make export-contracts  # Export flattened contracts
make help              # Shows all available commands including export-contracts
```

### NPM Scripts

```bash
cd contract-exports
npm run build          # Same as node build.js
npm run export         # Same as node build.js
```

## Use Cases

- **Contract verification**: Clean, comment-free contracts for Etherscan verification
- **Audits**: Standalone files for security auditors
- **External deployments**: Self-contained contracts for deployment on other chains
- **Documentation**: Flattened contracts showing all dependencies
- **CI/CD**: Automated contract export in deployment pipelines

## Requirements

- Foundry toolkit installed
- Node.js 16+ (for running the export script)
- Compiled contracts in `out/` directory (run `forge build` first)

## Technical Details

The tool:
1. Scans the `src/` directory for contracts (respects `.t.sol` and `.s.sol` exclusions)
2. Runs `forge flatten` on each contract
3. Applies post-processing (comment removal, cleanup)
4. Saves flattened contracts to the configured output directory
5. Provides detailed console output with success/failure status

Built to mirror the pattern and style of ForgeRunner's `abi-packages` tool for consistency.