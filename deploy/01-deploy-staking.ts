import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { devChainId, networkConfig } from '../helper-hardhat-config'
import { StakeableNFT } from '../typechain-types'
import verify from '../utils/verify'
const deployStaking: DeployFunction = async (
    hre: HardhatRuntimeEnvironment
) => {
    const { deployments, getNamedAccounts, getChainId } = hre
    const currChainId = await getChainId()
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const IS_TESTNET = currChainId == devChainId
    const nftContract: StakeableNFT = await ethers.getContract('StakeableNFT')
    log(IS_TESTNET ? "Chill you're on TestNet 🍹" : 'This is Real game🚀')
    let { waitConfirmations, name, emissionPerDay } = networkConfig[currChainId]
    log(`deploying NFT Contract on ${name}.....😇`)
    const rewardToken = await deploy('RewardToken', {
        from: deployer,
        args: [],
        waitConfirmations: waitConfirmations,
        log: true,
    })
    if (!IS_TESTNET) {
        log('Verifying RewardToken.......💃')
        await verify(rewardToken.address, [])
    }
    log('deployed Token 🥳')
    let nftStakingArgs = [
        rewardToken.address,
        nftContract.address,
        emissionPerDay,
    ]
    const nftStaking = await deploy('NFTStaking', {
        from: deployer,
        log: true,
        args: nftStakingArgs,
    })
    if (!IS_TESTNET) {
        log('Verifying NFTStaking.......💃')
        await verify(nftStaking.address, [])
    }
}
export default deployStaking
deployStaking.tags = ['all']
