# Flow JavaScript SDK Demo

Flow ブロックチェーンのメインネットから、NBA TopShot のコントラクトのイベントを取得するサンプルコードです。

## 要件
- Node 12

## 使い方
### インストール
```sh
$ yarn install
```

### イベント取得（直近 500 ブロック（約 500 秒）の出品イベントを取得します）
```sh
$ node getEvents
```

#### 実行結果の例
```sh
[
  {
    type: 'A.c1e4f4f4c4257510.Market.MomentListed',
    transactionId: '499d705e55667bba4e837206b194b14e4ed5abbe6024124903b6244a6fee4ba2',
    transactionIndex: 0,
    eventIndex: 3,
    data: { id: 563763, price: '15.00000000', seller: '0xec2ac764a1730444' }
  },
  {
    type: 'A.c1e4f4f4c4257510.Market.MomentListed',
    transactionId: '9bc3ccc1af26ebf25d2ccc33db50f69b8843ca891464c13c313f8930e886dd97',
    transactionIndex: 0,
    eventIndex: 3,
    data: { id: 506014, price: '13.00000000', seller: '0xa921d5cbbccf4eac' }
  }
]
```

### NFT 一覧とメタデータ取得（あるアドレスの NFT 一覧と、メタデータを 1 つ表示します）
```sh
$ node getMetadata
```

#### 実行結果の例
```sh
ids [
  205853, 208564, 202802,
  209931, 200148, 210290,
  232849, 241782, 228232,
  144656, 142270, 144352,
  145753, 146874
]
metadata of id:205853 {
  FullName: 'Lou Williams',
  FirstName: 'Lou',
  LastName: 'Williams',
  Birthdate: '1986-10-27',
  Birthplace: 'Memphis, TN, USA',
  JerseyNumber: '23',
  DraftTeam: 'Philadelphia 76ers',
  DraftYear: '2005',
  DraftSelection: '45',
  DraftRound: '2',
  TeamAtMomentNBAID: '1610612746',
  TeamAtMoment: 'Los Angeles Clippers',
  PrimaryPosition: 'SG',
  PlayerPosition: 'G',
  Height: '73',
  Weight: '175',
  TotalYearsExperience: '14',
  NbaSeason: '2019-20',
  DateOfMoment: '2020-01-05 20:30:00 +0000 UTC',
  PlayCategory: 'Handles',
  PlayType: 'Handles',
  HomeTeamName: 'Los Angeles Clippers',
  AwayTeamName: 'New York Knicks',
  HomeTeamScore: '135',
  AwayTeamScore: '132'
}
```

## コードの説明

### クライアントの設定

JavaScript 用のクライアントが、[@onflow/fcl](https://www.npmjs.com/package/@onflow/fcl) という npm パッケージで提供されています。

下記のように読み込んで、アクセスするノードの URL を設定します。

```js
const fcl = require('@onflow/fcl');
fcl.config().put('accessNode.api', config.apiUrl);
```

現在、メインネットのノードとして、Flow 公式の `https://access-mainnet-beta.onflow.org` または [Blocto ウォレット](https://blocto.portto.io/)が提供する `https://flow-access-mainnet.portto.io` を利用可能です。


### イベントの取得

次のようなコードで、チェーン上のイベントを取得できます。

```js
const sdk = require('@onflow/sdk'); // イベント取得の interaction オブジェクトを生成するために必要

const eventsResponse = await fcl.send(await sdk.build([ sdk.getEvents(eventType, fromBlock, toBlock) ]));
```

`sdk.getEvents()` の引数には、イベントタイプ、from ブロック番号、 to ブロック番号を指定します。

イベントタイプは、下記の形式です。コントラクトアドレスは、先頭に「0x」をつけないことに注意。

```
A.＜コントラクトアドレス＞.＜コントラクト名＞.＜イベント名＞

例: A.c1e4f4f4c4257510.Market.MomentListed
```

コントラクト名とイベント名は、対象のコントラクトのコードから確認します。[NBA TopShot のコードはここで公開されています](https://github.com/dapperlabs/nba-smart-contracts/tree/f8def3/contracts)。

イベント取得の結果は、少し扱いにくい構造をしており、下記のコードで変換して読みやすくできます。ただ、この変換によって、ブロック番号などの情報が消えてしまうので、これらを使いたい場合は元の結果をみる必要があります。

```js
const events = await fcl.decode(eventsResponse);
```


### トークンID一覧の取得

Flow の NFT は、所有するアカウントのストレージに直接格納されています。あるアカウント（アドレス）が所有する NFT のトークンID一覧は、Cadence 言語で書かれた下記のスクリプトをノードに送信することで取得できます。

```
import TopShot from 0x0b2a3299cc857e29

pub fun main(account: Address): [UInt64] {
  let acct = getAccount(account)
  let collectionRef = acct.getCapability(/public/MomentCollection)!
                        .borrow<&{TopShot.MomentCollectionPublic}>()!
  return collectionRef.getIDs()
}
```

ここでは Cadence 言語の詳細は説明しませんが、上記のコードで行っていることは、次のとおりです。

- アドレス `0x0b2a3299cc857e29` から `TopShot` コントラクトをインポート
- 引数で受け取ったアドレスのストレージに、NFT のコレクション（`/public/MomentCollection`）があることを確認
- コレクションがあれば、その capability（操作するためのオブジェクト）を取得
- コレクションから NFT の ID 一覧を取得

このスクリプトを、クライアントを使って、下記のようにノードに送信します。

```js
const types = require('@onflow/types'); // 引数に渡す型の情報

const idsResponse = await fcl.send([
  fcl.script(＜Cadence のスクリプト＞)
  fcl.args([ fcl.arg(＜ユーザーのアドレス＞, types.Address) ])
]);
const ids = await fcl.decode(idsResponse);
```

Cadence コードの引数には、`fcl.arg()` を使って、値と型を渡します。


### NFT のメタデータの取得

現在の Flow の NFT は、まだメタデータの標準があまり議論されていませんが、NBA TopShot の場合は、`TopShot` コントラクトに、トークンの `playID` を使って問い合わせることでメタデータを取得できます。

取得するための Cadence のスクリプトは下記です。

```js
import TopShot from 0x0b2a3299cc857e29

pub fun main(account: Address, id: UInt64): {String: String} {
  let collectionRef = getAccount(account).getCapability(/public/MomentCollection)!
                        .borrow<&{TopShot.MomentCollectionPublic}>() ?? panic("Collection doesn't exist")
  let token = collectionRef.borrowMoment(id: id) ?? panic("Moment doesn't exist")
  let metadata = TopShot.getPlayMetaData(playID: token.data.playID) ?? panic("Play doesn't exist")
  return metadata
}
```

コードの内容としては、次の処理を行っています。

- アドレス `0x0b2a3299cc857e29` から `TopShot` コントラクトをインポート
- 引数で受け取ったアドレスのストレージに、NFT のコレクション（`/public/MomentCollection`）があることを確認
- コレクションがあれば、引数で受け取ったトークンID を使って、NFT の参照を取得
- NFT のプロパティにある `playID` を使って、`TopShot` コントラクトからメタデータを取得

このスクリプトも、先ほどの ID 一覧取得のときと同じように、クライアントから下記のように送信します。

```js
const types = require('@onflow/types'); // 引数に渡す型の情報

const metadataResponse = await fcl.send([
  fcl.script(＜Cadence のスクリプト＞)
  fcl.args([ fcl.arg(＜ユーザーのアドレス＞, types.Address), fcl.arg(＜トークンID＞, types.UInt64) ])
]);
const metadata = await fcl.decode(metadataResponse);
```


## もっと知りたい方は・・・
- Flow について: https://ja.onflow.org/primer
- Flow JS SDK のドキュメント（ちょっと情報が足りないですが…）: https://github.com/onflow/flow-js-sdk
- Cadence 言語のドキュメント: https://docs.onflow.org/tutorial/cadence/00-introduction/
- NBA TopShot コントラクトのコード（Cadence 言語）: https://github.com/dapperlabs/nba-smart-contracts/tree/f8def3/contracts
- Flow コミュニティフォーラム（不明点はここで聞けます！）: https://forum.onflow.org/
- Discord チャンネル（不明点はここで聞けます！）: https://discord.gg/yY4zbvf
- YouTube チャンネル: https://www.youtube.com/channel/UCs9r5lqmYQsKCpLB9jKwocg
- Cadence 言語入門（私が日本語でまとめたスライド資料です）: https://speakerdeck.com/avcdsld/flow-cadence-introduction

もしくは、私の twitter: [@arandoros](https://twitter.com/arandoros) （わかる範囲で回答できます！）
