// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import './RewardToken.sol';
import './StakeableNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

// @author sharathkrml
// @title NFT Staking contract
contract NFTStaking is IERC721Receiver {
    RewardToken private immutable i_rewardToken;
    StakeableNFT private immutable i_nft;
    uint256 private s_emissionPerDay; // no of tokens emitted day

    struct Stake {
        uint256 tokenId; // store tokenId
        uint256 lastTimestamp; // store added time / last claimed time
    }

    constructor(
        address _token,
        address _nft,
        uint256 _perDay
    ) {
        i_rewardToken = RewardToken(_token);
        i_nft = StakeableNFT(_nft);
        s_emissionPerDay = _perDay * 1 ether;
    }

    /**
     * to change emission per day
     * @dev sets new emissionPerDay
     * @param _perDay takes emissionPerDay from user
     */
    function setEmissionPerDay(uint256 _perDay) external {
        s_emissionPerDay = _perDay * 1 ether;
    }

    /**
     * Implementation required to accept safeTransferFrom
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // Getter functions
    function getRewardToken() external view returns (RewardToken) {
        return i_rewardToken;
    }

    function getStakeableNFT() external view returns (StakeableNFT) {
        return i_nft;
    }

    function getEmissionPerDay() external view returns (uint256) {
        return s_emissionPerDay;
    }
}
