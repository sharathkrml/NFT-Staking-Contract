// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import 'hardhat/console.sol';

contract StakeableNFT is ERC721 {
    using Strings for uint256;
    uint256 private s_tokenId;
    string private s_baseUri;

    constructor(string memory _baseURI) ERC721('StakeableNFT', 'STK') {
        s_baseUri = _baseURI;
    }

    function safeMint(address to) public {
        s_tokenId++;
        _safeMint(to, s_tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        _requireMinted(tokenId);

        return string(abi.encodePacked(s_baseUri, tokenId.toString(), '.json'));
    }

    // getter functions
    function getTokenId() external view returns (uint256) {
        return s_tokenId;
    }
}
