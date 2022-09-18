import { clusterApiUrl } from "@solana/web3.js"

export const RPC = {
    rpcUrl: "https://solana-api.syndica.io/access-token/DYyqbSIZSJiN7pGB9ZZQryFecOVwiiNfh07Nb7vpYWnhKqdddkOIjh4o07nEnYcZ/rpc",
    publicUrl: clusterApiUrl('devnet')
}

export const RPCMethods = {
    getSlot: '{"jsonrpc":"2.0","id":1, "method":"getSlot"}',
    getStatus: '{"jsonrpc":"2.0","id":1, "method":"getSignatureStatuses"}'
}
