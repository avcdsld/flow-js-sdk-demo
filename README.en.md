# Flow JavaScript SDK Demo

Below is a sample code to get the event from the NBA TopShot code contract.

## Requirement
- Node 12

## Usage
### install
```sh
$ yarn install
```

### Get Events（Get events happened in recent 500 blocks（Approx 500 seconds））
```sh
$ node getEvents
```

#### Example of the result
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

### Receive list of NFT and Metadata
```sh
$ node getMetadata
```

#### Example of result
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

## About code

### Set Client

Client for JavaScript is available as npm package called [@onflow/fcl](https://www.npmjs.com/package/@onflow/fcl) .

Set address of node to the client.

```js
const fcl = require('@onflow/fcl');
fcl.config().put('accessNode.api', config.apiUrl);
```

You can currently use the Flow official node or the one provided by Blocto to access main-net. Below is the detail.

Flow:  "https://access-mainnet-beta.onflow.org"
Blocto: "https://flow-access-mainnet.portto.io" 


### Retreive Events

We can retrieve the events recorded in Flow blockchain with the following code.

```js
const sdk = require('@onflow/sdk'); // イベント取得の interaction オブジェクトを生成するために必要

const eventsResponse = await fcl.send(await sdk.build([ sdk.getEvents(eventType, fromBlock, toBlock) ]));
```

The arguments for `sdk.getEvents()` must be set with three arguments which are, event type, from block number, and to block number.

The event type must be in the following format. Note that the contract address does not start with "0x".

```
A.＜Contract Address＞.＜Contract Name＞.＜Event Name＞

Example: A.c1e4f4f4c4257510.Market.MomentListed
```
You can find the contract name and event name from the source code of the target contract.
[The one for NBA Top Shot can be available here.](https://github.com/dapperlabs/nba-smart-contracts/tree/f8def3/contracts)。

The result which we received from the library is not human readable.
But you can convert with the following code to make it easier to read.
However, this conversion removes information such as block numbers, etc..., so if you want to use these, you need to look at the initial results.

```js
const events = await fcl.decode(eventsResponse);
```


### Retrieve the list of token IDs.

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

In the above code,  what we're doing is as follows.
- Import a TopShot contract from address 0x0b2a3299cc857e29
- Ensure the NFT collection (/public/MomentCollection) located in the address's storage passed as the argument.
- if there is a collection, retrieve the capabilities(Object to Interact with the collection).
- Get a list of NFT Ids in the collection.

And send this script to the nodes using the client by the below code.

```js
const types = require('@onflow/types'); // 引数に渡す型の情報

const idsResponse = await fcl.send([
  fcl.script(＜Cadence のスクリプト＞)
  fcl.args([ fcl.arg(＜ユーザーのアドレス＞, types.Address) ])
]);
const ids = await fcl.decode(idsResponse);
```

Cadence コードの引数には、`fcl.arg()` を使って、値と型を渡します。


### Retreive metadata of NFT



Currently,  metadata for Flow NFT is not standardized, still under discussion. In the case of NBA Top Shot, you can get the metadata by querying the `TopShot contract` with the token `playID`. `playId` is a unique ID which all NBA Top Shot token has, as a token ID in ERC721.

The cadence script is as follows.
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

What it does is ...

- Import a `TopShot` contract from address 0x0b2a3299cc857e29
- Ensure the NFT collection (`/public/MomentCollection`) located in the address's storage passed as the argument.
- If there is a collection, get the NFT reference using the token ID 
- Get metadata from a TopShot contract using the `playID` in the NFT properties.
- Send script using the client to the node.

このスクリプトも、先ほどの ID 一覧取得のときと同じように、クライアントから下記のように送信します。

```js
const types = require('@onflow/types'); // 引数に渡す型の情報

const metadataResponse = await fcl.send([
  fcl.script(＜Cadence のスクリプト＞)
  fcl.args([ fcl.arg(＜ユーザーのアドレス＞, types.Address), fcl.arg(＜トークンID＞, types.UInt64) ])
]);
const metadata = await fcl.decode(metadataResponse);
```


## For Detail
- Flow JS SDK のドキュメント（ちょっと情報が足りないですが…）: https://github.com/onflow/flow-js-sdk
- Cadence 言語のドキュメント: https://docs.onflow.org/tutorial/cadence/00-introduction/
- NBA Top Shot コントラクトのコード（Cadence 言語）: https://github.com/dapperlabs/nba-smart-contracts/tree/f8def3/contracts
- Flow コミュニティフォーラム（不明点はここで聞けます！）: https://forum.onflow.org/
- Discord チャンネル（不明点はここで聞けます！）: https://discord.gg/yY4zbvf
- YouTube チャンネル: https://www.youtube.com/channel/UCs9r5lqmYQsKCpLB9jKwocg
- Cadence 言語入門（私が日本語でまとめたスライド資料です）: https://speakerdeck.com/avcdsld/flow-cadence-introduction

もしくは、私の twitter: [@arandoros](https://twitter.com/arandoros) （わかる範囲で回答できます！）
