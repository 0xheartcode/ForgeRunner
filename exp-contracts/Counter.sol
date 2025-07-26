// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// src/Counter.sol

contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }

    function incrementTwice() public {
        number++;
        number++;
    }
    function decreaseTriple() public {
        number--;
        number--;
        number--;
    }
    function setAnotherNumber(uint256 newNumber1_, uint256 newNumber2_) public {
        number = newNumber1_;
    }

}

