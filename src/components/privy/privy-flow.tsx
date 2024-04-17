"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useAccount,
  useDisconnect,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import {
  Address,
  Chain,
  Hash,
  Transport,
  http,
  createWalletClient,
  custom,
} from "viem";

import { usePrivy, useWallets } from "@privy-io/react-auth";

import {
  SmartAccountClient,
  createSmartAccountClient,
  walletClientToSmartAccountSigner,
  ENTRYPOINT_ADDRESS_V07,
} from "permissionless";
import { createPimlicoPaymasterClient } from "permissionless/clients/pimlico";
import type { EntryPoint } from "permissionless/types";
import {
  SmartAccount,
  signerToSimpleSmartAccount,
} from "permissionless/accounts";

import { DemoTransactionButton } from "@/components/demo-transaction";
import { Loader } from "@/components/loader";

/*
 * This is a simple example of how to use the Privy SDK to sign in and out of an embedded wallet.
 * The user can sign in with Privy and then send a transaction using the embedded wallet.
 * The user can also sign out of the embedded wallet.
 */
const pimlicoPaymaster = createPimlicoPaymasterClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_PIMLICO_PAYMASTER_RPC_HOST!),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});

/*
 * The PrivyFlow component is a simple example of how to use the Privy SDK to sign in and out of an embedded wallet.
 * The user can sign in with Privy and then send a transaction using the embedded wallet.
 * The user can also sign out of the embedded wallet.
 */
export const PrivyFlow = () => {
  const { login, logout } = usePrivy();
  const { isConnected } = useAccount();
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [smartAccountClient, setSmartAccountClient] = useState<
    | SmartAccountClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>
    | Transport
    | any
    | SmartAccount<EntryPoint, string, Transport, Chain>
    | null
  >(null);
  const publicClient = usePublicClient();

  const { data: walletClient } = useWalletClient();
  const [txHash, setTxHash] = useState<string | null>(null);
  const { disconnect } = useDisconnect();

  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  // const embeddedWallet = useMemo(
  //   () => wallets.find((wallet) => wallet.walletClientType === "privy"),
  //   [wallets]
  // );
  const eip1193provider = embeddedWallet?.getEthereumProvider();

  // Create a viem WalletClient from the embedded wallet's EIP1193 provider
  // This will be used as the signer for the user's smart account
  const privyClient = createWalletClient({
    account: embeddedWallet?.address as `0x${string}`,
    chain: baseSepolia,
    transport: custom(eip1193provider as any),
  });

  const signIn = useCallback(async () => {
    setShowLoader(true);
    login();
  }, [login]);

  const signOut = useCallback(async () => {
    setShowLoader(false);
    disconnect();
    logout();
  }, [disconnect]);

  useEffect(() => {
    (async () => {
      if (isConnected && walletClient && publicClient) {
        const customSigner = walletClientToSmartAccountSigner(walletClient);

        const safeSmartAccountClient = await signerToSimpleSmartAccount(
          publicClient,
          {
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            signer: customSigner,
            factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS! as Address,
          }
        );

        const smartAccountClient = createSmartAccountClient({
          account: safeSmartAccountClient,
          chain: baseSepolia,
          bundlerTransport: http(process.env.NEXT_PUBLIC_BUNDLER_RPC_HOST!),
          middleware: {
            // gasPrice: async () => {
            //   return (await createBundlerClient.getUserOperationGasPrice())
            //     .fast;
            // },
            sponsorUserOperation: pimlicoPaymaster.sponsorUserOperation,
          },
        });

        setSmartAccountClient(smartAccountClient);
      }
    })();
  }, [isConnected, walletClient, publicClient]);

  const onSendTransaction = (txHash: Hash) => {
    setTxHash(txHash);
  };

  if (isConnected && smartAccountClient && embeddedWallet) {
    return (
      <div>
        <div>
          Smart contract wallet address:{" "}
          <p className="fixed left-0 top-0 flex flex-col w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            <code>{smartAccountClient?.account?.address}</code>
          </p>
        </div>
        <div className="flex gap-x-4">
          <button
            onClick={signOut}
            className="mt-6 flex justify-center items-center w-64 cursor-pointer border-2 border-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign out
          </button>
          <DemoTransactionButton
            smartAccountClient={smartAccountClient}
            onSendTransaction={onSendTransaction}
          />
        </div>
        {txHash && (
          <p className="mt-4">
            Transaction hash:{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_ETHER_SCAN}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {txHash}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={signOut}
        className="mt-6 flex justify-center items-center w-64 cursor-pointer border-2 border-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Sign out
      </button>
      <button
        onClick={signIn}
        className="flex justify-center items-center w-64 cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {!showLoader && <p className="mr-4">Sign in with Privy</p>}
        {showLoader && <Loader />}
      </button>
    </div>
  );
};
