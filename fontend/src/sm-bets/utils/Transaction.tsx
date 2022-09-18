import { web3 } from '@project-serum/anchor';
import { PublicKey, Transaction , SystemProgram, Connection, clusterApiUrl } from '@solana/web3.js';
import { CardAttributes, ErrorMessages } from '../constants';
import { RPC } from './rpc';

//main network: mainnet-beta
//dev network: devnet
const COPPER_PRICE: number = 50000000 + 10000
const QUARTZ_PRICE: number = 100000000 + 10000
const IRON_PRICE: number = 250000000 + 10000
const GOLD_PRICE: number = 500000000 + 10000
const EMERALD_PRICE: number = 750000000 + 10000
const DIAMOND_PRICE: number = 1000000000 + 10000

const UNVERIFIED_COPPER: number = 2500000
const UNVERIFIED_QUARTZ: number = 5000000
const UNVERIFIED_IRON: number = 12500000
const UNVERIFIED_GOLD: number = 25000000
const UNVERIFIED_EMERALD: number = 37500000
const UNVERIFIED_DIAMOND: number = 50000000

const VERIFIED_COPPER: number = 1750000
const VERIFIED_QUARTZ: number = 3500000
const VERIFIED_IRON: number = 8750000
const VERIFIED_GOLD: number = 17500000
const VERIFIED_EMERALD: number = 26250000
const VERIFIED_DIAMOND: number = 35000000

const SUCCESS: string = "Success"
const FAILED: string = "Failed"
const NO_BLOCKHASH: string = "No BlockHash;"

interface DepositResult {
    status: string,
    transaction: Transaction,
    toPublicKey: PublicKey | null,
    lamports: number
}

export const depositToTreasury = async (
    toPublicKey: PublicKey,
    fromPublicKey: PublicKey,
    feeReciever: PublicKey,
    cardName: string,
    verifiedHolder: boolean
    ) => {
        let transaction = new Transaction()
        
        try {
            let connection = new Connection(RPC.rpcUrl, 'processed')

            let lastedBlocks = await connection.getLatestBlockhash()
            let betLamports = await calculateLamports(cardName)
            let feeLamports = await calculateFee(cardName, verifiedHolder)
            if ( feeLamports === undefined || betLamports === undefined) {
                let result: DepositResult = {
                    status: FAILED,
                    transaction,
                    toPublicKey: null,
                    lamports: 0
                }
                return result;
            }
            transaction.feePayer = fromPublicKey
            transaction.recentBlockhash = lastedBlocks.blockhash
            
            transaction.add(
              
                SystemProgram.transfer({
                    fromPubkey: fromPublicKey,
                    toPubkey: toPublicKey,
                    lamports: betLamports
                })
            )
            transaction.add(
              
                SystemProgram.transfer({
                    fromPubkey: fromPublicKey,
                    toPubkey: feeReciever,
                    lamports: feeLamports
                })
            )
           
            let result: DepositResult = {
                status: SUCCESS,
                transaction,
                toPublicKey,
                lamports: betLamports
            }
            return result;
        } catch (error: any) {
            console.log(error)
            let blockHashError = error?.message.includes(ErrorMessages.blockhashNotFound)
            if (blockHashError) {
                let result: DepositResult = {
                    status: NO_BLOCKHASH,
                    transaction,
                    toPublicKey: null,
                    lamports: 0
                }
                return result;
            } else {
                let result: DepositResult = {
                    status: FAILED,
                    transaction,
                    toPublicKey: null,
                    lamports: 0
                }
                return result;
            }
        }

    }


    async function calculateLamports(cardName: string) {
        switch(cardName) {
            case CardAttributes.copperName:
                return COPPER_PRICE
            case CardAttributes.quartzName:
                return QUARTZ_PRICE
            case CardAttributes.ironName: 
                return IRON_PRICE
            case CardAttributes.goldName:
                return GOLD_PRICE
            case CardAttributes.emeraldName: 
                return EMERALD_PRICE
            case CardAttributes.diamondName:
                return DIAMOND_PRICE
            }   
    }

    async function calculateFee(cardName: string, verifiedHolder: boolean) {
        if (!verifiedHolder) {
            switch(cardName) {
                case CardAttributes.copperName:
                    return UNVERIFIED_COPPER
                case CardAttributes.quartzName:
                    return UNVERIFIED_QUARTZ
                case CardAttributes.ironName:  
                    return UNVERIFIED_IRON
                case CardAttributes.goldName:
                    return UNVERIFIED_GOLD
                case CardAttributes.emeraldName: 
                    return UNVERIFIED_EMERALD
                case CardAttributes.diamondName:
                    return UNVERIFIED_DIAMOND
            }   
            
        } else {
            switch(cardName) {
                case CardAttributes.copperName:
                    return VERIFIED_COPPER
                case CardAttributes.quartzName:
                    return VERIFIED_QUARTZ
                case CardAttributes.ironName:  
                    return VERIFIED_IRON
                case CardAttributes.goldName:
                    return VERIFIED_GOLD
                case CardAttributes.emeraldName: 
                    return VERIFIED_EMERALD
                case CardAttributes.diamondName:
                    return VERIFIED_DIAMOND
            }   
          
        }
    }