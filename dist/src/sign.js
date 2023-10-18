"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.decrypt = exports.encrypt = exports.generateAuthSig = exports.getChronicalProvider = void 0;
const ethers_1 = require("ethers");
const siwe_1 = require("siwe");
const LitJsSdk = __importStar(require("@lit-protocol/lit-node-client-nodejs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const litNocdeClient_1 = require("./litNocdeClient");
const getChronicalProvider = () => new ethers_1.ethers.providers.JsonRpcProvider("https://chain-rpc.litprotocol.com/http");
exports.getChronicalProvider = getChronicalProvider;
const provider = (0, exports.getChronicalProvider)();
const wallet = new ethers_1.ethers.Wallet(process.env.PK, provider);
async function generateAuthSig() {
    const siweMessage = new siwe_1.SiweMessage({
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
exports.generateAuthSig = generateAuthSig;
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
const encrypt = async () => {
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString("this is a secret message");
    console.log({ encryptedString, symmetricKey });
    const authSig = await generateAuthSig();
    const encryptedSymmetricKey = await litNocdeClient_1.litNodeClient.saveEncryptionKey({
        accessControlConditions: evmContractConditions,
        symmetricKey,
        authSig,
        chain: 'ethereum',
    });
    return {
        encryptedString,
        encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
    };
};
exports.encrypt = encrypt;
const decrypt = async (encryptedString, encryptedSymmetricKey) => {
    const authSig = await generateAuthSig();
    const symmetricKey = await litNocdeClient_1.litNodeClient.getEncryptionKey({
        accessControlConditions: evmContractConditions,
        toDecrypt: encryptedSymmetricKey,
        authSig,
        chain: 'ethereum',
    });
    const decryptedString = await LitJsSdk.decryptString(encryptedString, symmetricKey);
    return decryptedString;
};
exports.decrypt = decrypt;
const start = async () => {
    await litNocdeClient_1.litNodeClient.connect();
    console.log("connected to lit nodes");
    const { encryptedString, encryptedSymmetricKey } = await (0, exports.encrypt)();
    console.log({ encryptedString, encryptedSymmetricKey });
    const decryptedString = await (0, exports.decrypt)(encryptedString, encryptedSymmetricKey);
    console.log({ decryptedString });
};
exports.start = start;
//# sourceMappingURL=sign.js.map