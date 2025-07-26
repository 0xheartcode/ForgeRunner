/**
 * Build Configuration for Solidity Style Checker
 * 
 * Controls which style rules are enforced and their strictness levels.
 * Based on Coinbase Solidity Style Guide and Official Solidity Style Guide.
 */

// Files to check (relative to project root)
// Set to ['*'] to scan src/ directory recursively for ALL contracts
// Example: ['Counter', 'MyToken'] for specific contracts
const CONTRACT_NAMES = ['*'];

// Source directory to scan
const SOURCE_DIR = 'src';

// Rule configurations
const RULES = {
  // File structure and imports
  imports: {
    namedOnly: true,           // Require named imports: import {X} from "./file.sol"
    alphabetical: true,        // Imports should be alphabetically ordered
    groupExternal: true,       // Group external vs local imports with blank line
    noRelativePaths: false     // Discourage relative paths (../contracts/...)
  },

  // Naming conventions
  naming: {
    contracts: 'CapWords',        // Contract names: CapWords (PascalCase)
    functions: 'mixedCase',       // Function names: mixedCase (camelCase) 
    variables: 'mixedCase',       // Variable names: mixedCase (camelCase)
    constants: 'UPPER_CASE',      // Constants: UPPER_CASE_WITH_UNDERSCORES
    events: 'CapWords',           // Event names: CapWords
    errors: 'CapWords',           // Custom error names: CapWords
    modifiers: 'mixedCase',       // Modifier names: mixedCase
    structs: 'CapWords',          // Struct names: CapWords
    enums: 'CapWords',           // Enum names: CapWords
    
    // Function-specific naming rules
    functionArguments: '_underscoreMixedCase',  // Function arguments: _underscoreMixedCase (0xcert style)
    privateInternalFunctions: '_underscoreMixedCase', // Private/internal functions: _underscoreMixedCase
    
    // Coinbase specific rules
    eventsPastTense: true,        // Events should be past tense (OwnerUpdated vs OwnerUpdate)
    eventsSubjectVerb: true,      // Events: SubjectVerb (OwnerUpdated vs UpdatedOwner)
    libraryNoUnderscore: true,    // Library internal functions: no underscore prefix
    privateUnderscore: true,      // Private/internal functions: underscore prefix (legacy)
    avoidSingleLetters: true      // Avoid single letter variables (except i, j, k in loops)
  },

  // Code layout and formatting
  layout: {
    indentation: 4,               // Use 4 spaces for indentation
    noTabs: true,                 // Disallow tabs for indentation
    maxLineLength: 120,           // Maximum line length
    blankLinesBetweenFunctions: true,  // Require blank lines between functions
    blankLinesBetweenContracts: true,  // Require blank lines between contracts
    braceStyle: 'same-line',      // Opening brace on same line as declaration
    spaceBeforeBrace: true,       // Space before opening brace
    spaceAroundOperators: true,   // Spaces around operators (x = y + z)
    noTrailingWhitespace: true,   // No trailing whitespace
    noExtraBlankLines: true       // No more than 2 consecutive blank lines
  },

  // File structure
  structure: {
    spdxLicense: true,            // Require SPDX license identifier
    spdxAtTop: true,              // SPDX license should be first line
    pragmaAfterLicense: true,     // Pragma should come after license
    importsAfterPragma: true,     // Imports should come after pragma
    
    // Function order within contracts
    functionOrder: true,          // Enforce function order
    expectedOrder: [              // constructor -> receive -> fallback -> external -> public -> internal -> private
      'constructor',
      'receive', 
      'fallback',
      'external',
      'public',
      'internal',
      'private'
    ],
    
    // Modifier order within functions
    modifierOrder: true,          // Enforce modifier order
    expectedModifierOrder: [      // visibility -> mutability -> virtual -> override -> custom
      'visibility',               // public, external, internal, private
      'mutability',              // pure, view, payable
      'virtual',
      'override',
      'custom'                   // onlyOwner, whenNotPaused, etc.
    ]
  },

  // Advanced rules
  advanced: {
    preferCustomErrors: true,     // Prefer custom errors over require strings
    noAssembly: false,           // Discourage assembly usage (set to true for strict mode)
    noInterfaces: false,         // Discourage separate interface files (Coinbase rule)
    namedParameters: true,       // Prefer named parameters in function calls
    namedMappingParameters: true, // Prefer named parameters in mappings
    avoidUnnecessaryReturns: true, // Avoid unnecessary named return parameters
    timestampSize: 'uint40'      // Minimum timestamp size (uint32 or uint40)
  }
};

// Severity levels for rule violations
const SEVERITY = {
  ERROR: 'error',     // Must be fixed
  WARNING: 'warning', // Should be fixed  
  INFO: 'info'        // Nice to fix
};

// Rule severity overrides
const RULE_SEVERITY = {
  // Critical naming issues
  'naming.contracts': SEVERITY.ERROR,
  'naming.functions': SEVERITY.ERROR,
  'naming.functionArguments': SEVERITY.ERROR,
  'naming.privateInternalFunctions': SEVERITY.ERROR,
  
  // Important structure issues
  'structure.spdxLicense': SEVERITY.ERROR,
  'layout.indentation': SEVERITY.ERROR,
  'layout.maxLineLength': SEVERITY.WARNING,
  
  // Style preferences
  'imports.alphabetical': SEVERITY.WARNING,
  'naming.eventsPastTense': SEVERITY.INFO,
  'advanced.namedParameters': SEVERITY.INFO
};

module.exports = {
  CONTRACT_NAMES,
  SOURCE_DIR, 
  RULES,
  SEVERITY,
  RULE_SEVERITY
};