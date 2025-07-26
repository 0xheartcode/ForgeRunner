#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const config = require('./build-config');

// Console colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Statistics tracking
let stats = {
  files: 0,
  errors: 0,
  warnings: 0,
  info: 0,
  passed: 0
};

// Issue tracking
let issues = [];

function addIssue(file, line, rule, message, severity) {
  issues.push({
    file,
    line,
    rule,
    message,
    severity
  });
  
  // Update stats based on severity
  if (severity === 'error') {
    stats.errors++;
  } else if (severity === 'warning') {
    stats.warnings++;
  } else if (severity === 'info') {
    stats.info++;
  }
}

function getSeverityIcon(severity) {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '•';
  }
}

function getSeverityColor(severity) {
  switch (severity) {
    case 'error': return 'red';
    case 'warning': return 'yellow';
    case 'info': return 'cyan';
    default: return 'gray';
  }
}

function findContracts() {
  const srcDir = path.resolve(__dirname, '..', config.SOURCE_DIR);
  
  if (!fs.existsSync(srcDir)) {
    log(`❌ Source directory not found: ${srcDir}`, 'red');
    process.exit(1);
  }
  
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
        } else if (file.endsWith('.sol')) {
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
        log(`❌ Contract ${file} not found in ${config.SOURCE_DIR}/`, 'red');
        process.exit(1);
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

function checkFile(contract) {
  log(`🔍 Checking ${contract.path}...`, 'cyan');
  
  const content = fs.readFileSync(contract.fullPath, 'utf8');
  const lines = content.split('\n');
  
  stats.files++;
  
  // Check each rule category
  checkFileStructure(contract, content, lines);
  checkImports(contract, content, lines);
  checkNaming(contract, content, lines);
  checkLayout(contract, content, lines);
}

function checkFileStructure(contract, content, lines) {
  if (!config.RULES.structure) return;
  
  const rules = config.RULES.structure;
  
  // Check SPDX license
  if (rules.spdxLicense) {
    const spdxPattern = /SPDX-License-Identifier:/;
    const hasSpdx = content.match(spdxPattern);
    
    if (!hasSpdx) {
      addIssue(contract.path, 1, 'structure.spdxLicense', 'Missing SPDX license identifier', 
        config.RULE_SEVERITY['structure.spdxLicense'] || 'error');
    } else if (rules.spdxAtTop && lines.length > 0) {
      const firstLine = lines[0].trim();
      if (!firstLine.includes('SPDX-License-Identifier:')) {
        addIssue(contract.path, 1, 'structure.spdxAtTop', 'SPDX license should be on first line', 'warning');
      }
    }
  }
  
  // Check pragma placement
  if (rules.pragmaAfterLicense) {
    const pragmaLineIndex = lines.findIndex(line => line.trim().startsWith('pragma solidity'));
    const spdxLineIndex = lines.findIndex(line => line.includes('SPDX-License-Identifier:'));
    
    if (pragmaLineIndex !== -1 && spdxLineIndex !== -1 && pragmaLineIndex < spdxLineIndex) {
      addIssue(contract.path, pragmaLineIndex + 1, 'structure.pragmaAfterLicense', 
        'Pragma should come after SPDX license', 'warning');
    }
  }
}

function checkImports(contract, content, lines) {
  if (!config.RULES.imports) return;
  
  const rules = config.RULES.imports;
  const imports = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ')) {
      imports.push({ line: trimmed, lineNumber: index + 1 });
    }
  });
  
  imports.forEach((importInfo, index) => {
    const { line, lineNumber } = importInfo;
    
    // Check named imports
    if (rules.namedOnly) {
      const namedImportPattern = /^import\s+\{[^}]+\}\s+from\s+["'][^"']+["'];?$/;
      if (!namedImportPattern.test(line)) {
        addIssue(contract.path, lineNumber, 'imports.namedOnly', 
          `Use named imports: import {Contract} from "./file.sol"`, 'warning');
      }
    }
    
    // Check alphabetical order
    if (rules.alphabetical && index > 0) {
      const currentFrom = extractImportPath(line);
      const previousFrom = extractImportPath(imports[index - 1].line);
      
      if (currentFrom && previousFrom && currentFrom < previousFrom) {
        addIssue(contract.path, lineNumber, 'imports.alphabetical', 
          `Imports should be alphabetically ordered`, 'warning');
      }
    }
  });
}

function extractImportPath(importLine) {
  const match = importLine.match(/from\s+["']([^"']+)["']/);
  return match ? match[1] : null;
}

function checkNaming(contract, content, lines) {
  if (!config.RULES.naming) return;
  
  const rules = config.RULES.naming;
  
  // Check contract names
  if (rules.contracts) {
    const contractPattern = /^(\s*)contract\s+([A-Za-z_][A-Za-z0-9_]*)/gm;
    let match;
    
    while ((match = contractPattern.exec(content)) !== null) {
      const contractName = match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      if (rules.contracts === 'CapWords' && !isCapWords(contractName)) {
        addIssue(contract.path, lineNumber, 'naming.contracts', 
          `Contract name '${contractName}' should use CapWords style`, 
          config.RULE_SEVERITY['naming.contracts'] || 'error');
      }
    }
  }
  
  // Check function names and arguments
  if (rules.functions || rules.functionArguments || rules.privateInternalFunctions) {
    // More comprehensive function pattern to capture visibility and arguments
    const functionPattern = /function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*([^)]*)\s*\)\s*([^{]*?)\s*{/gs;
    let match;
    
    while ((match = functionPattern.exec(content)) !== null) {
      const functionName = match[1];
      const functionArgs = match[2];
      const modifiersAndVisibility = match[3];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Skip special functions
      if (['constructor', 'receive', 'fallback'].includes(functionName)) continue;
      
      // Extract visibility from modifiers
      const visibilityMatch = modifiersAndVisibility.match(/\b(public|external|internal|private)\b/);
      const visibility = visibilityMatch ? visibilityMatch[1] : 'internal'; // default visibility
      
      // Check private/internal function naming first
      if (rules.privateInternalFunctions === '_underscoreMixedCase') {
        if ((visibility === 'private' || visibility === 'internal') && !isUnderscoreMixedCase(functionName)) {
          addIssue(contract.path, lineNumber, 'naming.privateInternalFunctions',
            `${visibility} function '${functionName}' should use _underscoreMixedCase style`,
            'error');
        }
      }
      
      // Check general function name style (but skip private/internal functions that should have underscores)
      if (rules.functions === 'mixedCase') {
        const shouldHaveUnderscore = (visibility === 'private' || visibility === 'internal') && 
                                   rules.privateInternalFunctions === '_underscoreMixedCase';
        
        if (!shouldHaveUnderscore && !isMixedCase(functionName)) {
          addIssue(contract.path, lineNumber, 'naming.functions', 
            `Function name '${functionName}' should use mixedCase style`, 
            config.RULE_SEVERITY['naming.functions'] || 'error');
        } else if (shouldHaveUnderscore && !functionName.startsWith('_') && !isUnderscoreMixedCase(functionName)) {
          // This case is handled by privateInternalFunctions rule above
        }
      }
      
      // Check function argument naming
      if (rules.functionArguments === '_underscoreMixedCase' && functionArgs.trim()) {
        const args = functionArgs.split(',').map(arg => arg.trim());
        
        args.forEach(arg => {
          if (arg) {
            // Extract argument name from "type name" pattern
            const argNameMatch = arg.match(/\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*$|\s*\[)/);
            if (argNameMatch) {
              const argName = argNameMatch[1];
              
              // Skip memory/storage/calldata keywords
              if (['memory', 'storage', 'calldata'].includes(argName)) return;
              
              if (!isUnderscoreMixedCase(argName)) {
                addIssue(contract.path, lineNumber, 'naming.functionArguments',
                  `Function argument '${argName}' should use _underscoreMixedCase style`,
                  'error');
              }
            }
          }
        });
      }
    }
  }
  
  // Check event names and patterns
  if (rules.events) {
    const eventPattern = /event\s+([A-Za-z_][A-Za-z0-9_]*)/g;
    let match;
    
    while ((match = eventPattern.exec(content)) !== null) {
      const eventName = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      if (rules.events === 'CapWords' && !isCapWords(eventName)) {
        addIssue(contract.path, lineNumber, 'naming.events', 
          `Event name '${eventName}' should use CapWords style`, 'error');
      }
      
      // Check past tense (Coinbase rule)
      if (rules.eventsPastTense && !isPastTense(eventName)) {
        addIssue(contract.path, lineNumber, 'naming.eventsPastTense', 
          `Event name '${eventName}' should be past tense (e.g., 'OwnerUpdated' not 'OwnerUpdate')`, 'info');
      }
    }
  }
  
  // Check constants
  if (rules.constants) {
    const constantPattern = /([A-Za-z_][A-Za-z0-9_]*)\s+(public|private|internal)?\s+constant/g;
    let match;
    
    while ((match = constantPattern.exec(content)) !== null) {
      const constantName = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      if (rules.constants === 'UPPER_CASE' && !isUpperCase(constantName)) {
        addIssue(contract.path, lineNumber, 'naming.constants', 
          `Constant '${constantName}' should use UPPER_CASE_WITH_UNDERSCORES style`, 'error');
      }
    }
  }
}

function checkLayout(contract, content, lines) {
  if (!config.RULES.layout) return;
  
  const rules = config.RULES.layout;
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check line length
    if (rules.maxLineLength && line.length > rules.maxLineLength) {
      addIssue(contract.path, lineNumber, 'layout.maxLineLength', 
        `Line length ${line.length} exceeds maximum ${rules.maxLineLength}`, 
        config.RULE_SEVERITY['layout.maxLineLength'] || 'warning');
    }
    
    // Check indentation
    if (rules.indentation && rules.noTabs) {
      if (line.includes('\t')) {
        addIssue(contract.path, lineNumber, 'layout.noTabs', 
          'Use spaces instead of tabs for indentation', 'error');
      }
    }
    
    // Check trailing whitespace
    if (rules.noTrailingWhitespace && line.match(/\s+$/)) {
      addIssue(contract.path, lineNumber, 'layout.noTrailingWhitespace', 
        'Remove trailing whitespace', 'warning');
    }
  });
}

// Naming convention helpers
function isCapWords(name) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

function isMixedCase(name) {
  return /^[a-z][a-zA-Z0-9]*$/.test(name);
}

function isUpperCase(name) {
  return /^[A-Z][A-Z0-9_]*$/.test(name);
}

function isUnderscoreMixedCase(name) {
  // _underscoreMixedCase: starts with underscore, followed by mixedCase
  return /^_[a-z][a-zA-Z0-9]*$/.test(name);
}

function isPastTense(eventName) {
  // Simple heuristic: check if ends with common past tense suffixes
  const pastTenseSuffixes = ['ed', 'Updated', 'Created', 'Deleted', 'Added', 'Removed', 'Set', 'Changed'];
  return pastTenseSuffixes.some(suffix => eventName.endsWith(suffix));
}

function printResults() {
  log('\n📊 Style Check Results', 'blue');
  log('='.repeat(50), 'gray');
  
  if (issues.length === 0) {
    log('✅ All style checks passed!', 'green');
  } else {
    // Group issues by file
    const issuesByFile = {};
    issues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });
    
    // Print issues for each file
    Object.keys(issuesByFile).forEach(file => {
      log(`\n📄 ${file}:`, 'cyan');
      issuesByFile[file].forEach(issue => {
        const icon = getSeverityIcon(issue.severity);
        const color = getSeverityColor(issue.severity);
        log(`  ${icon} Line ${issue.line}: ${issue.message}`, color);
        log(`     Rule: ${issue.rule}`, 'gray');
      });
    });
  }
  
  // Print summary
  log('\n📈 Summary:', 'blue');
  log(`   📁 Files checked: ${stats.files}`, 'cyan');
  log(`   ❌ Errors: ${stats.errors}`, stats.errors > 0 ? 'red' : 'gray');
  log(`   ⚠️  Warnings: ${stats.warnings}`, stats.warnings > 0 ? 'yellow' : 'gray');
  log(`   ℹ️  Info: ${stats.info}`, stats.info > 0 ? 'cyan' : 'gray');
  
  if (stats.errors > 0) {
    log('\n💡 Fix errors before proceeding with deployment or review.', 'yellow');
  }
}

function main() {
  log('🎯 Solidity Style Checker', 'blue');
  log('🔧 Checking code style and conventions...', 'cyan');
  
  try {
    const contracts = findContracts();
    log(`📋 Found ${contracts.length} contract(s) to check`, 'cyan');
    
    contracts.forEach(contract => {
      checkFile(contract);
    });
    
    printResults();
    
    // Exit with error code if there are errors
    if (stats.errors > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    log(`💥 Style check failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, checkFile, findContracts };