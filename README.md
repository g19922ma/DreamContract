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

もう一つ、後で使いますので以下を入力してください。
```shell
npx hardhat vars set WEBHOOK_URL_WHEN_TIMEELASPLED
```
値として、以下を入力してください
```shell
https://webhook.site/e368094e-49d7-4cae-aef4-b3291d0c4dca
```

2025/4/25追記。上記のアドレスは有効期限があるようです。もう無効ですと言われたら、　
https://webhook.site/
にアクセスすれば新しいアドレスを作ってくれます。そのアドレスで読み替えます。

そして、ブラウザで以下のURLを開いておいてください。これを「webhook受信テストサイト」と呼びます。あとで出てきます。
```shell
https://webhook.site/#!/view/e368094e-49d7-4cae-aef4-b3291d0c4dca/9153c89d-a520-490b-9b54-ade7c1d88c85/1
```


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

としてみてください。1分おきに、
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

ローカルネットでのでテストは省略します。
直接テストネットにデプロイします。

```shell
npx hardhat run scripts/mintSpecialNFT.js --network polygonAmoy
```

```shell
（前略）
Minted NFT with tokenId: 1
```
tokenID 1 で期間限定NFTが発行されました。
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
  Webhook triggered: 200
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

5分後、token ID 1の有効期限が切れて、「有効期限が切れたよ！」というイベントが発行されました。そしてそれをlisten.jsが捉えることができました。

さらに、「webhook受信テストサイト」を見てください。listen.jsからの通信が受信されていることが確認できると思います。
webhookという仕組みを用いて、「有効期限が切れたよ！」という情報に基づいて一般的な通信手段で通信が行えました。これを応用してプログラムを改造すれば、有効期限が切れたらメール通知したり、物理的な鍵を施錠したりといったことが行えます。

地味なんですけど、実行はここまで。これから、今行ったことの背後にあることについて解説していきます。

## ブロックチェーンの基本的なしくみ

ブロックチェーンは、一定時間ごと（Polygonだと2秒くらい）に、まとまった量のデータの塊を記録していくデータベースです。このデータの塊をブロックといいます。新しいブロックが作られるたび、そのデータが正しいかどうかを全世界のコンピュータが監視しているので、改ざんが困難です。前回のNFT演習で「NFTをAmoyにデプロイする」という作業をしましたが、それは世界で唯一のものである「PolygonのテストネットAmoy」というブロックチェーンにあなたのNFTを書き込んだということです。

## スマートコントラクトの基本的なしくみ

スマートコントラクトは、ブロックチェーンに書き込まれたプログラムです。プログラムの実行中の状態（変数の値など）をブロックチェーンに書き込んで更新していきます。その値も全世界のコンピュータで監視して、改ざんが困難になっています。先程のスマートコントラクトでは、NFTとしての基本的な情報（所有権は誰にあるかとか）に加えて、「期限切れである」という状態をスマートコントラクトで管理しました。

## 今回作った「期限つきNFT」の解説

contracts/SpecialNFT.sol 

を眺めてみましょう。前回同様、ERC721を継承して作っているので、これはNFTです。metamaskに表示したり、OpenSeaで表示、流通したりできます。
今日のポイントとなる関数は、「期限」を引数にとってNFTを作るmint()と、期限が過ぎたときに実行する triggerTimeElapsed()と、期限が過ぎているかどうか判定する読み取り専用関数isTimeElapsed()の3つです。


```shell
function mint(address recipient, uint256 xMinutes) external returns (uint256) {...}
function triggerTimeElapsed(uint256 tokenId) external {...}
function isTimeElapsed(uint256 tokenId) external view returns (bool) {...}
```

mint()については先程説明しました。期限付きのNFTを作ります。

isTimeElapsed()関数は 「view」と書いてありますね。これが読み取り専用関数です。スマートコントラクトの関数は呼び出すときにガス代がかかりますが、読み取り専用関数はガス代がかかりません。先程のlisten.jsは、このisTimeElapsed()を外部から定期的に無料で呼び出して、期限が過ぎているかどうかを確認していたわけです。

では「期限が過ぎたときに実行する triggerTimeElapsed()」とは一体何者でしょうか？これはこのNFTの変数であるinfo.eventEmitted=trueにして、期限が切れたことをブロックチェーンに書き込みます。同時に、「期限が切れたよ！」というイベントを発行します。このイベントをブロックチェーンの外で監視しているプログラムに、通知が飛びます。


```shell
info.eventEmitted = true;
emit TimeElapsed(tokenId);
```

実際に「期間限定NFT」にするには、ここに「NFT自体を削除する」とか、「NFTをオーナーに自動的に送りつける」とか、「所有権の移動ができなくなる」といったコードを書くべきですが、今回は省略しました。

もし借金返済のスマートコントラクトであれば、この関数の中で自動的にお金の所有権を移動させるコードを書けば、「返済期限が来たら自動的にお金を返却する」のような処理もかけます。


では、triggerTimeElapsed()は誰が呼び出すのでしょうか。理想的には、「期限」が過ぎたことをブロックチェーン自体が捉えて、triggerTimeElapsed()が実行されてほしいですよね。ところがそうではないんです。listen.jsのような外部プログラムが時々ブロックチェーンを調べて（isTimeElapsed()を呼び出して）、お、期限が過ぎたぞ、わかったら、さらにガス代を支払ってtriggerTimeElapsed()を呼び出し、info.eventEmitted=trueとブロックチェーンに書き込む（更新する）必要があるんです！！私はこの実態を知ったときにかなり衝撃を受けました。

つまりスマートコントラクトというのは、これまで「自動的に契約を履行するものである」と説明しておりましたが、厳密には自動的ではないということなんです。
「実行するとなったら確実に実行され、他者の介入や改ざんを許さない」ということは確かなのですが、「自主的に実行する」という機能はありません。
「スマートコントラクトは怠惰である」と表現されいている解説を読んだことがあります。それはスマートコントラクトの実行（のきっかけ）というのが原理的に他力本願であり、自主的でないことを表した表現です。スマートコントラクトはブロックチェーンの使い方の一つであり、ブロックチェーンというのはデータベース、つまりただのデータの塊ですので、文字の塊であるプログラムやデータの記録はできても、プログラムの実行主体にはなれないということです。

イメージとしては、ブロックチェーンは「預言書」のようなものです。「世界に危機が訪れたとき、勇者が現れるであろう」などと書かれています。書かれているだけで、実現能力はありません。俗世に居る預言書の信者たちが、律儀に預言を実現しようと活動することで、預言が真実となるのです。「信者たち」は信仰心によって律儀に預言を実現しようとしますが、実際のところは、「triggerTimeElapsed()を実行してくれた人には仮想通貨をXXだけ差し上げます」という仕組みにして、競争的に預言を実現してもらえるようなインセンティブを設計することで、確実な契約の履行を図ることもあるようです。

より汎用的な解決策として、「smartcontract automation」という支援技術/サービスがあります。これは、ブロックチェーンの外側のネットワークにおいてbotを実行してブロックチェーンを定期的に監視し、スマートコントラクトの関数を適切なタイミングで実行する仕組みです。botの実態はlisten.jsのようなプログラムです。botの実行をインターネット上に分散的に行うことでbot自体が攻撃やトラブル等で停止しないような仕組みを備えているものが多いようです。このようなサービスを用いれば、自分でサーバーをたててlisten.jsを実行し続けなくても、スマートコントラクトの運用が安定して可能になります。

以上の背景をもとに、listen.jsの中身を見ていきましょう。
listen.jsは、実は２つのプログラムを一つにまとめたものです。

- (1)定期的にisTimeElapsed()を実行し、trueだったらガス代を払ってtriggerTimeElapsed()を呼び出す。
- (2)ブロックチェーンを監視し、TimeElapsedイベントがおきたらそれに反応してなにか処理を行う。

(1)が今話した、スマートコントラクトが適切に履行されるための裏方のbotです。
(2)は、その実行結果を活用したい人のためのプログラムです。

詳しい仕組みは以下です：

(1)定期的にisTimeElapsed()を呼び出して、期限が切れていたらtriggerTimeElapsed()を実行します。

```shell
async function checkTokens() {
(中略)
        const conditionMet = await contract.isTimeElapsed(tokenId);
        console.log(`Check token ID ${tokenId}:`, conditionMet);
        if (conditionMet) {
          console.log(`Condition met for token ID ${tokenId}. Sending triggerTimeElapsed transaction...`);
          const tx = await contract.triggerTimeElapsed(tokenId);
          console.log(`Transaction sent for token ID ${tokenId}. Waiting for confirmation...`);
          await tx.wait();
(中略)
  }
```

(2)ブロックチェーンから発出されるTimeElapsedイベントを監視して、受信したらなにかプログラムを実行します。
```shell
// TimeElapsed イベントの監視
  contract.on("TimeElapsed", async (tokenId, event) => {
    console.log("TimeElapsed event captured:");
(中略)
  });
```

スマートコントラクトにはもう一つ残念な点があって、上記(2)のプログラムは、triggerTimeElapsed()が呼び出され、イベントが発火した瞬間にしかリアルタイムに受信できません。その瞬間にlisten.jsが動いていないといけないんです。もしイベントが発火した瞬間にlisten.jsが動いていおらず、しばらくたった後にlisten.jsを実行しても、さかのぼってイベントを受信することはできません。

しかし対応策はあります。イベントのリアルタイムな捕捉ができなくても、「このブロックでイベントは発火した」という記録はブロックチェーンに記録されているので、過去のブロックに遡って中身を調べて（これは読み取り関数なので無料です）、イベントが発火したかどうかを取得することができます。定期的に、たとえば1日おきに、ブロックチェーンにアクセスして、最近1日の間に更新されたブロックを読み込んでデータベースに結果を保存するようにするサーバーを立てれば、秒単位でイベントをキャッチしたいような用途でなければ、十分実用的であるかと思います。

本日はここまでです。
