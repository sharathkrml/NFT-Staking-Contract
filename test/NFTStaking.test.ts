import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert } from 'chai'
import { deployments, ethers } from 'hardhat'
import { NFTStaking, RewardToken, StakeableNFT } from '../typechain-types'

describe('NFTStaking test 🥳', () => {
    let NFT: StakeableNFT
    let Token: RewardToken
    let nftStaking: NFTStaking
    let accounts: SignerWithAddress[]
    beforeEach(async () => {
        await deployments.fixture('all')
        NFT = await ethers.getContract('StakeableNFT')
        Token = await ethers.getContract('RewardToken')
        nftStaking = await ethers.getContract('NFTStaking')
        accounts = await ethers.getSigners()
    })
    describe('Check Constructor', () => {
        it('check RewardToken', async () => {
            assert.equal(await nftStaking.getRewardToken(), Token.address)
        })
        it('check StakeableNFT', async () => {
            assert.equal(await nftStaking.getStakeableNFT(), NFT.address)
        })
    })
})
