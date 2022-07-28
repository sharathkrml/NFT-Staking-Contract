import { DeployFunction } from 'hardhat-deploy/dist/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { devChainId, networkConfig } from '../helper-hardhat-config'
import verify from '../utils/verify'
const deployNFT: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, getChainId } = hre
    const currChainId = await getChainId()
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const IS_TESTNET = currChainId == devChainId
    log(IS_TESTNET ? "Chill you're on TestNet 🍹" : 'This is Real game🚀')
    let { waitConfirmations, nft, name } = networkConfig[currChainId]
    log(`deploying NFT Contract on ${name}.....😇`)
    const NFTContract = await deploy('StakeableNFT', {
        from: deployer,
        args: nft.args,
        waitConfirmations: waitConfirmations,
        log: true,
    })
    if (!IS_TESTNET) {
        log('Verifying.......💃')
        await verify(NFTContract.address, nft.args)
    }
}
export default deployNFT
deployNFT.tags = ['all', 'nft']
