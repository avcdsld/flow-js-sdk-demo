const fcl = require('@onflow/fcl');
const types = require('@onflow/types');
const config = require('./config');

const getMetadata = async () => {
  fcl.config().put('accessNode.api', config.apiUrl);

  // ユーザーのトークンID一覧取得
  const idsResponse = await fcl.send([
    fcl.script(`
      import TopShot from 0x0b2a3299cc857e29

      pub fun main(account: Address): [UInt64] {
        let acct = getAccount(account)
        let collectionRef = acct.getCapability(/public/MomentCollection)!
                              .borrow<&{TopShot.MomentCollectionPublic}>()!
        return collectionRef.getIDs()
      }
    `),
    fcl.args([ fcl.arg(config.testUserAddress, types.Address) ]),
  ]);
  const ids = await fcl.decode(idsResponse);
  console.log('ids', ids);

  // トークンのメタデータ取得
  const id = ids[0];
  const metadataResponse = await fcl.send([
    fcl.script(`
      import TopShot from 0x0b2a3299cc857e29

      pub fun main(account: Address, id: UInt64): {String: String} {
        let collectionRef = getAccount(account).getCapability(/public/MomentCollection)!
                              .borrow<&{TopShot.MomentCollectionPublic}>() ?? panic("Collection doesn't exist")
        let token = collectionRef.borrowMoment(id: id) ?? panic("Moment doesn't exist")
        let metadata = TopShot.getPlayMetaData(playID: token.data.playID) ?? panic("Play doesn't exist")
        return metadata
      }
    `),
    fcl.args([ fcl.arg(config.testUserAddress, types.Address), fcl.arg(id, types.UInt64) ]),
  ]);
  const metadata = await fcl.decode(metadataResponse);
  console.log(`metadata of id:${id}`, metadata);

}

getMetadata();