# ForgeRunner

**A supercharged Foundry template with automated ABI package publishing and more developer-friendly features.**

ForgeRunner extends the standard Foundry toolkit with production-ready features for smart contract development and deployment workflows.

More handy scripts, Makefile commands, and developer tools coming soon ☕

## Key Features

### 📦 Automated ABI Package Publishing
Automatically extract and publish your contract ABIs as versioned npm packages. Perfect for:
- Frontend integration with type safety
- Multi-repository dApp architectures  
- Maintaining ABI version history with detailed changelogs

See [abis-package/README.md](./abis-package/README.md) for detailed documentation.

### 🛠️ Enhanced Developer Experience
- Pre-configured Makefile with helpful commands
- GitHub Actions CI/CD workflows
- Structured project layout

### 🚀 Quick Start

```shell
# Standard Foundry commands
$ forge build
$ forge test
$ forge fmt

# ABI Package commands
$ make abi-build          # Build ABI package locally
$ make abi-build-local    # Build with auth (for testing)
$ make abi-setup-local    # Setup local auth config
```

---

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
