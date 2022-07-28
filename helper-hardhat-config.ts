import { ethers } from 'hardhat'

type NetworkConfigType = {
    [key: string]: {
        name: string
        waitConfirmations: number
        args: string[]
    }
}

export const networkConfig: NetworkConfigType = {
    '31337': {
        name: 'localhost',
        waitConfirmations: 0,
        args: ['www.google.com/'],
    },
    '4': {
        name: 'rinkeby',
        waitConfirmations: 6,
        args: [''],
    },
}

export const devChainId = '31337'
