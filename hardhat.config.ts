import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'
import 'dotenv/config'
const RINEKBY_RPC_URL = process.env.RINEKBY_RPC_URL || ''
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || ''

const config: HardhatUserConfig = {
    solidity: '0.8.9',
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            chainId: 31337,
        },
        rinkeby: {
            chainId: 4,
            url: RINEKBY_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: {
            rinkeby: ETHERSCAN_KEY,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
}

export default config
