import * as LitJsSdk from "@lit-protocol/lit-node-client-nodejs";

// connecting Lit Client
export const litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
  alertWhenUnauthorized: false,
  litNetwork: 'serrano',
  debug: true,
});
