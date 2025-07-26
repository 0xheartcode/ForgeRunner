#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./build-config');

// Console colors for better output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function removeComments(content) {
  if (!config.DISABLE_COMMENTS) return content;
  
  // Remove single-line comments (but preserve SPDX license)
  content = content.replace(/\/\/(?!.*SPDX-License-Identifier).*/g, '');
  
  // Remove multi-line comments (but preserve SPDX license)
  content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    if (match.includes('SPDX-License-Identifier')) {
      return match;
    }
    return '';
  });
  
  // Clean up extra whitespace but preserve line structure
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  content = content.replace(/^\s*$/gm, ''); // Remove empty lines
  content = content.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  
  return content;
}

function findContracts() {
  const srcDir = path.resolve(__dirname, '../src');
  
  if (config.CONTRACT_NAMES.includes('*')) {
    // Scan src/ directory for all .sol files
    const contracts = [];
    
    function scanDirectory(dir, relativePath = '') {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath, path.join(relativePath, file));
        } else if (file.endsWith('.sol') && !file.endsWith('.t.sol') && !file.endsWith('.s.sol')) {
          const contractName = file.replace('.sol', '');
          const relativeContractPath = path.join(relativePath, file);
          contracts.push({
            name: contractName,
            file: file,
            path: relativeContractPath,
            fullPath: filePath
          });
        }
      }
    }
    
    scanDirectory(srcDir);
    return contracts;
  } else {
    // Use specific contract names
    return config.CONTRACT_NAMES.map(name => {
      const file = `${name}.sol`;
      const fullPath = path.join(srcDir, file);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Contract ${file} not found in src/`);
      }
      
      return {
        name: name,
        file: file,
        path: file,
        fullPath: fullPath
      };
    });
  }
}

function flattenContract(contract) {
  log(`🔧 Flattening ${contract.name}...`, 'cyan');
  
  try {
    // Run forge flatten on the contract
    const command = `forge flatten src/${contract.path}`;
    const output = execSync(command, { 
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8'
    });
    
    // Process the output
    let processedOutput = removeComments(output);
    
    return processedOutput;
  } catch (error) {
    log(`❌ Failed to flatten ${contract.name}: ${error.message}`, 'red');
    throw error;
  }
}

function saveContract(contract, content) {
  const outputDir = path.resolve(__dirname, config.OUTPUT_DIR);
  
  let outputPath;
  if (config.PRESERVE_STRUCTURE) {
    // Preserve directory structure
    const contractDir = path.dirname(contract.path);
    const fullOutputDir = path.join(outputDir, contractDir);
    fs.mkdirSync(fullOutputDir, { recursive: true });
    outputPath = path.join(fullOutputDir, contract.file);
  } else {
    // Flatten to root output directory
    fs.mkdirSync(outputDir, { recursive: true });
    outputPath = path.join(outputDir, contract.file);
  }
  
  fs.writeFileSync(outputPath, content);
  log(`✅ Saved ${contract.name} to ${path.relative(process.cwd(), outputPath)}`, 'green');
}

function main() {
  log('🚀 Starting contract export process...', 'blue');
  log(`📁 Output directory: ${config.OUTPUT_DIR}`, 'yellow');
  log(`🗑️  Remove comments: ${config.DISABLE_COMMENTS}`, 'yellow');
  log(`📂 Preserve structure: ${config.PRESERVE_STRUCTURE}`, 'yellow');
  
  try {
    // Find contracts to flatten
    const contracts = findContracts();
    log(`📋 Found ${contracts.length} contract(s) to flatten`, 'cyan');
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process each contract
    for (const contract of contracts) {
      try {
        const flattened = flattenContract(contract);
        saveContract(contract, flattened);
        successCount++;
      } catch (error) {
        log(`❌ Failed to process ${contract.name}`, 'red');
        failureCount++;
      }
    }
    
    // Summary
    log(`\n📊 Export complete:`, 'blue');
    log(`   ✅ Success: ${successCount}`, 'green');
    if (failureCount > 0) {
      log(`   ❌ Failed: ${failureCount}`, 'red');
    }
    
  } catch (error) {
    log(`💥 Export failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, flattenContract, findContracts };