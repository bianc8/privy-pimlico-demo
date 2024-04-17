import { Loader } from "@/components/loader";
import { SmartAccountClient } from "permissionless";
import { SmartAccount } from "permissionless/accounts";
import { EntryPoint } from "permissionless/types";
import { useState } from "react";
import { Chain, Hash, Transport, parseEther, zeroAddress } from "viem";

export const DemoTransactionButton = ({
  smartAccountClient,
  onSendTransaction,
}: {
  smartAccountClient:
    | SmartAccountClient<EntryPoint, Transport, Chain, SmartAccount<EntryPoint>>
    | Transport
    | any
    | SmartAccount<EntryPoint, string, Transport, Chain>
    | null;
  onSendTransaction: (txHash: Hash) => void;
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  const sendTransaction = async () => {
    setLoading(true);
    const txHash = await smartAccountClient.sendTransaction({
      to: zeroAddress,
      data: "0x",
      value: parseEther("0"),
    });
    onSendTransaction(txHash);
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={sendTransaction}
        className="mt-6 flex justify-center items-center w-64 cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {!loading && <p className="mr-4">Demo transaction</p>}
        {loading && <Loader />}
      </button>
    </div>
  );
};
