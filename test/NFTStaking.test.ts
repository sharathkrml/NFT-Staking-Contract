import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert } from 'chai'
import { deployments, ethers } from 'hardhat'
import { networkConfig } from '../helper-hardhat-config'
import { NFTStaking, RewardToken, StakeableNFT } from '../typechain-types'

describe('NFTStaking test 🥳', () => {
    let NFT: StakeableNFT
    let Token: RewardToken
    let nftStaking: NFTStaking
    let user1: SignerWithAddress, user2: SignerWithAddress
    let users: SignerWithAddress[]

    beforeEach(async () => {
        await deployments.fixture('all')
        NFT = await ethers.getContract('StakeableNFT')
        Token = await ethers.getContract('RewardToken')
        nftStaking = await ethers.getContract('NFTStaking')
        ;[user1, user2, ...users] = await ethers.getSigners()
    })
    describe('Check Constructor', () => {
        it('check RewardToken', async () => {
            assert.equal(await nftStaking.getRewardToken(), Token.address)
        })
        it('check StakeableNFT', async () => {
            assert.equal(await nftStaking.getStakeableNFT(), NFT.address)
        })
        it('check emissionPerDay', async () => {
            let emissionPerDay = networkConfig['31337'].emissionPerDay
            assert.equal(
                (await nftStaking.getEmissionPerDay()).toString(),
                ethers.utils.parseEther(emissionPerDay.toString()).toString()
            )
        })
    })
    describe('try onERC721Received', () => {
        beforeEach(async () => {
            let tx = await NFT.safeMint(user1.address)
            await tx.wait(1)
        })
        it('sending NFT to Staking contract', async () => {
            let tx = await NFT['safeTransferFrom(address,address,uint256)'](
                user1.address,
                nftStaking.address,
                1
            )
            await tx.wait(1)
            assert.equal(await NFT.ownerOf(1), nftStaking.address)
        })
    })
})
