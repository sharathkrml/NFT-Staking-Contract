// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import './RewardToken.sol';
import './StakeableNFT.sol';

contract NFTStaking {
    RewardToken private immutable i_rewardToken;
    StakeableNFT private immutable i_nft;

    constructor(address _token, address _nft) {
        i_rewardToken = RewardToken(_token);
        i_nft = StakeableNFT(_nft);
    }

    function onERC721Received(
        address, /*_operator*/
        address, /*_from*/
        uint256, /*_tokenId*/
        bytes calldata /*_data*/
    ) external pure returns (bytes4) {
        return 0x150b7a02;
    }

    function getRewardToken() external view returns (RewardToken) {
        return i_rewardToken;
    }

    function getStakeableNFT() external view returns (StakeableNFT) {
        return i_nft;
    }
}
