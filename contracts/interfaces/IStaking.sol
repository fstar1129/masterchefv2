// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IStaking {
  function deposit(address sender, uint256 _amount) external;
  function withdraw(address sender, uint256 _amount, bool _claim) external returns (uint256);
  function claimRewards(address sender, address _to, uint256 userAmount) external;
  receive() external payable;
}
