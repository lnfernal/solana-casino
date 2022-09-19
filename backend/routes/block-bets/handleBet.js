const express = require('express');
const router = express.Router();
const config = require('../../public/javascripts/config.js')
const mysql = require('mysql');
const findDuplicate= require('../../public/javascripts/duplicateCheck.js')

const { web3 } = require('@project-serum/anchor');
const { DEVNET_RPC, MAINNET_BETA_RPC, SERVER_RPC } = require('../../public/javascripts/rpc.js');
const { Connection } = require('@solana/web3.js');

const RPC_CONNECTION = new Connection(SERVER_RPC, 'processed')

const COPPER_VERIFIED_LAMPORTS = -50010000
const QUARTZ_VERIFIED_LAMPORTS = -100010000
const IRON_VERIFIED_LAMPORTS = -250010000
const GOLD_VERIFIED_LAMPORTS = -500010000
const EMERALD_VERIFIED_LAMPORTS = -750010000
const DIAMOND_VERIFIED_LAMPORTS = -1000010000

const COPPER_LAMPORTS = 50010000
const QUARTZ_LAMPORTS = 100010000
const IRON_LAMPORTS = 250010000
const GOLD_LAMPORTS = 500010000
const EMERALD_LAMPORTS = 750010000
const DIAMOND_LAMPORTS = 1000010000

const COPPER_UNVERIFIED_FEE = -2500000
const QUARTZ_UNVERIFIED_FEE = -5000000
const IRON_UNVERIFIED_FEE = -12500000
const GOLD_UNVERIFIED_FEE = -25000000
const EMERALD_UNVERIFIED_FEE = -37500000
const DIAMOND_UNVERIFIED_FEE = -50000000

const COPPER_VERIFIED_FEE = -1750000
const QUARTZ_VERIFIED_FEE = -3500000
const IRON_VERIFIED_FEE = -8750000
const GOLD_VERIFIED_FEE = -17500000
const EMERALD_VERIFIED_FEE = -26250000
const DIAMOND_VERIFIED_FEE = -35000000


const COPPER_AMOUNT = 0.05
const QUARTZ_AMOUNT = 0.1
const IRON_AMOUNT = 0.25
const GOLD_AMOUNT = 0.5
const EMERALD_AMOUNT = 0.75
const DIAMOND_AMOUNT = 1

const COPPER_CARD = "Copper"
const QUARTZ_CARD = "Quartz"
const IRON_CARD = "Iron"
const GOLD_CARD = "Gold"
const EMERALD_CARD = "Emerald"
const DIAMOND_CARD = "Diamond"

const FEE_WALLET = "FEdxsh99YdaiZKu7vaKLyyAXHR9r9K9kYfJQ7fNj2itx"
const TREASURY_WALLET = "TseHssL4UfnYaUX2Z7nyZMU6SJjXHMYj5WuMTcAZgFi"
const SUCCESS = "Success"
const FAILED = "Failed"
const USER_WINNER = "user"
const HOUSE_WINNER = "house"

const DEPOSIT_CONFIRMED = "Deposit Confirmed"
const WITHDRAW_CONFIRMED = "Withdraw Confirmed"

const DUPLICATE_FOUND = "false"

const COMPLETE_BET = "true"
const SENDING_TO_TREASURY = "true"
const SENDING_TO_USER = 'true'
const DELETE_BET = "DELETE FROM user_bets WHERE id = ?"
const GET_WALLET_FROM_SIGNATURE = "SELECT * FROM user_bets WHERE depositSignature = ?"
const VERIFY_LAST_BET = "SELECT * FROM user_bets WHERE wallet = ? ORDER BY id DESC LIMIT 1"
const BLANK_BET = "Blank Bet"

var returnObj = {
    status: ""
}

router.post('/', async function(req, res, next) {
    try {
        if (req.body.signature === "") {
            let status = await deleteBlankBet(req.body.wallet, res)
            .catch((reason) => {
                console.log(reason)
            })
            if (status === FAILED) {
                returnObj = { status: SUCCESS }
                return res.send(returnObj)
            } else {
                returnObj = { status: BLANK_BET }
                return res.send(returnObj)
            }
        }

        let check;
        await findDuplicate.duplicateCheck(req.body.signature, false, function(result){
            check = result
        })
        .catch((reason) => {
            console.log(reason)
            returnObj = { status: FAILED }
            return res.send(returnObj)
        })
            
        if (check === DUPLICATE_FOUND || check === FAILED) {
            returnObj = { status: FAILED }
            return res.send(returnObj)
        }

        let betInfo = await getBetInfoById(req.body.signature, false)
        .catch((reason) => {
            console.log(reason)
            returnObj = { status: FAILED }
            return res.send(returnObj)
        })
       
        let checkWalletSignatures = await confirmWalletSignature(betInfo[0].wallet, betInfo[0].depositSignature)
        .catch((reason) => {
            console.log(reason)
            returnObj = { status: FAILED }
            return res.send(returnObj)
        })
        if (checkWalletSignatures === FAILED) {
            returnObj = { status: FAILED }
            return res.send(returnObj)
        }

        let verifyDeposit = await getSignatureInfo(betInfo[0].depositSignature, betInfo[0].wallet)
        .catch((reason) => {
            console.log(reason)
            returnObj = { status: FAILED }
            return res.send(returnObj)
        })

        if (verifyDeposit === FAILED) {
            console.log("wrong deposit")
            returnObj = { status: FAILED }
            return res.send(returnObj)
        }

        console.log("start handle")
        if (betInfo[0].sendingToTreasury === SENDING_TO_TREASURY) {
                   
            let depositStatus = await RPC_CONNECTION.getSignatureStatus(verifyDeposit.depositSignature, {searchTransactionHistory: true})
            
            switch(depositStatus.value.confirmationStatus) {
                case null:
                    
                    try {
                        let recentBlockhash = await RPC_CONNECTION.getLatestBlockhash('processed')

                        await RPC_CONNECTION.confirmTransaction({ 
                                signature: verifyDeposit.depositSignature,
                                lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
                                blockhash: recentBlockhash.blockhash
                            },
                            'processed'
                        )
                        returnObj = { status: DEPOSIT_CONFIRMED }
                        return res.send(returnObj)
                    } catch (error) {
                        console.log(error)
                        returnObj = { status: FAILED }
                        return res.send(returnObj)
                    }
                default:
                    returnObj = { status: DEPOSIT_CONFIRMED }
                    return res.send(returnObj)
            }

        } else if (betInfo[0].sendingToUser === SENDING_TO_USER) {
           
            try {
                let withdrawInfo = await getBetInfoById(req.body.signature, true)
                .catch((reason) => {
                    console.log(reason)
                    returnObj = { status: FAILED }
                    return res.send(returnObj)
                })
                console.log(withdrawInfo)
                if (withdrawInfo[0].withdrawSignature === undefined) {
                    returnObj = { status: FAILED }
                    console.log(FAILED)
                    return res.send(returnObj)
                }
          
                let withdrawStatus = await RPC_CONNECTION.getSignatureStatus(withdrawInfo[0].withdrawSignature, {searchTransactionHistory: true})
                
                switch(withdrawStatus.value.confirmationStatus) {
                    case null:
                        try {
                            let recentBlockhash = await RPC_CONNECTION.getLatestBlockhash('processed')

                            await RPC_CONNECTION.confirmTransaction({ 
                                    signature: betInfo[0].withdrawSignature,
                                    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
                                    blockhash: recentBlockhash.blockhash
                                },
                                'processed'
                            )
                            returnObj = { status: WITHDRAW_CONFIRMED }
                            return res.send(returnObj)
                        } catch (error) {
                            console.log(error)
                            returnObj = { status: FAILED }
                            return res.send(returnObj)
                        }
                    default:
                        returnObj = { status: WITHDRAW_CONFIRMED }
                        return res.send(returnObj)
                }
            } catch (error) {
                console.log(error)
                returnObj = { status: FAILED }
                return res.send(returnObj)
            }
        } else if (betInfo[0].winner === USER_WINNER) {
            console.log("user winner")
            returnObj = { status: USER_WINNER }
            return res.send(returnObj)
        } else if (betInfo[0].winner === HOUSE_WINNER) {
            console.log("house winner")
            returnObj = { status: HOUSE_WINNER }
            return res.send(returnObj)
        } else {
            console.log("no result")
            returnObj = { status: FAILED }
            return res.send(returnObj)
        }
        
    } catch (error) {
        console.log(error)
        returnObj = { status: FAILED }
        return res.send(returnObj)       
    }
})

const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

async function getBetInfoById (signature, withdrawHandler) {
    try {
    return new Promise((resolve, reject) => {
        let data = [{}]
    let connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })
 
        connection.query(GET_WALLET_FROM_SIGNATURE, [signature], (err, rows) => {
            if (err) {
                connection.end()
                console.log(err)
                reject(FAILED)
                return 
            }
            console.log(rows)
            for (let i in rows) {
                if (rows[i].complete === COMPLETE_BET && withdrawHandler) {
                    data.push({
                        wallet: rows[i].wallet,
                        withdrawSignature: rows[i].withdrawSignature,
                    })
                    connection.end()
                    data.shift()
                    resolve(data)
                    return
                } else {
                    
                    data.push({
                        id: rows[i].id,
                        wallet: rows[i].wallet,
                        cardName: rows[i].cardName,
                        image: rows[i].cardName,
                        amount: rows[i].amount,
                        lamports: rows[i].lamports,
                        sendingToTreasury: rows[i].sendingToTreasury,
                        sendingToUser: rows[i].sendingToUser,
                        winner: rows[i].winner,
                        depositSignature: rows[i].depositSignature,
                        withdrawSignature: rows[i].withdrawSignature,
                        sent: rows[i].sent,
                        complete: rows[i].complete,
                        time: rows[i].time
                    })
                    connection.end()
                    data.shift()
                    console.log(data)
                    resolve(data)
                    return
                }

            }
            
        })
    })
    } catch (error) {
        console.log(error)
        return FAILED
    }
}

async function confirmWalletSignature(wallet, signature) {
    try {
      let pubKey = new web3.PublicKey(wallet)
      let address = await RPC_CONNECTION.getSignaturesForAddress(pubKey, { until: signature }, 'confirmed')
      console.log(address)
      return SUCCESS
    } catch (error) {
      console.log(error)
      return FAILED
    }     
}


async function deleteBlankBet(wallet) {
      
        try {

            let betInfo = await getUserLatestBet(wallet)

            if (betInfo === FAILED) {
                console.log("no bet data")
                return FAILED
            }

            let connection = mysql.createConnection(config)

            connection.on('error', function(err) {
                console.log("[mysql error]", err)
            })

            connection.query(DELETE_BET, [betInfo], (err, rows) => {

                if (rows.affectedRows > 0) {
                    console.log(betInfo + ' deleted')
                    connection.end()
                    return SUCCESS
                } else { 
                    console.log("failed to delete")
                    connection.end()
                    return FAILED
                }

            })

        } catch (error) {
            console.log(error)
            return FAILED
        }
}

async function getUserLatestBet(wallet) {
    
    return new Promise((resolve, reject) => {
        try {
            let connection = mysql.createConnection(config)

            connection.on('error', function(err) {
                console.log("[mysql error]", err)
            })
            var id;
            var complete;
            var dbWallet;
            var depositSignature;
                connection.query(VERIFY_LAST_BET, [wallet], (err, rows) => {
                    console.log("USER LASTEST")
                    console.log(rows)
                    if (err) {
                        connection.end()
                        console.log(err)
                        reject(FAILED)
                    }
                    console.log(rows.length)
                    for (let i in rows) {
                        id = rows[i].id
                        depositSignature = rows[i].depositSignature
                        dbWallet = rows[i].wallet,
                        complete = rows[i].complete
                    }
                    console.log(id)
                    if (dbWallet !== wallet) {
                        console.log("wallet suspicious")
                        connection.end()
                        reject(FAILED)
                    } else if (complete === COMPLETE_BET) {
                        console.log("bet complete")
                        connection.end()
                        reject(FAILED)
                    } else if (depositSignature !== "") {
                        console.log("bet no deposit")
                        connection.end()
                        reject(FAILED)   
                    } else {
                        connection.end()
                        resolve(id)
                    }
                    
                })
        } catch (error) {
            console.log(error)
            return
        }   
    })
     

}

async function getSignatureInfo(depositSignature, wallet) {
    try {

        let accountArray = []
        let lamports;
        let cardName;
        let amount;
      
        let transactionInfo = await RPC_CONNECTION.getTransaction(depositSignature, { commitment: 'confirmed' })
        
        let preBalances = transactionInfo.meta.preBalances[2]
        let postBalances = transactionInfo.meta.postBalances[2]
        let feePreBalance = transactionInfo.meta.preBalances[1]
        let feePostBalance = transactionInfo.meta.postBalances[1]
        let feeNegitaveAmount = feePreBalance - feePostBalance
        let negativeAmount = preBalances - postBalances

        switch (feeNegitaveAmount) {
            case COPPER_UNVERIFIED_FEE: 
                cardName = COPPER_CARD
                amount = COPPER_AMOUNT
                break;
            case COPPER_VERIFIED_FEE:
                cardName = COPPER_CARD
                amount = COPPER_AMOUNT
                break;
            case QUARTZ_VERIFIED_FEE:
                cardName = QUARTZ_CARD
                amount = QUARTZ_AMOUNT
                break;
            case QUARTZ_UNVERIFIED_FEE:
                cardName = QUARTZ_CARD
                amount = QUARTZ_AMOUNT
                break;
            case IRON_UNVERIFIED_FEE:
                cardName = IRON_CARD
                amount = IRON_AMOUNT
                break;
            case IRON_VERIFIED_FEE:
                cardName = IRON_CARD
                amount = IRON_AMOUNT
                break;
            case GOLD_UNVERIFIED_FEE:
                cardName = GOLD_CARD
                amount = GOLD_AMOUNT
                break;
            case GOLD_VERIFIED_FEE:
                cardName = GOLD_CARD
                amount = GOLD_AMOUNT
                break;
            case EMERALD_UNVERIFIED_FEE:
                cardName = EMERALD_CARD
                amount = EMERALD_AMOUNT
                break;
            case EMERALD_VERIFIED_FEE:
                cardName = EMERALD_CARD
                amount = EMERALD_AMOUNT
                break;
            case DIAMOND_UNVERIFIED_FEE:
                cardName = DIAMOND_CARD
                amount = DIAMOND_AMOUNT
                break;
            case DIAMOND_VERIFIED_FEE:
                cardName = DIAMOND_CARD
                amount = DIAMOND_AMOUNT
                break;
            default: 
                return FAILED
        }

        switch (negativeAmount) {
            case COPPER_VERIFIED_LAMPORTS:
                lamports = COPPER_LAMPORTS
                break;
            case QUARTZ_VERIFIED_LAMPORTS:
                lamports = QUARTZ_LAMPORTS;
                break;
            case IRON_VERIFIED_LAMPORTS:
                lamports = IRON_LAMPORTS
                break;
            case GOLD_VERIFIED_LAMPORTS:
                lamports = GOLD_LAMPORTS
                break;
            case EMERALD_VERIFIED_LAMPORTS:
                lamports = EMERALD_LAMPORTS
                break;
            case DIAMOND_VERIFIED_LAMPORTS:
                lamports = DIAMOND_LAMPORTS
                break;
            default:
                return FAILED
        }
        
        let associatedAccounts = transactionInfo.transaction.message.accountKeys

        for (let i in associatedAccounts) {
            accountArray.push(associatedAccounts[i].toBase58())
        }
        console.log(accountArray)
        console.log(wallet)
        console.log(FEE_WALLET)
        console.log(TREASURY_WALLET)
        if (accountArray[0] !== wallet || 
            accountArray[1] !== FEE_WALLET ||
            accountArray[2] !== TREASURY_WALLET) {
                return FAILED
            } else {
                return {
                    wallet,
                    depositSignature,
                    lamports,
                    cardName,
                    amount
                }
            }
        
    } catch (error) {
        console.log(error)

        return FAILED
    }
}



module.exports = router