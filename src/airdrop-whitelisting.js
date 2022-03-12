import { arweave, getNetwork } from "./utils/arweave.js";
import { VID_SWC } from "./utils/contracts.js";
import { readContract } from "smartweave";
import { poppingChar, allowedCharCodes, usersOwningDuplicatedUsername } from "./utils/constants.js";



export async function getVertoPeople() {
  const blockheight = (await getNetwork()).height;

  const state = await readContract(arweave, VID_SWC);
  const people = state.people;

  return {
    people,
    blockheight
  }
}

async function _validateUsername(username) {
  const caseFolded = username.toLowerCase();
  const normalizedUsername = caseFolded.normalize("NFKC").trim();
  const afterPopping = await tryAdditionalPreValidation(normalizedUsername);

  const stringCharcodes = afterPopping
    .split("")
    .map((char) => char.charCodeAt(0));

  for (let charCode of stringCharcodes) {
    if (!allowedCharCodes.includes(charCode)) {
      return false;
    }
  }

  if (afterPopping.length < 2 || afterPopping.length > 15) {
    return false;
  }

  return afterPopping;
}

async function tryAdditionalPreValidation(username) {
  if (username.endsWith(".eth")) {
    username = username.replace(".eth", "");
  }

  if (username.endsWith(".bit")) {
    username = username.replace(".bit", "");
  }

  const splitted = username.split("");

  for (let char of splitted) {
    if (poppingChar.includes(char)) {
      const charIndex = splitted.findIndex((chars) => chars === char);
      splitted.splice(charIndex, 1);
    }
  }

  return splitted.join("");
}

function _getMintingCost(username) {
  const len = username.length;
  const UP = 1; // unit price = 1 DLT -testnet-
  const unitsCount = 16 - len; // (maxLen + 1) - toMintLen

  return unitsCount * UP;
}

export async function validatePeople() {
  const { people, blockheight } = await getVertoPeople();

  const eligible = [];
  const not_eligible = [];
  const initial_people_count = people.length;

  const people_with_duplication_index = people.findIndex(person => usersOwningDuplicatedUsername.includes(person.addresses[0]));
  const people_without_duplication = people.splice(people_with_duplication_index, 1);
  not_eligible.push(people_without_duplication[0]);


  for (let persona of people) {
    const validated_username = await _validateUsername(persona.username);
    if (validated_username) {
      eligible.push({
        username: validated_username,
        address: persona.addresses[0],
        cost: _getMintingCost(validated_username),
      });
    } else {
      not_eligible.push({
        username: persona.username,
        address: persona.addresses[0]
      });
    }
  }
  const total_eligibles_cost = eligible
    .map((a) => a.cost)
    .reduce((a, b) => a + b, 0);
  const total_not_eligible_rewards = not_eligible
    .map((a) => a.cost)
    .reduce((a, b) => a + b, 0);

  console.log(`total VIDs: ${initial_people_count}`);
  console.log(`eligible: ${eligible.length}`);
  console.log(`not eligible: ${not_eligible.length}\n`);
  console.log(`snapshot blockheight: ${blockheight}`);
  console.log(`total minting cost: ${total_eligibles_cost} $DLT\n\n\n`);

  return {
    eligible,
    not_eligible
  }

}

