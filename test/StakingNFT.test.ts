import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert, expect } from 'chai'
import { deployments, ethers } from 'hardhat'
import { networkConfig } from '../helper-hardhat-config'
import { StakeableNFT } from '../typechain-types'

describe('StakeableNFT', () => {
    let stakeableNFT: StakeableNFT
    let accounts: SignerWithAddress[]
    beforeEach(async () => {
        await deployments.fixture('nft')
        stakeableNFT = await ethers.getContract('StakeableNFT')
        accounts = await ethers.getSigners()
    })
    describe('Constructor', () => {
        it('Check NFT Name & symbol', async () => {
            assert.equal(await stakeableNFT.name(), 'StakeableNFT')
            assert.equal(await stakeableNFT.symbol(), 'STK')
        })
    })
    describe('safeMint', () => {
        it('check safeMint', async () => {
            let minter = accounts[0]
            let tx = await stakeableNFT.safeMint(minter.address)
            await tx.wait(1)
            let tokenId = await stakeableNFT.getTokenId()
            assert.equal(tokenId.toString(), '1')
            assert.equal(await stakeableNFT.ownerOf(tokenId), minter.address)
        })
    })
    describe('tokenURI', () => {
        let minter: SignerWithAddress
        beforeEach(async () => {
            minter = accounts[0]
            let tx = await stakeableNFT.safeMint(minter.address)
            await tx.wait(1)
        })
        it('check tokenURI', async () => {
            assert.equal(
                await stakeableNFT.tokenURI(1),
                networkConfig['31337'].args[0] + '1' + '.json'
            )
        })
        it('checking unminted tokenURI', async () => {
            await expect(stakeableNFT.tokenURI(2)).to.be.revertedWith(
                'ERC721: invalid token ID'
            )
        })
    })
})
