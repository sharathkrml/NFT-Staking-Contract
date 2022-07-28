// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract StakeableNFT is ERC721 {
    uint256 private tokenId;

    constructor() ERC721('StakeableNFT', 'STK') {}

    function _baseURI() internal pure override returns (string memory) {
        return 'https://www.google.com';
    }

    function safeMint(address to) public {
        tokenId++;
        _safeMint(to, tokenId);
    }

    // getter functions
    function getTokenId() external view returns (uint256) {
        return tokenId;
    }
}
