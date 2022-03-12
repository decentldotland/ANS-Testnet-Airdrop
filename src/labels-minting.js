import { arweave, getNetwork } from "./utils/arweave.js";
import { validatePeople } from "./airdrop-whitelisting.js";
import { ANS_TESTNET_SWC } from "./utils/contracts.js";
import { readContract } from "smartweave";
import "./utils/setEnv.js";

import {Chalk} from 'chalk';

const chalk = new Chalk({level: 1});

export async function mintLabels(pk) {
  const jwk = pk || process.env.JWK;

  const whitelisted_users = (await validatePeople()).eligible;

  console.log(chalk.green(`ANS testnet contract: ${ANS_TESTNET_SWC}`));

  let i = 1;

  for (let user of whitelisted_users) {
    const label = user.username;
    const interaction = `{"function": "mint", "username": "${label}"}`

    const tx = await arweave.createTransaction(
      {
        data: String(Date.now()),
      },
      JSON.parse(jwk)
    );

    tx.reward = (+tx.reward * 5).toString();

    tx.addTag("App-Name", "SmartWeaveAction");
    tx.addTag("App-Version", "0.3.0");
    tx.addTag("Contract", ANS_TESTNET_SWC);
    tx.addTag("Input", interaction);

    await arweave.transactions.sign(tx, JSON.parse(jwk));
    await arweave.transactions.post(tx);

    console.log(chalk.green(`label: ${label} || label count: ${i} || minting TXID: ${tx?.id}\n`));
    i++
  }
}

mintLabels();



