import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert, expect } from 'chai'
import { deployments, ethers } from 'hardhat'
import { networkConfig } from '../helper-hardhat-config'
import { NFTStaking, RewardToken, StakeableNFT } from '../typechain-types'

describe('NFTStaking test 🥳', () => {
    let NFT: StakeableNFT
    let Token: RewardToken
    let nftStaking: NFTStaking
    let user1: SignerWithAddress, user2: SignerWithAddress
    let users: SignerWithAddress[]
    let emissionPerDay = networkConfig['31337'].emissionPerDay

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
    describe('stake function', () => {
        beforeEach(async () => {
            // mints 5 NFTs to user1
            for (let i = 0; i < 5; i++) {
                let tx = await NFT.safeMint(user1.address)
                await tx.wait(1)
                tx = await NFT.approve(nftStaking.address, i + 1)
                await tx.wait(1)
            }
        })
        it('Stakes all 5 NFTs', async () => {
            let tx = await nftStaking.stake([1, 2, 3, 4, 5])
            let res = await tx.wait(1)
            if (res.events && res.events[10] && res.events[10].args) {
                assert.equal(
                    res.events[10].args.emissionRate.toString(),
                    ethers.utils
                        .parseEther(emissionPerDay.toString())
                        .mul(5)
                        .toString()
                )
                assert.equal(res.events[10].args.tokenQuantity.toString(), '0')
                assert.equal(
                    res.events[10].args.tokenIds.toString(),
                    '1,2,3,4,5'
                )
            }
        })
        it('Staking NFT not owned', async () => {
            await expect(nftStaking.connect(user2).stake([1]))
                .to.be.revertedWithCustomError(
                    nftStaking,
                    'NFTStaking__NotOwner'
                )
                .withArgs(1)
        })
    })
})
