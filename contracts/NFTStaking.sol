// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import './RewardToken.sol';
import './StakeableNFT.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
// @author sharathkrml
// @title NFT Staking contract

error NFTStaking__NotOwner(uint256 tokenId);
error NFTStaking__NothingStaked();
error NFTStaking__NotEligibleForThisMuch();

contract NFTStaking is IERC721Receiver, ReentrancyGuard {
    RewardToken private immutable i_rewardToken;
    StakeableNFT private immutable i_nft;
    uint256 private s_emissionPerDay; // no of tokens emitted day

    struct Stake {
        uint256 lastTimestamp; // store added time / last claimed time
        uint256 emissionRate;
        uint256 tokenAmount;
        uint256[] tokenIds;
    }

    mapping(address => Stake) private s_stakeByAddress;

    event Staked(
        uint256 lastTImeStamp,
        uint256 emissionRate,
        uint256 tokenAmount,
        uint256[] tokenIds
    );
    event Claim(uint256 amount);

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
        if (m_stake.lastTimestamp != 0) {
            m_stake.tokenAmount = _tokenAmountSoFar(
                m_stake.lastTimestamp,
                m_stake.emissionRate,
                m_stake.tokenAmount
            );
        }
        for (uint256 i = 0; i < _ids.length; i++) {
            if (i_nft.ownerOf(_ids[i]) != msg.sender) {
                revert NFTStaking__NotOwner(_ids[i]);
            }
            s_stakeByAddress[msg.sender].tokenIds.push(_ids[i]);
            m_stake.emissionRate += s_emissionPerDay;
            i_nft.safeTransferFrom(msg.sender, address(this), _ids[i]);
        }
        m_stake.lastTimestamp = block.timestamp;
        s_stakeByAddress[msg.sender] = m_stake;
    }

    function unstake(uint256[] calldata _ids) external nonReentrant {}

    function claim(uint256 _amount) external nonReentrant {
        Stake memory m_stake = s_stakeByAddress[msg.sender];
        if (m_stake.lastTimestamp != 0) {
            m_stake.tokenAmount = _tokenAmountSoFar(
                m_stake.lastTimestamp,
                m_stake.emissionRate,
                m_stake.tokenAmount
            );
            m_stake.lastTimestamp = block.timestamp;
        }
        if (m_stake.tokenAmount < _amount) {
            revert NFTStaking__NotEligibleForThisMuch();
        }
        m_stake.tokenAmount -= _amount;
        s_stakeByAddress[msg.sender] = m_stake;
        i_rewardToken.mint(msg.sender, _amount);
        emit Claim(_amount);
    }

    function claimAll() external nonReentrant {
        Stake memory m_stake = s_stakeByAddress[msg.sender];
        uint256 _amount;
        if (m_stake.lastTimestamp != 0) {
            _amount = _tokenAmountSoFar(
                m_stake.lastTimestamp,
                m_stake.emissionRate,
                m_stake.tokenAmount
            );
            m_stake.lastTimestamp = block.timestamp;
        }
        m_stake.tokenAmount = 0;
        s_stakeByAddress[msg.sender] = m_stake;
        i_rewardToken.mint(msg.sender, _amount);
        emit Claim(_amount);
    }

    function _tokenAmountSoFar(
        uint256 lastTimeStamp,
        uint256 emissionRate,
        uint256 currTokenAmount
    ) internal view returns (uint256) {
        return
            currTokenAmount +
            (((block.timestamp - lastTimeStamp) * emissionRate) / 1 days);
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
}
