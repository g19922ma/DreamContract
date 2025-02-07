// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SpecialNFT is ERC721 {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIds;

    struct TokenInfo {
        uint256 mintTime;   // mint されたタイムスタンプ
        uint256 duration;   // 指定された分数を秒に変換した値
        bool eventEmitted;  // TimeElapsed イベントが既に emit されたか
    }

    mapping(uint256 => TokenInfo) public tokenInfo;

    event TimeElapsed(uint256 tokenId);

    constructor() ERC721("SpecialNFT", "SNFT") {}

    // _baseURI をオーバーライドしてメタデータのベース URI を指定
    function _baseURI() internal pure override returns (string memory) {
        return "https://qurihara.github.io/nft1/md/";
    }

    function mint(address recipient, uint256 xMinutes) external returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        tokenInfo[newItemId] = TokenInfo({
            mintTime: block.timestamp,
            duration: xMinutes * 60, // 分を秒に変換
            eventEmitted: false
        });
        return newItemId;
    }

    function triggerTimeElapsed(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        TokenInfo storage info = tokenInfo[tokenId];
        require(!info.eventEmitted, "Event already emitted");
        require(block.timestamp >= info.mintTime + info.duration, "Time has not elapsed yet");

        info.eventEmitted = true;
        emit TimeElapsed(tokenId);
    }

    // 条件が満たされているか（時間経過済みかつイベント未発火か）を返す view 関数
    function isTimeElapsed(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        TokenInfo memory info = tokenInfo[tokenId];
        return (block.timestamp >= info.mintTime + info.duration) && (!info.eventEmitted);
    }
}
