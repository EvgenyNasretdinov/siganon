import { ethers } from "ethers";
import { SiweMessage } from "siwe";
import * as LitJsSdk from "@lit-protocol/lit-node-client-nodejs";
import dotenv from 'dotenv'
dotenv.config()

import { litNodeClient } from './litNocdeClient'

type Chain = "maticmum" | "homestead" | "goerli" | "matic"

export const getChronicalProvider = () =>
  new ethers.providers.JsonRpcProvider(
    "https://chain-rpc.litprotocol.com/http"
  );

const provider = getChronicalProvider();
const wallet = new ethers.Wallet(process.env.PK!, provider);

export async function generateAuthSig() {
  const siweMessage = new SiweMessage({
    domain: 'localhost',
    statement: "Sign in to localhost",
    uri: 'http://localhost/login',
    version: "1",
    chainId: 1,
    address: await wallet.getAddress(),
  });
  const messageToSign = siweMessage.prepareMessage();
  const sig = await wallet.signMessage(messageToSign);
  return {
    sig,
    derivedVia: "web3.eth.personal.sign",
    signedMessage: messageToSign,
    address: await wallet.getAddress(),
  };
}


const evmContractConditions = [
  {
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "eth_getBalance",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
      comparator: ">=",
      value: "1000000000000", // 0.000001 ETH
    },
  },
];

export const encrypt = async () => {
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
    "this is a secret message"
  )
  console.log({ encryptedString, symmetricKey })
  const authSig = await generateAuthSig()

  const encryptedSymmetricKey = await litNodeClient.saveEncryptionKey({
    accessControlConditions: evmContractConditions,
    symmetricKey,
    authSig,
    chain: 'ethereum',
  });

  return {
    encryptedString,
    encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
  }
}

export const decrypt = async (encryptedString: Blob, encryptedSymmetricKey: string) => {
  const authSig = await generateAuthSig()
  
  const symmetricKey = await litNodeClient.getEncryptionKey({
    accessControlConditions: evmContractConditions,
    toDecrypt: encryptedSymmetricKey,
    authSig,
    chain: 'ethereum',
  });
  
  const decryptedString = await LitJsSdk.decryptString(
    encryptedString,
    symmetricKey
  );

  return decryptedString
}

export const start = async () => {
  await litNodeClient.connect();
  console.log("connected to lit nodes");
  const { encryptedString, encryptedSymmetricKey } = await encrypt()
  console.log({ encryptedString, encryptedSymmetricKey })
  const decryptedString = await decrypt(encryptedString, encryptedSymmetricKey)
  console.log({ decryptedString })
}
