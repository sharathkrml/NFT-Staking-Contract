import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert, expect } from 'chai'
import { deployments, ethers, network } from 'hardhat'
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
        it('try staking at different times', async () => {
            let tx = await nftStaking.stake([1])
            await tx.wait(1)
            let firstStake = await nftStaking.getStake(user1.address)

            await network.provider.send('evm_increaseTime', [10])
            await network.provider.send('evm_mine', [])

            tx = await nftStaking.stake([2])
            await tx.wait(1)
            let lastStake = await nftStaking.getStake(user1.address)
            let timeDifference = lastStake.lastTimeStamp.sub(
                firstStake.lastTimeStamp
            )
            let emissionPerSec = emissionPerDay / (24 * 60 * 60)
            let quantityInEth = timeDifference.mul(emissionPerSec)
            assert.equal(
                lastStake.emissionRate.toString(),
                firstStake.emissionRate.mul(2).toString()
            )
            assert.equal(
                lastStake.tokenQuantity.toString(),
                ethers.utils.parseEther(quantityInEth.toString()).toString()
            )
        })
    })

    describe('claim function', () => {
        beforeEach(async () => {
            // mints 5 NFTs to user1
            for (let i = 0; i < 5; i++) {
                let tx = await NFT.safeMint(user1.address)
                await tx.wait(1)
                tx = await NFT.approve(nftStaking.address, i + 1)
                await tx.wait(1)
            }
        })
        it('try when not staked any', async () => {
            await expect(nftStaking.claim(1)).to.revertedWithCustomError(
                nftStaking,
                'NFTStaking__NothingStaked'
            )
        })
        it('try claim ideal case', async () => {
            // first stake one token
            let tx = await nftStaking.stake([1])
            await tx.wait(1)
            await nftStaking.getStake(user1.address)
            await network.provider.send('evm_increaseTime', [10])
            await network.provider.send('evm_mine', [])
            // stake another after 10 sec
            tx = await nftStaking.stake([2])
            await tx.wait(1)
            let firstStake = await nftStaking.getStake(user1.address)
            // claim 10 token after 10 sec
            await network.provider.send('evm_increaseTime', [10])
            await network.provider.send('evm_mine', [])
            await expect(nftStaking.claim(10))
                .to.emit(nftStaking, 'Claim')
                .withArgs(10)
            let lastStake = await nftStaking.getStake(user1.address)
            let timeDiff = lastStake.lastTimeStamp.sub(firstStake.lastTimeStamp)
            let emissionRatePerSec = firstStake.emissionRate.div(24 * 60 * 60)
            let calculated = firstStake.tokenQuantity.add(
                emissionRatePerSec.mul(timeDiff)
            )
            assert.equal(
                lastStake.tokenQuantity.add(10).toString(),
                calculated.toString()
            )
        })
        it('checks NFTStaking__NotEligibleForThisMuch', async () => {
            // stake
            let tx = await nftStaking.stake([1])
            await tx.wait(1)

            await network.provider.send('evm_increaseTime', [10])
            await network.provider.send('evm_mine', [])

            await expect(
                nftStaking.claim(ethers.utils.parseEther('100'))
            ).to.revertedWithCustomError(
                nftStaking,
                'NFTStaking__NotEligibleForThisMuch'
            )
        })
    })
    describe('claimAll', () => {
        beforeEach(async () => {
            // mints 5 NFTs to user1
            for (let i = 0; i < 5; i++) {
                let tx = await NFT.safeMint(user1.address)
                await tx.wait(1)
                tx = await NFT.approve(nftStaking.address, i + 1)
                await tx.wait(1)
            }
        })
        it('try claiming when nothing staked', async () => {
            await expect(nftStaking.claimAll()).to.revertedWithCustomError(
                nftStaking,
                'NFTStaking__NothingStaked'
            )
        })
        it('tries ideal case of claimAll', async () => {
            let tx = await nftStaking.stake([1])
            await tx.wait(1)

            await network.provider.send('evm_increaseTime', [10])
            await network.provider.send('evm_mine', [])
            await expect(nftStaking.claimAll())
                .to.emit(nftStaking, 'Claim')
                .withArgs(ethers.utils.parseEther('11'))
            let afterClaiming = await nftStaking.getStake(user1.address)
            assert.equal(afterClaiming.tokenQuantity.toString(), '0')
            //    check balanceOf user
            assert.equal(
                (await Token.balanceOf(user1.address)).toString(),
                ethers.utils.parseEther('11').toString()
            )
        })
    })
    describe('unstake', () => {
        beforeEach(async () => {
            for (let i = 0; i < 5; i++) {
                let tx = await NFT.safeMint(user1.address)
                await tx.wait(1)
                tx = await NFT.approve(nftStaking.address, i + 1)
                await tx.wait(1)
            }
        })
        it('unstake when nothing staked', async () => {
            await expect(nftStaking.unstake([1])).to.revertedWithCustomError(
                nftStaking,
                'NFTStaking__NothingStaked'
            )
        })
        it('tries unstake 3 tokens', async () => {
            let tx = await nftStaking.stake([1, 2, 3, 4, 5])
            await tx.wait(1)
            let afterStake = await nftStaking.getStake(user1.address)

            // staking for 10 sec
            await network.provider.send('evm_increaseTime', [10])
            await network.provider.send('evm_mine', [])
            assert.equal(await NFT.ownerOf(1), nftStaking.address)
            assert.equal(await NFT.ownerOf(2), nftStaking.address)
            assert.equal(await NFT.ownerOf(3), nftStaking.address)

            await expect(nftStaking.unstake([1, 2, 3])).to.emit(
                nftStaking,
                'Unstaked'
            )
            let afterUnstake = await nftStaking.getStake(user1.address)
            assert.equal(
                afterUnstake.emissionRate.toString(),
                ethers.utils
                    .parseEther(emissionPerDay.toString())
                    .mul(2)
                    .toString()
            )
            assert.equal(await NFT.ownerOf(1), user1.address)
            assert.equal(await NFT.ownerOf(2), user1.address)
            assert.equal(await NFT.ownerOf(3), user1.address)
            assert.equal(
                await (await Token.balanceOf(user1.address)).toString(),
                '0'
            )
        })
        it('unstake all', async () => {
            let tx = await nftStaking.stake([1, 2, 3])
            await tx.wait(1)
            let afterStake = await nftStaking.getStake(user1.address)
            // staking for 10 sec
            await network.provider.send('evm_increaseTime', [10])
            await network.provider.send('evm_mine', [])

            tx = await nftStaking.unstake([1, 2, 3])
            let res = await tx.wait(1)
            let afterUnstake = await nftStaking.getStake(user1.address)
            let timeDiff = afterUnstake.lastTimeStamp.sub(
                afterStake.lastTimeStamp
            )
            console.log(timeDiff)
            let emissionRatePerSecInEth = (emissionPerDay * 3) / (24 * 60 * 60)
            let emissionRatePerSec = ethers.utils.parseEther(
                emissionRatePerSecInEth.toString()
            )
            assert.equal(
                timeDiff.mul(emissionRatePerSec).toString(),
                (await Token.balanceOf(user1.address)).toString()
            )
        })
    })
})
