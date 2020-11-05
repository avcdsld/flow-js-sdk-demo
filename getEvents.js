const fcl = require('@onflow/fcl');
const sdk = require('@onflow/sdk');
const config = require('./config');

const getEvents = async () => {
  fcl.config().put('accessNode.api', config.apiUrl);

  // 最新ブロック取得
  const latestBlockResponse = await fcl.send([ fcl.getLatestBlock() ]);
  const latestBlock = await fcl.decode(latestBlockResponse);
  const toBlock = latestBlock.height;
  const fromBlock = toBlock - 500;

  // MomentListed イベント取得
  const contractAddress = 'c1e4f4f4c4257510'; // 先頭に '0x' はつけない
  const contractName = 'Market';
  const eventName = 'MomentListed';
  const eventType = `A.${contractAddress}.${contractName}.${eventName}`;
  const eventsResponse = await fcl.send(await sdk.build([sdk.getEvents(eventType, fromBlock, toBlock)]));
  const events = await fcl.decode(eventsResponse);
  console.log(events);
}

getEvents();