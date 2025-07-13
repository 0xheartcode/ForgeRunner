const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load build configuration
const config = require('./build-config.js');

// Resolve contract names (supports wildcard '*')
const resolveContractNames = () => {
  if (config.CONTRACT_NAMES.length === 1 && config.CONTRACT_NAMES[0] === '*') {
    console.log('🔍 Using wildcard - scanning for all contracts in src/ directory');
    try {
      const srcDir = path.join(__dirname, '../src');
      const contractNames = [];
      
      // Recursive function to scan directories
      const scanDirectory = (dir) => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip interfaces directory
            if (item.name !== 'interfaces') {
              scanDirectory(fullPath);
            }
          } else if (item.isFile() && item.name.endsWith('.sol')) {
            // Extract contract name without .sol extension
            const contractName = item.name.replace('.sol', '');
            
            // Skip interface files (starting with 'I') unless ALLOW_INTERFACES is true
            if (!contractName.startsWith('I') || config.ALLOW_INTERFACES) {
              contractNames.push(contractName);
            }
          }
        }
      };
      
      scanDirectory(srcDir);
      
      // Filter out contracts that don't have compiled artifacts
      const validContracts = [];
      const contractMappings = {};
      
      for (const name of contractNames) {
        if (config.ALLOW_MISMATCHED_NAMES) {
          // Check if the output directory exists
          const outDir = path.join(__dirname, `../out/${name}.sol`);
          if (fs.existsSync(outDir)) {
            // Find JSON files that match our source file
            const jsonFiles = fs.readdirSync(outDir).filter(file => 
              file.endsWith('.json') && (!file.startsWith('I') || config.ALLOW_INTERFACES)
            );
            
            if (jsonFiles.length > 0) {
              // Map source filename to actual contract name(s)
              for (const jsonFile of jsonFiles) {
                const contractName = jsonFile.replace('.json', '');
                validContracts.push(contractName);
                contractMappings[contractName] = {
                  sourceFile: name,
                  jsonPath: path.join(outDir, jsonFile)
                };
              }
            }
          }
        } else {
          // Original logic - exact name match
          const jsonPath = path.join(__dirname, `../out/${name}.sol/${name}.json`);
          if (fs.existsSync(jsonPath)) {
            validContracts.push(name);
            contractMappings[name] = {
              sourceFile: name,
              jsonPath: jsonPath
            };
          }
        }
      }
      
      console.log(`📋 Found ${validContracts.length} contracts in src/: ${validContracts.join(', ')}`);
      return { validContracts, contractMappings };
    } catch (e) {
      console.warn('⚠️  Could not scan src/ directory, falling back to configured contracts');
      const fallbackContracts = config.CONTRACT_NAMES.filter(name => name !== '*');
      const fallbackMappings = {};
      fallbackContracts.forEach(contract => {
        fallbackMappings[contract] = {
          sourceFile: contract,
          jsonPath: path.join(__dirname, `../out/${contract}.sol/${contract}.json`)
        };
      });
      return { validContracts: fallbackContracts, contractMappings: fallbackMappings };
    }
  }
  
  // Handle non-wildcard mode
  const contractNames = config.CONTRACT_NAMES;
  const contractMappings = {};
  contractNames.forEach(contract => {
    contractMappings[contract] = {
      sourceFile: contract,
      jsonPath: path.join(__dirname, `../out/${contract}.sol/${contract}.json`)
    };
  });
  return { validContracts: contractNames, contractMappings };
};

// Get git metadata for traceability
const getGitMetadata = () => {
  try {
    const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const gitCommitShort = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    
    return {
      gitCommit,
      gitCommitShort
    };
  } catch (e) {
    console.warn('⚠️  Could not get git metadata:', e.message);
    return {
      gitCommit: 'unknown',
      gitCommitShort: 'unknown'
    };
  }
};

// Read package configuration
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const packageName = packageJson.name;
const packageScope = packageName.split('/')[0];
const packageShortName = packageName.split('/')[1] || packageName;

// Get current git branch and modify version accordingly
const getCurrentBranch = () => {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.warn('⚠️  Could not determine git branch, using default version');
    return 'main';
  }
};

const currentBranch = getCurrentBranch();
// Extract base version (remove any existing branch suffix)
const baseVersion = packageJson.version.split('-')[0];
const packageVersion = currentBranch === 'main' ? baseVersion : `${baseVersion}-${currentBranch}`;

// Determine npm dist tag
const distTag = currentBranch === 'main' ? 'latest' : currentBranch;

// Get git metadata
const gitMetadata = getGitMetadata();

// Resolve which contracts to include
const { validContracts: CONTRACT_NAMES, contractMappings } = resolveContractNames();
const deployments = config.deployments;

console.log(`📦 Building package version: ${packageVersion} (branch: ${currentBranch})`);
console.log(`🏷️  Dist tag: ${distTag}`);
console.log(`🔗 Git commit: ${gitMetadata.gitCommitShort}`);

// Update package.json with the new version and git metadata
const updatedPackageJson = { 
  ...packageJson, 
  version: packageVersion,
  gitMetadata: {
    commit: gitMetadata.gitCommit,
    commitShort: gitMetadata.gitCommitShort
  }
};
fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(updatedPackageJson, null, 2));

// Extract organization/project name from package name for display
const displayName = packageScope.replace('@', '').split('-').map(word => 
  word.charAt(0).toUpperCase() + word.slice(1)
).join(' ');

// Utility function to format function signature from ABI
const formatFunctionSignature = (functionABI) => {
  if (!functionABI || functionABI.type !== 'function') {
    return '';
  }

  const name = functionABI.name;
  
  // Format inputs
  const inputs = functionABI.inputs || [];
  const inputsStr = inputs.map(input => {
    const paramName = input.name || '_param';
    return `${input.type} ${paramName}`;
  }).join(', ');
  
  // Format outputs
  const outputs = functionABI.outputs || [];
  const outputsStr = outputs.length > 0 
    ? ` returns (${outputs.map(output => output.type).join(', ')})`
    : '';
  
  // Add state mutability if relevant
  const stateMutability = functionABI.stateMutability;
  const modifierStr = (stateMutability && ['view', 'pure', 'payable'].includes(stateMutability))
    ? ` ${stateMutability}`
    : '';

  return `${name}(${inputsStr})${modifierStr}${outputsStr}`;
};

// Utility function to compare ABIs
const compareABIs = (oldABI, newABI, contractName) => {
  const changes = {
    added: [],
    removed: [],
    modified: []
  };

  if (!oldABI) {
    // For new contracts, show all functions as added
    const allFunctions = newABI.filter(item => item.type === 'function');
    changes.added = allFunctions.map(func => formatFunctionSignature(func));
    return { isNew: true, changes };
  }

  const oldFunctions = oldABI.filter(item => item.type === 'function');
  const newFunctions = newABI.filter(item => item.type === 'function');

  // Find added functions (in new but not in old)
  newFunctions.forEach(newFunc => {
    const exists = oldFunctions.find(oldFunc => oldFunc.name === newFunc.name);
    if (!exists) {
      changes.added.push(formatFunctionSignature(newFunc));
    }
  });

  // Find removed functions (in old but not in new)
  oldFunctions.forEach(oldFunc => {
    const exists = newFunctions.find(newFunc => newFunc.name === oldFunc.name);
    if (!exists) {
      changes.removed.push(formatFunctionSignature(oldFunc));
    }
  });

  // Find modified functions (same name but different signature)
  oldFunctions.forEach(oldFunc => {
    const newFunc = newFunctions.find(f => f.name === oldFunc.name);
    if (newFunc && JSON.stringify(oldFunc) !== JSON.stringify(newFunc)) {
      const oldSig = formatFunctionSignature(oldFunc);
      const newSig = formatFunctionSignature(newFunc);
      changes.modified.push({ oldSignature: oldSig, newSignature: newSig });
    }
  });

  return { isNew: false, changes };
};

// Function to get previous package version ABIs using git history
const getPreviousABIs = () => {
  try {
    // Find the latest published version tag in current branch's git history
    const getBaselineVersion = () => {
      try {
        const latestTag = execSync('git tag --merged HEAD | sort -V | tail -1', { encoding: 'utf8' }).trim();
        if (latestTag && latestTag.startsWith('v')) {
          return latestTag.replace('v', '');
        }
        return '0.0.0'; // No tags in history = first version
      } catch (e) {
        return '0.0.0';
      }
    };

    const baselineVersion = getBaselineVersion();
    
    if (baselineVersion === '0.0.0') {
      console.log('📝 No previous version found in git history, treating all contracts as new');
      return {};
    }
    
    console.log(`📝 Comparing against baseline version ${baselineVersion} from git history`);
    const previousABIs = {};
    
    // Try to download and extract the previous package
    const tempDir = require('os').tmpdir();
    
    try {
      // Download the previous package using the baseline version
      execSync(`npm pack ${packageName}@${baselineVersion} --pack-destination ${tempDir}`, { stdio: 'pipe' });
      
      // Generate expected filename from package name
      // @scope/name becomes scope-name-version.tgz
      const expectedFilename = packageName.replace('@', '').replace('/', '-') + `-${baselineVersion}.tgz`;
      
      // Find the downloaded file
      const files = require('fs').readdirSync(tempDir);
      let packageFile = files.find(f => f === expectedFilename);
      
      // Fallback: just find any .tgz file that contains the version
      if (!packageFile) {
        packageFile = files.find(f => f.endsWith('.tgz') && f.includes(baselineVersion));
      }
      
      // Last resort: any .tgz file
      if (!packageFile) {
        packageFile = files.find(f => f.endsWith('.tgz'));
      }
      
      console.log(`📝 Selected package file: ${packageFile || 'none found'}`);
      
      if (packageFile) {
        const actualPackagePath = require('path').join(tempDir, packageFile);
        
        // Extract it
        const extractDir = require('path').join(tempDir, `extracted-package-${Date.now()}`);
        execSync(`mkdir -p ${extractDir} && tar -xf ${actualPackagePath} -C ${extractDir} --strip-components=1`, { stdio: 'pipe' });
        
        // Read ABIs from the extracted package
        const distPath = require('path').join(extractDir, 'dist');
        if (require('fs').existsSync(distPath)) {
          const files = require('fs').readdirSync(distPath);
          files.forEach(file => {
            if (file.endsWith('ABI.json')) {
              try {
                const contractName = file.replace('ABI.json', '');
                const abiContent = require('fs').readFileSync(require('path').join(distPath, file), 'utf8');
                previousABIs[contractName] = JSON.parse(abiContent);
              } catch (e) {
                // Skip invalid files
              }
            }
          });
        }
        
        console.log(`📝 Found ${Object.keys(previousABIs).length} contracts in baseline version`);
        
        // Cleanup
        try {
          require('fs').unlinkSync(actualPackagePath);
          execSync(`rm -rf ${extractDir}`, { stdio: 'pipe' });
        } catch (e) {
          // Ignore cleanup errors
        }
        
      } else {
        console.log(`⚠️  Could not find package file for version ${baselineVersion}`);
      }
      
    } catch (e) {
      console.log(`⚠️  Could not download baseline package v${baselineVersion}: ${e.message}`);
      return {};
    }
    
    return previousABIs;
  } catch (e) {
    console.log(`⚠️  Error getting previous ABIs: ${e.message}`);
    return {};
  }
};

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

// Track successfully processed contracts and failures
const successfulContracts = [];
const failedContracts = [];

CONTRACT_NAMES.forEach(contract => {
  const mapping = contractMappings[contract];
  if (!mapping) {
    failedContracts.push({ contract, reason: 'No mapping found' });
    console.error(`❌ Failed to process ${contract}: No mapping found`);
    return;
  }
  
  const contractPath = mapping.jsonPath;
  
  try {
    // Extract just the ABI
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const abi = contractData.abi;
    
    // Save ABI to dist with ABI suffix
    fs.writeFileSync(
      path.join(distDir, `${contract}ABI.json`),
      JSON.stringify(abi, null, 2)
    );
    
    // Track successful contract
    successfulContracts.push(contract);
    
    console.log(`✅ Extracted ABI for ${contract}ABI`);
  } catch (e) {
    // Track failed contract with simplified reason
    const reason = e.code === 'ENOENT' ? 'Contract not found' : e.message;
    failedContracts.push({ contract, reason });
    console.error(`❌ Failed to process ${contract}: ${reason}`);
  }
});

// Save deployments
fs.writeFileSync(
  path.join(distDir, 'deployments.json'),
  JSON.stringify(deployments, null, 2)
);

// Save build metadata
const buildInfo = {
  packageName,
  packageVersion,
  distTag,
  gitCommit: gitMetadata.gitCommit,
  gitCommitShort: gitMetadata.gitCommitShort
};

fs.writeFileSync(
  path.join(distDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

// Generate TypeScript and JavaScript index files
const generateIndexFile = () => {
  const indexContent = `// Auto-generated exports for ${displayName} smart contracts
${successfulContracts.map(contract => 
  `export { default as ${contract}ABI } from './${contract}ABI.json';`
).join('\n')}

export { default as deployments } from './deployments.json';
export { default as buildInfo } from './build-info.json';

// Type definitions
export interface Deployment {
  [network: string]: {
    [contractName: string]: string;
  };
}

export type ContractABI = any[];
`;

  // Write TypeScript file
  fs.writeFileSync(path.join(distDir, 'index.ts'), indexContent);

  // Generate JavaScript file for Node.js compatibility
  const jsContent = `// Auto-generated exports for ${displayName} smart contracts
${successfulContracts.map(contract => 
  `exports.${contract}ABI = require('./${contract}ABI.json');`
).join('\n')}

exports.deployments = require('./deployments.json');
`;

  fs.writeFileSync(path.join(distDir, 'index.js'), jsContent);

  // Compile TypeScript for .d.ts files
  try {
    execSync('npx --package=typescript tsc index.ts --declaration --emitDeclarationOnly --resolveJsonModule --esModuleInterop --target ES2020 --module commonjs --outDir .', { 
      cwd: distDir,
      stdio: 'pipe'
    });
    console.log('✅ Generated TypeScript declarations');
  } catch (e) {
    console.warn('⚠️  TypeScript compilation failed:', e.message);
    console.warn('Package will be published without .d.ts files');
  }
};

// Generate README with contract info
const generateReadme = (changelogContent = '') => {
  const contractList = successfulContracts.map(contract => `- \`${contract}ABI\``).join('\n');
  
  const deploymentList = Object.entries(deployments)
    .map(([network, contracts]) => {
      const contractEntries = Object.entries(contracts)
        .map(([name, address]) => `  - **${name}**: \`${address}\``)
        .join('\n');
      return `### ${network}\n${contractEntries}`;
    })
    .join('\n\n');

  const usageImports = successfulContracts.map(contract => `  ${contract}ABI`).join(',\n');
  
  // Add failed contracts section if any failures occurred
  const failedContractsSection = failedContracts.length > 0 ? `
## Failed Contracts

The following contracts could not be processed:

${failedContracts.map(({ contract, reason }) => `- \`${contract}\`: ${reason}`).join('\n')}

` : '';

  const readmeContent = `# ${displayName} Smart Contracts ABI
## ${packageScope}

Smart Contract ABIs and deployment addresses for ${displayName} protocol.

## Installation

\`\`\`bash
echo "${packageScope}:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken={GITHUB_PAT_TOKEN}" >> .npmrc
npm install ${packageName}@${distTag}
\`\`\`

## Alternative Installation Methods

\`\`\`bash
# Install specific version
npm install ${packageName}@${packageVersion}

# Install latest main branch
npm install ${packageName}@latest

# Install latest of this branch
npm install ${packageName}@${distTag}
\`\`\`

## Contracts

${contractList}

## Deployment Addresses

${deploymentList}

${failedContractsSection}${(() => {
  if (!changelogContent) return '';
  
  // Count lines in changelog content
  const changelogLines = changelogContent.split('\n').length;
  
  if (changelogLines <= 200) {
    // Show full changelog inline (GitHub packages can handle up to 200 lines)
    return `## Recent Changes\n\n${changelogContent}\n`;
  } else {
    // Truncate to first 180 lines to stay under 200 total
    const lines = changelogContent.split('\n');
    const truncated = lines.slice(0, 180).join('\n');
    return `## Recent Changes\n\n${truncated}\n\n... (changelog truncated - see CHANGELOG.md in package for complete history)\n`;
  }
})()}
## Usage

\`\`\`typescript
import { 
${usageImports},
  deployments 
} from '${packageName}';

// Example with ethers.js
const contract = new ethers.Contract(
  deployments["Testnet"].CounterCA,
  CounterABI,
  provider
);
\`\`\`

---

*This package is automatically generated from the smart contract compilation artifacts.*
`;

  fs.writeFileSync(path.join(distDir, 'README.md'), readmeContent);
};

// Generate changelog if this is a release
const generateChangelog = () => {
  const previousABIs = getPreviousABIs();
  const changes = {};
  
  successfulContracts.forEach(contract => {
    const abiPath = path.join(distDir, `${contract}ABI.json`);
    if (fs.existsSync(abiPath)) {
      const currentABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      const comparison = compareABIs(previousABIs[contract], currentABI, contract);
      if (comparison.isNew || comparison.changes.added.length > 0 || 
          comparison.changes.removed.length > 0 || comparison.changes.modified.length > 0) {
        changes[contract] = comparison;
      }
    }
  });

  // Check for removed contracts
  Object.keys(previousABIs).forEach(contract => {
    if (!successfulContracts.includes(contract)) {
      changes[contract] = { isRemoved: true };
    }
  });

  let changelogContent = '';
  
  // Only generate changelog if we successfully got previous ABIs
  if (Object.keys(previousABIs).length > 0 && Object.keys(changes).length > 0) {
    // Get the baseline version for the changelog header
    const getBaselineVersion = () => {
      try {
        const latestTag = execSync('git tag --merged HEAD | sort -V | tail -1', { encoding: 'utf8' }).trim();
        return latestTag || 'initial';
      } catch (e) {
        return 'initial';
      }
    };

    const baselineVersion = getBaselineVersion();
    let changelog = `# Changelog\n\n## Changes since ${baselineVersion}\n\n`;
    let readmeChangelog = `### Changes since ${baselineVersion}\n\n`;
    
    Object.entries(changes).forEach(([contract, change]) => {
      if (change.isRemoved) {
        changelog += `### ❌ ${contract}\n- **Contract removed**\n\n`;
        readmeChangelog += `- **${contract}**: Contract removed\n`;
      } else if (change.isNew) {
        changelog += `### ✨ ${contract} (New Contract)\n`;
        readmeChangelog += `- **${contract}**: New contract added`;
        if (change.changes.added.length > 0) {
          changelog += `- **Added functions**:\n`;
          change.changes.added.forEach(signature => {
            changelog += `  - \`${signature}\`\n`;
          });
          readmeChangelog += ` with ${change.changes.added.length} functions`;
        }
        changelog += '\n';
        readmeChangelog += '\n';
      } else {
        changelog += `### 🔄 ${contract}\n`;
        readmeChangelog += `- **${contract}**: `;
        const changeTypes = [];
        
        if (change.changes.added.length > 0) {
          changelog += `- **Added functions**:\n`;
          change.changes.added.forEach(signature => {
            changelog += `  - \`${signature}\`\n`;
          });
          changeTypes.push(`Added ${change.changes.added.length} functions`);
        }
        
        if (change.changes.removed.length > 0) {
          changelog += `- **Removed functions**:\n`;
          change.changes.removed.forEach(signature => {
            changelog += `  - \`${signature}\`\n`;
          });
          changeTypes.push(`Removed ${change.changes.removed.length} functions`);
        }
        
        if (change.changes.modified.length > 0) {
          changelog += `- **Modified functions**:\n`;
          change.changes.modified.forEach(modification => {
            changelog += `  - \`${modification.oldSignature}\` → \`${modification.newSignature}\`\n`;
          });
          changeTypes.push(`Modified ${change.changes.modified.length} functions`);
        }
        
        readmeChangelog += changeTypes.join('; ') + '\n';
        changelog += '\n';
      }
    });

    fs.writeFileSync(path.join(distDir, 'CHANGELOG.md'), changelog);
    
    // Return the detailed changelog for README (will be truncated if too long)
    changelogContent = changelog.replace('# Changelog\n\n## Changes since', 'Changes since').replace(/^\n+/, '');
    console.log('📝 Generated changelog with ABI changes');
  } else if (Object.keys(previousABIs).length === 0) {
    console.log('📝 No previous version available for comparison, showing as new package');
    changelogContent = 'This is the first version of this package. All contracts are new.';
  } else {
    console.log('📝 No ABI changes detected');
    // Get the baseline version for the changelog header
    const getBaselineVersion = () => {
      try {
        const latestTag = execSync('git tag --merged HEAD | sort -V | tail -1', { encoding: 'utf8' }).trim();
        return latestTag || 'previous version';
      } catch (e) {
        return 'previous version';
      }
    };
    
    const baselineVersion = getBaselineVersion();
    changelogContent = `Changes since ${baselineVersion}\n\nNo changes detected - all contracts remain unchanged.`;
  }
  
  return changelogContent;
};

generateIndexFile();
const changelogContent = config.ALLOW_CHANGELOG ? generateChangelog() : (() => {
  console.log('📝 Changelog generation disabled (ALLOW_CHANGELOG=false)');
  return '';
})();
generateReadme(changelogContent);

console.log('🚀 Build completed!');
console.log('');
console.log('📋 Next steps:');
console.log(`   npm publish --tag ${distTag}  # To publish this package`);
console.log(`   npm install ${packageName}@${distTag}  # To install this version`);

