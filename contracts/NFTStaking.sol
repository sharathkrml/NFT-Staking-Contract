// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import './RewardToken.sol';
import './StakeableNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
// @author sharathkrml
// @title NFT Staking contract

error NFTStaking__NotOwner(uint256 tokenId);

contract NFTStaking is IERC721Receiver, ReentrancyGuard {
    RewardToken private immutable i_rewardToken;
    StakeableNFT private immutable i_nft;
    uint256 private s_emissionPerDay; // no of tokens emitted day

    struct Stake {
        uint256 lastTimestamp; // store added time / last claimed time
        uint256 emissionRate;
        uint256 calculatedRate;
    }

    mapping(address => Stake) private s_stakeByAddress;
    mapping(address => uint256[]) private s_tokenByAddress;

    constructor(
        address _token,
        address _nft,
        uint256 _perDay
    ) {
        i_rewardToken = RewardToken(_token);
        i_nft = StakeableNFT(_nft);
        s_emissionPerDay = _perDay * 1 ether;
    }

    function stake(uint256[] calldata _ids) external nonReentrant {
        Stake memory m_stake = s_stakeByAddress[msg.sender];
        // calculate rate so far
        if (m_stake.lastTimestamp != 0) {
            // only if staking is called by user more than once
            m_stake.calculatedRate = _calculateRate(m_stake);
        }
        for (uint256 i = 0; i < _ids.length; i++) {
            if (i_nft.ownerOf(_ids[i]) != msg.sender) {
                revert NFTStaking__NotOwner(_ids[i]);
            }
            m_stake.emissionRate += s_emissionPerDay;
            s_tokenByAddress[msg.sender].push(_ids[i]);
            i_nft.safeTransferFrom(msg.sender, address(this), _ids[i]);
        }
        m_stake.lastTimestamp = block.timestamp;
        s_stakeByAddress[msg.sender] = m_stake;
    }

    function _calculateRate(Stake memory _stake)
        internal
        view
        returns (uint256)
    {
        return
            ((block.timestamp - _stake.lastTimestamp) * _stake.emissionRate) /
            1 days;
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

    function getStake(address _address) external view returns (Stake memory) {
        return s_stakeByAddress[_address];
    }

    function getToken(address _address)
        external
        view
        returns (uint256[] memory)
    {
        return s_tokenByAddress[_address];
    }
}
