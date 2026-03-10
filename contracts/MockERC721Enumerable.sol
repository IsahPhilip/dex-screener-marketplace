// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract MockERC721Enumerable {
    string public name;
    string public symbol;
    uint256 public totalSupply;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 tokenId) external {
        require(_owners[tokenId] == address(0), "exists");
        _owners[tokenId] = to;
        _balances[to] += 1;
        totalSupply += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return _owners[tokenId];
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (_owners[i] == owner) {
                if (count == index) return i;
                count++;
            }
        }
        revert("out of bounds");
    }

    function tokenURI(uint256 tokenId) external pure returns (string memory) {
        return string(abi.encodePacked("ipfs://token/", _uint2str(tokenId)));
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        return _tokenApprovals[tokenId];
    }

    function approve(address to, uint256 tokenId) external {
        address owner = _owners[tokenId];
        require(msg.sender == owner, "not owner");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        require(msg.sender == from || msg.sender == _tokenApprovals[tokenId] || _operatorApprovals[from][msg.sender], "not approved");
        require(_owners[tokenId] == from, "not owner");
        _owners[tokenId] = to;
        _balances[from] -= 1;
        _balances[to] += 1;
        emit Transfer(from, to, tokenId);
    }

    // Helpers
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        j = _i;
        while (j != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(j - j / 10 * 10));
            bstr[k] = bytes1(temp);
            j /= 10;
        }
        return string(bstr);
    }

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
}
