# Forge Project Makefile
# Build, test, and deploy smart contracts with Foundry

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Load .env file if it exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: help clean build test test-fork test-gas coverage deploy deploy-anvil verify format snapshot anvil install update export-contracts lint-style

help: ## Display this help message with target descriptions
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)Forge Project Commands$(NC)\n\nUsage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z0-9_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ 🛠️ Development Commands

build: ## Build all contracts
	@echo "$(YELLOW)Building contracts...$(NC)"
	forge build

clean: ## Clean build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	forge clean

install: ## Install dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	forge install

update: ## Update dependencies
	@echo "$(YELLOW)Updating dependencies...$(NC)"
	forge update

format: ## Format code
	@echo "$(YELLOW)Formatting code...$(NC)"
	forge fmt

##@ 🧪 Testing Commands

test: ## Run all tests
	@echo "$(YELLOW)Running tests...$(NC)"
	forge test -vv

test-fork: ## Run tests in fork mode
	@echo "$(YELLOW)Running tests in fork mode...$(NC)"
	@if [ -z "$$RPC_URL" ]; then \
		echo "$(RED)Error: RPC_URL not set in .env$(NC)"; \
		exit 1; \
	fi
	forge test --fork-url $$RPC_URL -vv

test-gas: ## Run tests with gas reporting
	@echo "$(YELLOW)Running tests with gas reporting...$(NC)"
	forge test --gas-report -vv

coverage: ## Generate test coverage report
	@echo "$(YELLOW)Generating coverage report...$(NC)"
	forge coverage

snapshot: ## Create gas snapshot
	@echo "$(YELLOW)Creating gas snapshot...$(NC)"
	forge snapshot

##@ 🚀 Deployment Commands

deploy: ## Deploy contracts to network (requires RPC_URL and PRIVATE_KEY in .env)
	@echo "$(YELLOW)Deploying contracts...$(NC)"
	@if [ -z "$$PRIVATE_KEY" ]; then \
		echo "$(RED)Error: PRIVATE_KEY not set in .env$(NC)"; \
		exit 1; \
	fi
	@if [ -z "$$RPC_URL" ]; then \
		echo "$(RED)Error: RPC_URL not set in .env$(NC)"; \
		exit 1; \
	fi
	forge script script/Counter.s.sol:CounterScript \
		--rpc-url $$RPC_URL \
		--private-key $$PRIVATE_KEY \
		--broadcast \
		--verify \
		--etherscan-api-key $$ETHERSCAN_API_KEY \
		-vvvv

deploy-anvil: ## Deploy contracts to local Anvil node
	@echo "$(YELLOW)Deploying to Anvil...$(NC)"
	forge script script/Counter.s.sol:CounterScript \
		--fork-url http://localhost:8545 \
		--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
		--broadcast \
		-vvvv

verify: ## Verify contract on Etherscan (requires CONTRACT_ADDRESS in .env)
	@echo "$(YELLOW)Verifying contract...$(NC)"
	@if [ -z "$$CONTRACT_ADDRESS" ]; then \
		echo "$(RED)Error: CONTRACT_ADDRESS not set in .env$(NC)"; \
		exit 1; \
	fi
	@if [ -z "$$ETHERSCAN_API_KEY" ]; then \
		echo "$(RED)Error: ETHERSCAN_API_KEY not set in .env$(NC)"; \
		exit 1; \
	fi
	forge verify-contract $$CONTRACT_ADDRESS Counter \
		--chain-id $$CHAIN_ID \
		--etherscan-api-key $$ETHERSCAN_API_KEY

##@ 🔧 Local Development

anvil: ## Start local Anvil node
	@echo "$(YELLOW)Starting Anvil...$(NC)"
	anvil

anvil-fork: ## Start Anvil fork of mainnet
	@echo "$(YELLOW)Starting Anvil fork...$(NC)"
	@if [ -z "$$RPC_URL" ]; then \
		echo "$(RED)Error: RPC_URL not set in .env$(NC)"; \
		exit 1; \
	fi
	anvil --fork-url $$RPC_URL

##@ ⚙️ Environment & Utility

check-env: ## Check if required environment variables are set
	@echo "$(YELLOW)Checking environment variables...$(NC)"
	@if [ -z "$$PRIVATE_KEY" ]; then echo "$(RED)❌ PRIVATE_KEY not set$(NC)"; else echo "$(GREEN)✓ PRIVATE_KEY set$(NC)"; fi
	@if [ -z "$$RPC_URL" ]; then echo "$(RED)❌ RPC_URL not set$(NC)"; else echo "$(GREEN)✓ RPC_URL set$(NC)"; fi
	@if [ -z "$$ETHERSCAN_API_KEY" ]; then echo "$(YELLOW)⚠️  ETHERSCAN_API_KEY not set (needed for verification)$(NC)"; else echo "$(GREEN)✓ ETHERSCAN_API_KEY set$(NC)"; fi
	@if [ -z "$$CHAIN_ID" ]; then echo "$(YELLOW)⚠️  CHAIN_ID not set (defaults to 1)$(NC)"; else echo "$(GREEN)✓ CHAIN_ID set$(NC)"; fi

env-example: ## Create example .env file
	@echo "$(YELLOW)Creating .env.example...$(NC)"
	@echo "# Private key for deployments" > .env.example
	@echo "PRIVATE_KEY=" >> .env.example
	@echo "" >> .env.example
	@echo "# RPC URLs" >> .env.example
	@echo "RPC_URL=" >> .env.example
	@echo "" >> .env.example
	@echo "# Chain ID (1 for mainnet, 5 for goerli, etc)" >> .env.example
	@echo "CHAIN_ID=" >> .env.example
	@echo "" >> .env.example
	@echo "# Etherscan API key for verification" >> .env.example
	@echo "ETHERSCAN_API_KEY=" >> .env.example
	@echo "" >> .env.example
	@echo "# Deployed contract address (after deployment)" >> .env.example
	@echo "CONTRACT_ADDRESS=" >> .env.example
	@echo "$(GREEN)✓ Created .env.example$(NC)"
	@echo "$(YELLOW)Copy to .env and fill in your values$(NC)"

##@ 📦 ABI Package Management

abi-build: ## Build ABI package (without auth)
	@echo "$(YELLOW)Building ABI package...$(NC)"
	cd abis-package && npm run build

abi-build-local: ## Build ABI package with local auth (requires .npmrc.local)
	@echo "$(YELLOW)Building ABI package with authentication...$(NC)"
	cd abis-package && npm run build:local

abi-setup-local: ## Create template for .npmrc.local
	@echo "$(YELLOW)Creating .npmrc.local template...$(NC)"
	@echo "@0xheartcode:registry=https://npm.pkg.github.com" > abis-package/.npmrc.local
	@echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT_HERE" >> abis-package/.npmrc.local
	@echo "$(GREEN)✓ Created abis-package/.npmrc.local$(NC)"
	@echo "$(YELLOW)Edit the file and replace YOUR_GITHUB_PAT_HERE with your GitHub Personal Access Token$(NC)"

##@ 📄 Contract Export Management

export-contracts: ## Export flattened contracts to exp-contracts/ directory
	@echo "$(YELLOW)Exporting flattened contracts...$(NC)"
	cd contract-exports && node build.js

##@ 🎯 Code Quality

lint-style: ## Check Solidity code style and conventions
	@echo "$(YELLOW)Checking Solidity style guide compliance...$(NC)"
	cd solidity-style-checker && node checker.js

