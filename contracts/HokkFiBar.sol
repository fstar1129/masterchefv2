// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// hokkFiBar is the coolest bar in town. You come in with some hokkFi, and leave with more! The longer you stay, the more hokkFi you get.
//
// This contract handles swapping to and from xhokkFi, hokkFiSwap's staking token.
contract HokkFiBar is ERC20("TreatsBar", "xTREATS"){
    using SafeMath for uint256;
    IERC20 public hokkFi;

    // Define the hokkFi token contract
    constructor(IERC20 _hokkFi) public {
        hokkFi = _hokkFi;
    }

    // Enter the bar. Pay some hokkFis. Earn some shares.
    // Locks hokkFi and mints xhokkFi
    function enter(uint256 _amount) public {
        // Gets the amount of hokkFi locked in the contract
        uint256 totalhokkFi = hokkFi.balanceOf(address(this));
        // Gets the amount of xhokkFi in existence
        uint256 totalShares = totalSupply();
        // If no xhokkFi exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalhokkFi == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xhokkFi the hokkFi is worth. The ratio will change overtime, as xhokkFi is burned/minted and hokkFi deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalhokkFi);
            _mint(msg.sender, what);
        }
        // Lock the hokkFi in the contract
        hokkFi.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your hokkFis.
    // Unlocks the staked + gained hokkFi and burns xhokkFi
    function leave(uint256 _share) public {
        // Gets the amount of xhokkFi in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of hokkFi the xhokkFi is worth
        uint256 what = _share.mul(hokkFi.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        hokkFi.transfer(msg.sender, what);
    }
}
