"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WagmiProvider, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { http } from "viem";

import { PrivyProvider } from "@privy-io/react-auth";

// TanStack query for WagmiProvider
const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID)
  throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID");

export const PrivyFLowProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        defaultChain: baseSepolia,
        embeddedWallets: {
          createOnLogin: "all-users",
        },
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          logo: "https://avatars.githubusercontent.com/u/125581500?s=200&v=4",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};
