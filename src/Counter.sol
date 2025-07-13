// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

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
    function decrease() public {
        number--;
    }
    function decreaseTwice() public {
        number--;
        number--;
    }

}
