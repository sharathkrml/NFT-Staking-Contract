// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import './RewardToken.sol';
import './StakeableNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

contract NFTStaking is IERC721Receiver {
    RewardToken private immutable i_rewardToken;
    StakeableNFT private immutable i_nft;

    constructor(address _token, address _nft) {
        i_rewardToken = RewardToken(_token);
        i_nft = StakeableNFT(_nft);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function getRewardToken() external view returns (RewardToken) {
        return i_rewardToken;
    }

    function getStakeableNFT() external view returns (StakeableNFT) {
        return i_nft;
    }
}
