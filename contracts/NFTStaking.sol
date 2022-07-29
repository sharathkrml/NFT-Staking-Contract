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
        uint256 lastTimeStamp; // store added time / last claimed time
        uint256 emissionRate;
        uint256 tokenQuantity;
    }

    mapping(address => Stake) private s_stakeByAddress;
    mapping(uint256 => address) private s_ownerOf;
    event Staked(
        uint256 lastTimeStamp,
        uint256 emissionRate,
        uint256 tokenQuantity,
        uint256[] tokenIds
    );
    event Unstaked(
        uint256 lastTimeStamp,
        uint256 emissionRate,
        uint256 tokenQuantity,
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

    /**
     * function to stake given NFTs
     * @dev takes in NFT ids,if it's not the first time user staking,
     * updates the tokenQuantity according to last staking
     * add ids to mapping s_ownerOf[id]
     * increment emissionRate according with no.of NFTs
     * transfers NFT to Staking contract
     * @param _ids takes in array of tokenIds
     */
    function stake(uint256[] calldata _ids) external nonReentrant {
        Stake memory m_stake = s_stakeByAddress[msg.sender];
        // if it is first time,no need to calculate tokenQuantity
        if (m_stake.lastTimeStamp != 0) {
            m_stake.tokenQuantity = _tokenQuantitySoFar(
                m_stake.lastTimeStamp,
                m_stake.emissionRate,
                m_stake.tokenQuantity
            );
        }
        m_stake.lastTimeStamp = block.timestamp;
        for (uint256 i = 0; i < _ids.length; i++) {
            if (i_nft.ownerOf(_ids[i]) != msg.sender) {
                // confirms if all tokens belong to msg.sender
                revert NFTStaking__NotOwner(_ids[i]);
            }
            // add ids to mapping
            s_ownerOf[_ids[i]] = msg.sender;
            // emission rate incremented according with no of NFTs
            m_stake.emissionRate += s_emissionPerDay;
            // transfers the NFT to contract
            i_nft.safeTransferFrom(msg.sender, address(this), _ids[i]);
        }
        s_stakeByAddress[msg.sender] = m_stake;
        emit Staked(
            m_stake.lastTimeStamp,
            m_stake.emissionRate,
            m_stake.tokenQuantity,
            _ids
        );
    }

    /**
     * used to unclaim given NFTs
     * @dev sets up tokenQuantity & lastTimeStamp first
     * verifies if id belonged to msg.sender using s_ownerOf mapping
     * reduces emissionRate for further calculations
     * transfers NFTs to owner
     * @param _ids takes in list of NFT ids
     */
    function unstake(uint256[] calldata _ids) external nonReentrant {
        Stake memory m_stake = s_stakeByAddress[msg.sender];
        if (m_stake.lastTimeStamp == 0) {
            revert NFTStaking__NothingStaked();
        }
        m_stake.tokenQuantity = _tokenQuantitySoFar(
            m_stake.lastTimeStamp,
            m_stake.emissionRate,
            m_stake.tokenQuantity
        );
        m_stake.lastTimeStamp = block.timestamp;
        for (uint256 i = 0; i < _ids.length; i++) {
            if (s_ownerOf[_ids[i]] == msg.sender) {
                revert NFTStaking__NotOwner(_ids[i]);
            }
            m_stake.emissionRate -= s_emissionPerDay;
            i_nft.safeTransferFrom(address(this), msg.sender, _ids[i]);
        }
        s_stakeByAddress[msg.sender] = m_stake;
        emit Unstaked(
            m_stake.lastTimeStamp,
            m_stake.emissionRate,
            m_stake.tokenQuantity,
            _ids
        );
    }

    /**
     * function used to claim tokens
     * @dev calculate the tokenQuantity & lastTimeStamp
     * reduces amount from calculated tokenQuantity & mints the amount to msg.sender
     * @param _amount takes in the user specified amount to mint
     */

    function claim(uint256 _amount) external nonReentrant {
        Stake memory m_stake = s_stakeByAddress[msg.sender];
        if (m_stake.lastTimeStamp == 0) {
            revert NFTStaking__NothingStaked();
        }
        m_stake.tokenQuantity = _tokenQuantitySoFar(
            m_stake.lastTimeStamp,
            m_stake.emissionRate,
            m_stake.tokenQuantity
        );
        m_stake.lastTimeStamp = block.timestamp;
        if (m_stake.tokenQuantity < _amount) {
            revert NFTStaking__NotEligibleForThisMuch();
        }
        m_stake.tokenQuantity -= _amount;
        s_stakeByAddress[msg.sender] = m_stake;
        i_rewardToken.mint(msg.sender, _amount);
        emit Claim(_amount);
    }

    /**
     * used to claim all tokens deserving to msg.sender
     * @dev first calculates the tokenQuantity & saves it to _amount variable
     * sets the new timeStamp & tokenQuantity as zero(as we are gonna mint all)
     */

    function claimAll() external nonReentrant {
        Stake memory m_stake = s_stakeByAddress[msg.sender];
        if (m_stake.lastTimeStamp == 0) {
            revert NFTStaking__NothingStaked();
        }
        uint256 _amount = _tokenQuantitySoFar(
            m_stake.lastTimeStamp,
            m_stake.emissionRate,
            m_stake.tokenQuantity
        );
        m_stake.lastTimeStamp = block.timestamp;
        m_stake.tokenQuantity = 0;
        s_stakeByAddress[msg.sender] = m_stake;
        i_rewardToken.mint(msg.sender, _amount);
        emit Claim(_amount);
    }

    /**
     * function used to calculate current tokenQuantity
     * @dev takes in (block.timestamp-lastTimeStamp) gives out seconds passed from prev calculation
     * multiplying it by emissionRatePerDay / 1 days gives out totalAmount from last calculation
     * adding that to currtokenQuantity gives updated tokenQuantity
     * @param lastTimeStamp takes in lastTime tokenQuantity is calculated
     * @param emissionRatePerDay takes in emission rate of specific stake  per day
     * @param currtokenQuantity takes quantity after last calculation
     */
    function _tokenQuantitySoFar(
        uint256 lastTimeStamp,
        uint256 emissionRatePerDay,
        uint256 currtokenQuantity
    ) internal view returns (uint256) {
        return
            currtokenQuantity +
            (((block.timestamp - lastTimeStamp) * emissionRatePerDay) / 1 days);
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

    function getOwnerOf(uint256 _tokenId) external view returns (address) {
        return s_ownerOf[_tokenId];
    }
}
