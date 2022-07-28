import { ethers } from 'hardhat'

type NetworkConfigType = {
    [key: string]: {
        name: string
        waitConfirmations: number
        nft: { args: string[] }
    }
}

export const networkConfig: NetworkConfigType = {
    '31337': {
        name: 'localhost',
        waitConfirmations: 0,
        nft: {
            args: ['www.google.com/'],
        },
    },
    '4': {
        name: 'rinkeby',
        waitConfirmations: 6,
        nft: {
            args: [''],
        },
    },
}

export const devChainId = '31337'
