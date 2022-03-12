import Arweave from "arweave";

export const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
  timeout: 60000,
  logging: false,
});

export async function getNetwork() {
  const network = await arweave.network.getInfo();

  return network;
}