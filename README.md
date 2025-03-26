# Solidityによるスマートコントラクト演習2
## 期間限定NFTを作ってみよう

前回はNFTを作りましたね。

https://github.com/qurihara/SmartContractTest


今回はNFTを改造して、一定時間が経過すると性質が変化するスマートコントラクトを作ってみましょう。たとえば一定期間を過ぎたら借金を返済しないといけないとか、有効期限が来たら効果が失われるとか、そういうことが実現できます。

また、スマートコントラクトはブロックチェーン上に記録されるものですが、ブロックチェーン上での状態の変化を、ブロックチェーンの外から監視する方法も実践します。

## まずはためしてみましょう。


今回準備したサンプルプロジェクトをgit cloneします。

```shell
git clone https://github.com/g19922ma/DreamContract.git
cd DreamContract
```

今回準備したサンプルプロジェクトのセットアップをします。

```shell
npm install
```

今回使うスマートコントラクトは、
contracts/SpecialNFT.sol 
です。基本的にはNFTなんですけど、特別な機能が付与されています。後で説明します。
コンパイルします。

```shell
npx hardhat compile
```

以下のように表示されていればOKです。

```shell
Compiled 13 Solidity files successfully (evm target: paris).
```

OKならテストを実行し、問題ないことを確認します。

```shell
npx hardhat test
```

次にローカルネットワークにデプロイ（≒ブロックチェーンに載せて実行する）します。前回も紹介しましたが、ローカルネットワークというのはあなたのPC上に作られた自分だけのテスト環境です。テストネットとはちがいます。テストネットは世界に一つしかありません。ローカルネットワークはあなたのPC上にあり、いくらでも作れます。何をやってもOKです。

```shell
npx hardhat run scripts/deploySpecialNFT.js
```

```shell
Deploying contracts with account: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaa
SpecialNFT deployed to: 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
```
のように表示されれば成功です。

いよいよテストネットにデプロイします。これは自分の口座のテストネットPOLを消費します。
テストネットにアクセスするには、AlchemyのAPIキーとMetamaskのウォレットの秘密鍵情報が必要です。これは前回、環境変数としてセットしました。それがまだ使えるか確認しましょう。


```shell
npx hardhat vars get ALCHEMY_API_KEY
npx hardhat vars get ACCOUNT_PRIVATE_KEY
```

それぞれ長い文字列が表示されていればOKです。

それではテストネットにデプロイします。


```shell
npx hardhat run scripts/deploySpecialNFT.js --network polygonAmoy
```

すると

```shell
Deploying contracts with account: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaa
SpecialNFT deployed to: 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
```

のように表示されれば成功です。私の環境で0.050334POL消費しました。（metamaskで確認できます）

今回デプロイしたのも前回同様NFTなので、metamaskにインポートすれば表示できますよ！（今回は省きます）

前回はNFTを発行後にmetamaskで「コントラクトアドレス」を取得しましたが、今回のプログラムその作業が不要です。上記の

```shell
SpecialNFT deployed to: 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
```

の　0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbb　がコントラクトアドレスです。今後のプログラム実行のために、環境変数にコントラクトアドレスを登録します。（前回はCONTRACT_ADDRESSというコントラクトアドレスでしたが今回は違うスマートコントラクトなので違う名前にしてます）

```shell
npx hardhat vars set CONTRACT_ADDRESS_FOR_SNFT
```

次にNFTを鋳造（mint）します。金貨の発行みたいなニュアンスです。
scripts/mintSpecialNFT.js を見てみましょう。

```shell
  const xMinutes = 5;
  const mintTx = await specialNFT.mint(signer.address, xMinutes);
  const receipt = await mintTx.wait();
```

この箇所でmintを実行するのですが、mint時にxMinutesという引数を渡します。実はこのNFTは、mintしたあとxMinutes後に「失効する」という機能が実装されています。現在は、xMinutes=5なので、5分後に失効する設定です。失効しているかどうかを調べるために、mintをデプロイする前に、「失効しているかどうかを調べる」コードを準備します。

```shell
npx hardhat run scripts/listen.js --network polygonAmoy
```

としてみてください。1分後から1分おきに、
```shell
Error for token ID 0: execution reverted: Token does not exist
Error for token ID 1: execution reverted: Token does not exist
Error for token ID 2: execution reverted: Token does not exist
Error for token ID 3: execution reverted: Token does not exist
Error for token ID 4: execution reverted: Token does not exist
Error for token ID 5: execution reverted: Token does not exist
Error for token ID 6: execution reverted: Token does not exist
Error for token ID 7: execution reverted: Token does not exist
Error for token ID 8: execution reverted: Token does not exist
Error for token ID 9: execution reverted: Token does not exist
Error for token ID 10: execution reverted: Token does not exist
```
と出ます。（control-cで止まりますが、止めなくてOKです。）

これは、定期的に現在デプロイしたNFTのmint状況、そして有効か無効かを調べるコードです。まだ一つもmintしていないので、このような表示になります。
この状態で別のターミナルを開いて、（Cursorならターミナルウインドウの右の「＋」ボタンを押せばOK。）mintしてみましょう。


まずローカルネットでテストします。

```shell
npx hardhat run scripts/mintSpecialNFT.js 
```

次にテストネットにデプロイします。

```shell
npx hardhat run scripts/mintSpecialNFT.js --network polygonAmoy
```


あとは先程実行した　scripts/listen.js　のターミナルを眺めて待ちます。

```shell
  Error for token ID 0: execution reverted: Token does not exist
  Check token ID 1: false
  Error for token ID 2: execution reverted: Token does not exist
  Error for token ID 3: execution reverted: Token does not exist
  Error for token ID 4: execution reverted: Token does not exist
  Error for token ID 5: execution reverted: Token does not exist
  Error for token ID 6: execution reverted: Token does not exist
  Error for token ID 7: execution reverted: Token does not exist
  Error for token ID 8: execution reverted: Token does not exist
  Error for token ID 9: execution reverted: Token does not exist
  Error for token ID 10: execution reverted: Token does not exist
```

token ID 1が発行されましたが、まだ有効期限切れしてないので falseと表示されています。

```shell
  Error for token ID 0: execution reverted: Token does not exist
  Check token ID 1: true
  Condition met for token ID 1. Sending triggerTimeElapsed transaction...
  Transaction sent for token ID 1. Waiting for confirmation...
  triggerTimeElapsed executed successfully for token ID: 1
  TimeElapsed event captured:
  Token ID: 1
  Error for token ID 2: execution reverted: Token does not exist
  Error for token ID 3: execution reverted: Token does not exist
  Error for token ID 4: execution reverted: Token does not exist
  Error for token ID 5: execution reverted: Token does not exist
  Error for token ID 6: execution reverted: Token does not exist
  Error for token ID 7: execution reverted: Token does not exist
  Error for token ID 8: execution reverted: Token does not exist
  Error for token ID 9: execution reverted: Token does not exist
  Error for token ID 10: execution reverted: Token does not exist
```

5分後、token ID 1の有効期限が切れて、それをlisten.jsが捉えることができました。プログラムを改造すれば、有効期限が切れたらメール通知したり、物理的な鍵を施錠したりといったことが行えます。

地味なんですけど、実行はここまで。これから、今行ったことの背後にあることについて解説していきます。

## ブロックチェーンの基本的なしくみ

ブロックチェーンは、一定時間ごと（Polygonだと5秒くらい）に、まとまった量のデータの塊を記録していくデータベースです。このデータの塊をブロックといいます。新しいブロックが作られるたび、そのデータが正しいかどうかを全世界のコンピュータが監視しているので、改ざんが困難です。前回のNFT演習で「NFTをAmoyにデプロイする」という作業をしましたが、それは世界で唯一のものである「PolygonのテストネットAmoy」というブロックチェーンにあなたのNFTを書き込んだということです。

（執筆中）

