import React, { useState, useEffect } from "react";
import "./styles.css";
import { Magic } from "magic-sdk";
import { BitcoinExtension } from "@magic-ext/bitcoin";
import * as bitcoin from "bitcoinjs-lib";

const magic = new Magic("pk_live_99DDD0687C146843", {
  extensions: [
    new BitcoinExtension({
      rpcUrl: "BTC_RPC_NODE_URL",
      network: "testnet",
    }),
  ],
});

export default function App() {
  const [email, setEmail] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [inputTxHash, setInputTxHash] = useState("");
  const [sendAmount, setSendAmount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState({});
  const [txHash, setTxHash] = useState("");
  const [sendingTransaction, setSendingTransaction] = useState(false);

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const metadata = await magic.user.getMetadata();
        setPublicAddress(metadata.publicAddress);
        setUserMetadata(metadata);
      }
    });
  }, [isLoggedIn]);

  const login = async () => {
    await magic.auth.loginWithEmailOTP({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const handleSignTransaction = async () => {
    const TESTNET = bitcoin.networks.testnet;
    setSendingTransaction(true);

    const tx = new bitcoin.TransactionBuilder(TESTNET);
    tx.addInput(inputTxHash, 0);

    tx.addOutput(destinationAddress, sendAmount);

    const txHex = tx.buildIncomplete().toHex();

    const signedTransactionHex = await magic.bitcoin.signTransaction(txHex, 0);

    setSendingTransaction(false);

    setTxHash(signedTransactionHex);

    console.log("signed transaction", signedTransactionHex);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="container">
            <h1>Current user: {userMetadata.email}</h1>
            <button onClick={logout}>Logout</button>
          </div>
          <div className="container">
            <h1>Bitcoin address</h1>
            <div className="info">{publicAddress}</div>
          </div>
          <div className="container">
            <h1>Sign Bitcoin Transaction</h1>
            {txHash ? (
              <div>
                <div>Sign transaction success</div>
                <div className="info">{txHash}</div>
              </div>
            ) : sendingTransaction ? (
              <div className="sending-status">Signing transaction</div>
            ) : (
              <div />
            )}
            <input
              type="text"
              name="destination"
              className="full-width"
              required="required"
              placeholder="input tx hash"
              onChange={(event) => {
                setInputTxHash(event.target.value);
              }}
            />
            <input
              type="text"
              name="destination"
              className="full-width"
              required="required"
              placeholder="Destination address"
              onChange={(event) => {
                setDestinationAddress(event.target.value);
              }}
            />
            <input
              type="text"
              name="amount"
              className="full-width"
              required="required"
              placeholder="Amount in BTC"
              onChange={(event) => {
                setSendAmount(event.target.value);
              }}
            />
            <button id="btn-send-txn" onClick={handleSignTransaction}>
              Sign Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
