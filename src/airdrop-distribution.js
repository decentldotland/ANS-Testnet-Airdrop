import { arweave, getNetwork } from "./utils/arweave.js";
import { validatePeople } from "./airdrop-whitelisting.js";
import { ANS_TESTNET_SWC } from "./utils/contracts.js";
import { readContract } from "smartweave";
import "./utils/setEnv.js";

import {Chalk} from 'chalk';

const chalk = new Chalk({level: 1});


export async function distributeLabels(pk) {
  const jwk = pk || process.env.JWK;
  console.log(chalk.green(`ANS testnet contract: ${ANS_TESTNET_SWC}\n\n`));
  const whitelisted_users = (await validatePeople()).eligible;
  let i = 1;

  const list =  [];
  const ans_state = (await readContract(arweave, ANS_TESTNET_SWC)).users;
  const ans_labels = ans_state.map(user => user.currentLabel);
  const airdrop_list = (await validatePeople()).eligible;
  const airdrop_labels = airdrop_list.map(user => user.username);

  for (let name of airdrop_labels) {
    if (!ans_labels.includes(name)) {
      list.push(name);
    }
  }
  const to_airdrop = airdrop_list.filter(user => list.includes(user.username))
  console.log(to_airdrop.length)


  for (let user of to_airdrop) {
    const address = user.address;
    const label = user.username;

    const interaction = `{"function": "transfer", "target": "${address}", "label": "${label}"}`

    const tx = await arweave.createTransaction(
      {
        data: String(Date.now()),
      },
      JSON.parse(jwk)
    );

    tx.reward = (+tx.reward * 7).toString();

    tx.addTag("App-Name", "SmartWeaveAction");
    tx.addTag("App-Version", "0.3.0");
    tx.addTag("Contract", ANS_TESTNET_SWC);
    tx.addTag("Input", interaction);

    await arweave.transactions.sign(tx, JSON.parse(jwk));
    await arweave.transactions.post(tx);

    console.log(chalk.green(`label: ${label}.ar || label count: ${i} || target: ${address} || transfer TXID: ${tx?.id}\n`));
    i++
  }
}


distributeLabels();