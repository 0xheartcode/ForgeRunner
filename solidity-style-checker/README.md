# Solidity Style Checker

An automated tool for checking Solidity code against the Coinbase Solidity Style Guide and official Solidity Style Guide. This tool helps maintain consistent code quality and style across your smart contract projects.

## Features

### **Automated Rule Checking**
- ✅ **Naming Conventions**: Contract, function, variable, constant, event, and error naming
- ✅ **Import Management**: Named imports, alphabetical ordering, grouping
- ✅ **Code Layout**: Indentation, line length, spacing, trailing whitespace
- ✅ **File Structure**: SPDX license, pragma placement, import organization
- ✅ **Advanced Patterns**: Event past tense, library naming exceptions

### **Style Guide Compliance**
- **Coinbase Style Guide**: Events past tense, SubjectVerb patterns, library exceptions
- **Official Solidity Style Guide**: Standard naming, layout, and structure rules
- **Configurable Rules**: Enable/disable specific checks based on your needs

## Quick Start

```bash
# Check all contracts
make lint-style

# Or run directly
cd solidity-style-checker && node checker.js
```

## Rule Categories

### **1. Naming Conventions**
```javascript
// ✅ Good
contract MyToken { }
function transferFrom(address _to, uint256 _amount) { }
uint256 public balance;
uint256 public constant MAX_SUPPLY = 1000;
event OwnerUpdated(address newOwner);

function _helperFunction() private { }  // Private functions
function _validateInput() internal { }  // Internal functions

// ❌ Bad  
contract myToken { }
function transferFrom(address to, uint256 amount) { }  // Missing underscores
uint256 public Balance;
uint256 public constant maxSupply = 1000;
event OwnerUpdate(address newOwner);

function helperFunction() private { }   // Should be _helperFunction
function validateInput() internal { }   // Should be _validateInput
```

### **2. Import Management**
```javascript
// ✅ Good
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

import {MyHelper} from "./MyHelper.sol";

// ❌ Bad
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {MyHelper} from "./MyHelper.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
```

### **3. Code Layout**
```javascript
// ✅ Good (4 spaces, proper spacing)
function transfer(address to, uint256 amount) public {
    balance = amount + 10;
}

// ❌ Bad (tabs, no spacing, trailing whitespace)
function transfer(address to,uint256 amount)public{
	balance=amount+10;    
}
```

### **4. File Structure**
```javascript
// ✅ Good
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ERC20} from "./ERC20.sol";

contract MyToken is ERC20 {
    // ...
}

// ❌ Bad
pragma solidity ^0.8.13;
import "./ERC20.sol";
// SPDX-License-Identifier: MIT

contract MyToken is ERC20 {
    // ...
}
```

## Configuration

Edit `build-config.js` to customize rules:

```javascript
const RULES = {
  naming: {
    contracts: 'CapWords',        // PascalCase
    functions: 'mixedCase',       // camelCase
    functionArguments: '_underscoreMixedCase',  // 0xcert style
    privateInternalFunctions: '_underscoreMixedCase', // 0xcert style
    eventsPastTense: true,        // Coinbase rule
    libraryNoUnderscore: true     // Coinbase exception
  },
  imports: {
    namedOnly: true,              // Require named imports
    alphabetical: true,           // Sort alphabetically
    groupExternal: true           // Group external vs local
  },
  layout: {
    indentation: 4,               // 4 spaces
    maxLineLength: 120,           // 120 character limit
    noTrailingWhitespace: true    // Clean trailing spaces
  }
};
```

### **Rule Severity Levels**
- **Error** (❌): Must be fixed, causes build failure
- **Warning** (⚠️): Should be fixed, good practice
- **Info** (ℹ️): Nice to fix, style suggestion

## Sample Output

```
🔍 Checking src/MyToken.sol...

❌ Contract naming (line 5): 'myToken' should be 'MyToken' (CapWords)
⚠️  Import format (line 2): Use named imports: import {ERC20} from "./ERC20.sol"
ℹ️  Event naming (line 15): 'Transfer' should be past tense: 'Transferred'

📊 Summary: 1 error, 1 warning, 1 info
```

## Supported Rules

### **Naming Conventions**
| Rule | Style | Example |
|------|-------|---------|
| Contracts | CapWords | `MyToken`, `TokenVesting` |
| Functions | mixedCase | `transferFrom`, `approve` |
| Function Arguments | _underscoreMixedCase | `_to`, `_amount`, `_spender` |
| Private/Internal Functions | _underscoreMixedCase | `_calculateFees`, `_validateInput` |
| Variables | mixedCase | `totalSupply`, `balanceOf` |
| Constants | UPPER_CASE | `MAX_SUPPLY`, `DECIMALS` |
| Events | CapWords + past tense | `OwnerUpdated`, `TokensMinted` |
| Errors | CapWords | `InsufficientBalance` |

### **Coinbase-Specific Rules**
- **Events**: Past tense (`OwnerUpdated` vs `OwnerUpdate`)
- **Event Format**: SubjectVerb (`OwnerUpdated` vs `UpdatedOwner`)
- **Library Functions**: No underscore prefix for internal functions
- **Named Parameters**: Prefer named parameters in function calls

### **0xcert-Specific Rules**
- **Function Arguments**: Must use `_underscoreMixedCase` (`_to`, `_amount`)
- **Private Functions**: Must use `_underscoreMixedCase` (`_calculateFees`)
- **Internal Functions**: Must use `_underscoreMixedCase` (`_validateInput`)

### **Layout Rules**
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: Maximum 120 characters
- **Spacing**: Spaces around operators
- **Blank Lines**: Between functions and contracts
- **Trailing Whitespace**: Not allowed

## Integration

### **Makefile Commands**
```bash
make lint-style          # Check style compliance
make help               # Shows all available commands
```

### **Exit Codes**
- `0`: All checks passed or only warnings/info
- `1`: Style errors found (fails CI/CD)

### **Pre-commit Integration**
Add to your pre-commit hooks:
```bash
#!/bin/sh
make lint-style || exit 1
```

## Rule Examples

### **✅ Compliant Code**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {PriceOracle} from "./PriceOracle.sol";

contract MyToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    
    event TokensMinted(address indexed to, uint256 amount);
    error InsufficientBalance(uint256 available, uint256 requested);
    
    function mintTokens(address _to, uint256 _amount) external onlyOwner {
        if (totalSupply() + _amount > MAX_SUPPLY) {
            revert InsufficientBalance(MAX_SUPPLY - totalSupply(), _amount);
        }
        
        _mint(_to, _amount);
        emit TokensMinted(_to, _amount);
    }
    
    function _validateMintAmount(uint256 _amount) private pure returns (bool) {
        return _amount > 0 && _amount <= 1000 * 10**18;
    }
}
```

### **❌ Non-Compliant Code**
```solidity
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract myToken is ERC20 {
    uint256 public constant maxSupply = 1000000;
    
    event TokenMint(address to, uint256 amount);
    
    function mintTokens(address to, uint256 amount) external {
        _mint(to, amount);
        emit TokenMint(to, amount);    
    }
    
    function validateAmount(uint256 amount) private pure returns (bool) {
        return amount > 0;
    }
}
```

## Benefits

1. **Consistency**: Enforces uniform code style across teams
2. **Readability**: Makes code easier to read and understand
3. **Best Practices**: Follows industry-standard conventions
4. **Automation**: Catches style issues early in development
5. **CI/CD Ready**: Integrates with automated pipelines

Built to maintain the same quality standards as ForgeRunner's other tools for professional smart contract development.