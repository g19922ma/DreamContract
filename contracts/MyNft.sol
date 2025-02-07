// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SpecialNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // 各トークン毎の mint 情報を保持する構造体
    struct TokenInfo {
        uint256 mintTime;   // mint されたタイムスタンプ
        uint256 duration;   // 指定された分数を秒に変換した値
        bool eventEmitted;  // TimeElapsed イベントが既に emit されたかどうか
    }

    mapping(uint256 => TokenInfo) public tokenInfo;

    // mint 時に指定された時間が経過したときに emit するイベント
    event TimeElapsed(uint256 tokenId);

    constructor() ERC721("SpecialNFT", "SNFT") {}

    /**
     * @dev メタデータのベース URI を指定するためにオーバーライド
     */
    function _baseURI() internal pure override returns (string memory) {
        return "https://qurihara.github.io/nft1/md/";
    }

    /**
     * @notice NFT を mint する。mint 時に x (分) を指定する。
     * @param recipient NFT の受取先アドレス
     * @param xMinutes mint 時から x 分後に TimeElapsed イベントが発行可能になる
     * @return newItemId 新たに mint されたトークン ID
     */
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

    /**
     * @notice 指定されたトークンについて、mint から指定時間経過していれば TimeElapsed イベントを emit する
     * @param tokenId 対象のトークン ID
     */
    function triggerTimeElapsed(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        TokenInfo storage info = tokenInfo[tokenId];
        require(!info.eventEmitted, "Event already emitted");
        require(block.timestamp >= info.mintTime + info.duration, "Time has not elapsed yet");

        info.eventEmitted = true;
        emit TimeElapsed(tokenId);
    }
}
