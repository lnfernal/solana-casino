const express = require('express');
const router = express.Router();
const config = require('../../public/javascripts/config.js')
const mysql = require('mysql');
const copperScript = require('../../public/javascripts/betScripts/copperScript.js')
const ironScript = require('../../public/javascripts/betScripts/ironScript.js');
const quartzScript = require('../../public/javascripts/betScripts/quartzScript.js');
const diamondScript = require('../../public/javascripts/betScripts/diamondScript.js')
const goldScript = require('../../public/javascripts/betScripts/goldScript.js')
const emeraldScript = require('../../public/javascripts/betScripts/emeraldScript.js')
const findDuplicate= require('../../public/javascripts/duplicateCheck.js')
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
const NO_WINNER = "no winner"
const NO_CARD = "no card detected"
const USER_NOT_FOUND = "Not Found"

const COPPER_FEE = 0.00175
const QUARTZ_FEE = 0.0035
const IRON_FEE = 0.0125
const GOLD_FEE = 0.025
const EMERALD_FEE = 0.0375
const DIAMOND_FEE = 0.05

const COPPER_AMOUNT = 0.05
const QUARTZ_AMOUNT = 0.1
const IRON_AMOUNT = 0.25
const GOLD_AMOUNT = 0.5
const EMERALD_AMOUNT = 0.75
const DIAMOND_AMOUNT = 1
const BET_AMOUNT = 1
const DUPLICATE_FOUND = "false"
const NO_DUPLICATE_FOUND = "true"
const ERROR = "Error"
const TRANSACTION_SUCCESS = "false"
const COMPLETE_BET = "true"
const SENDING_DEPOSIT = "true"
const UNCOMPLETE_BET = "false"

const UPDATE_SENDING = "UPDATE user_bets SET sendingToTreasury = ? WHERE depositSignature = ?"
const UPDATE_TIME = "UPDATE user_bets SET time = ? WHERE depositSignature = ?" 
const UPDATE_FEES = "UPDATE bb_info SET allTime = allTime + ?, dailyVolume = dailyVolume + ?, totalFees = totalFees + ?, dailyFees = dailyFees + ?"
const HOUSE_PROFIT = "UPDATE bb_info SET houseProfit = houseProfit + ?"
const USER_PROFIT = "UPDATE bb_info SET playerRewards = playerRewards + ?"
const GET_WALLET_FROM_SIGNATURE = "SELECT * FROM user_bets WHERE depositSignature = ?"
const VERIFY_LAST_BET = "SELECT * FROM user_bets WHERE wallet = ? ORDER BY id DESC LIMIT 1"
const SET_VERIFIED_INFO = "UPDATE user_bets SET amount = ?, lamports = ? WHERE depositSignature = ?"
const GET_USER_INFO = "SELECT * FROM user_bet_info WHERE wallet = ?"
const ADD_FIRST_ROW = "INSERT INTO user_bet_info SET ?"
const UPDATE_USER_ROW = "UPDATE user_bet_info SET betAmount = betAmount + ?, wins = wins + ?, losses = losses + ? WHERE wallet = ?"
var returnObj = {
    winner: "",
    error: ""
}

router.post('/', async function(req, res, next) {
        let check;
        await findDuplicate.duplicateCheck(req.body.signature, true, function(result){
            check = result
        })
        .catch((reason) => {
            console.log(reason)
            returnObj = { winner: FAILED }
            return res.send(returnObj)
        })
            
        if (check === DUPLICATE_FOUND || check === FAILED) {
            returnObj = { winner: FAILED }
            return res.send(returnObj)
        }

        let betInfo = await getBetInfoById(req.body.signature)
        .catch((reason) => {
            console.log(reason)
            returnObj = { winner: FAILED }
            return res.send(returnObj)
        })
        let verifiedLamports = await getSignatureInfo(req.body.signature, betInfo[0].wallet)
        .catch((reason) => {
            console.log(reason)
            returnObj = { winner: FAILED }
            return res.send(returnObj)
        })
        if (verifiedLamports === FAILED) {
            console.log("INFO ERROR")
            //recycleSuspicious(betInfo[0].wallet, betTime)
            returnObj = { winner: FAILED }
            return res.send(returnObj)
        }

        let verifiedBet = await verifyBet(verifiedLamports.wallet, verifiedLamports.cardName, verifiedLamports.depositSignature)
        .catch((reason) => {
            console.log(reason)
            returnObj = { winner: FAILED }
            return res.send(returnObj)
        })
        if (verifiedBet === FAILED) {
            console.log("VERIFIED FAILED")
            returnObj = { winner: FAILED }
            return res.send(returnObj)
        }

    
    
        if (betInfo[0].cardName !== verifiedLamports.cardName) {
            console.log("CARD NOT CORRECT")
            returnObj = { winner: FAILED }
            return res.send(returnObj)
        }

        let timestamp = Date()
        console.log(timestamp)
        console.log("start UPDATE")
            let updateResult = await updateDb(verifiedLamports)
            .catch((reason) => {
                console.log(reason)
                returnObj = { winner: FAILED }
                return res.send(returnObj)
            })
            if (updateResult === FAILED) {
                console.log("Updates result failed")
                returnObj = { winner: FAILED }
                return res.send(returnObj)
            }

            console.log("start")
            await addSendingComplete(verifiedLamports.depositSignature)
            await addTime(verifiedLamports.depositSignature, timestamp)

            let trackResult = await getColumn(verifiedLamports.wallet)
            .catch((reason) => {
                console.log(reason)
                returnObj = { winner: FAILED }
                return res.send(returnObj)
            })
            
            try {
                if (verifiedLamports.cardName === COPPER_CARD) {
                    await copperScript(verifiedLamports.depositSignature, function(result) {
                        handleResult(result, verifiedLamports, trackResult, res)
                    })
                } else if (verifiedLamports.cardName === QUARTZ_CARD) {
                    await quartzScript(verifiedLamports.depositSignature, function(result) {
                        handleResult(result, verifiedLamports, trackResult, res)
                    })
                } else if (verifiedLamports.cardName === IRON_CARD) {
                console.log("starting bet")
                    await ironScript(verifiedLamports.depositSignature, function(result) {
                        console.log(result) 
                        handleResult(result, verifiedLamports, trackResult, res)
                    })
                } else if (verifiedLamports.cardName === GOLD_CARD) {
                    await goldScript(verifiedLamports.depositSignature, function(result) {
                        handleResult(result, verifiedLamports, trackResult, res)
                    })
                } else if (verifiedLamports.cardName === EMERALD_CARD) {
                    await emeraldScript(verifiedLamports.depositSignature, function(result) {
                        handleResult(result, verifiedLamports, trackResult, res)
                    })
                } else {
                    console.log("Diamond Bet")
                    await diamondScript(verifiedLamports.depositSignature, function(result) {
                        handleResult(result, verifiedLamports, trackResult, res)
                    })
                }
        } catch (error) {
            console.log(error)
            returnObj = { winner: NO_WINNER, error: error?.message }
            return res.send(returnObj)
            
        }
  

})

function handleResult(result, verifiedLamports, trackResult, res) {
    if (result.winner === USER_WINNER) {
        addStats(verifiedLamports.amount)
        if (trackResult === USER_NOT_FOUND) {
            addRow(verifiedLamports.wallet, USER_WINNER)
            console.log("User WINS!")
            returnObj = { winner: USER_WINNER }
            return res.send(returnObj)
        } else {
            updateRow(verifiedLamports.wallet, USER_WINNER)
            console.log("User WINS!")
            returnObj = { winner: USER_WINNER }
            return res.send(returnObj)
        }
    } else if (result.winner === HOUSE_WINNER) {
        if (trackResult === USER_NOT_FOUND) {
            addRow(verifiedLamports.wallet, HOUSE_WINNER)
            console.log("HOUSE WINS!")
            addStats(verifiedLamports.amount)
            returnObj = { winner: HOUSE_WINNER }
            return res.send(returnObj)
        } else {
            updateRow(verifiedLamports.wallet, HOUSE_WINNER)
            console.log("HOUSE WINS!")
            addStats(verifiedLamports.amount)
            returnObj = { winner: HOUSE_WINNER }
            return res.send(returnObj)
        }
        

    } else {
        console.log("process failed")
        returnObj = { winner: NO_WINNER, error: "proccess failed" }
        return res.send(returnObj)
    }
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

async function verifyBet (wallet, cardName, signature) {

    return new Promise((resolve, reject) => {

    let connection = mysql.createConnection(config)
    let dbCardName;
    let dbWallet;
    let dbDepositSignature;
    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })

        connection.query(VERIFY_LAST_BET, [wallet, signature], (err, rows) => {
            console.log(rows)
            if (err) {
                connection.end()
                console.log(err)
                reject(FAILED)
                return 
            }
            
            for (let i in rows) {
                dbCardName = rows[i].cardName
                dbWallet = rows[i].wallet
                dbDepositSignature = rows[i].depositSignature
            }
    
            if (dbCardName !== cardName) {
      
                reject(FAILED)
                console.log("card failed")
                return
            } else if (dbWallet !== wallet) {
                console.log("wallet")
                reject(FAILED)
                
                return
            } else if (dbDepositSignature !== signature){
                console.log("signature")
                reject(FAILED)
                return
            } else {
                resolve(SUCCESS)
                return
            }       
        })
        
    })
    
} 

async function addVerifiedInfo(verifiedLamports) {
    try {
    let connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })
   
    connection.query(BET_VERIFIED_UPDATE, [verifiedLamports.cardName, verifiedLamports.amount,
        verifiedLamports.lamports, verifiedLamports.depositSignature, verifiedLamports.wallet, betTime], (err, rows) => {
        if (err) {
            connection.end()
            console.log(err)
            return
        }
        if (rows?.affectedRows > 0) {
            connection.end()
            return res.send(successResponse)
        } else {
            connection.end()
            
            return res.send(failedResponse)
        }
    })
    } catch (error) {
        console.log(error)
        connection.end()
        return res.send(failedResponse)
    }
}

async function addStats(amount) {

    let feeResult = await getFees(amount)
    let connection = mysql.createConnection(config)
    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })
    connection.query(UPDATE_FEES, [amount, amount, feeResult, feeResult], (err, rows) => {
        
        if (rows?.affectedRows > 0) {
            console.log(amount + " and " + feeResult + " were added to volume")
            connection.end()
            return
        } else {
            console.log("Failed to keep track")
            connection.end()
            return
        }
    })
}

async function getFees (amount) {
    switch (amount) {
        case COPPER_AMOUNT:
            return COPPER_FEE;
        case QUARTZ_AMOUNT:
            return QUARTZ_FEE;
        case IRON_AMOUNT:
            return IRON_FEE
        case GOLD_AMOUNT:
            return GOLD_FEE
        case EMERALD_AMOUNT:
            return EMERALD_FEE
        case DIAMOND_AMOUNT: 
            return DIAMOND_FEE
        default:
            return 0
    }
}

async function updateDb(verifiedBet) {
    console.log(verifiedBet)
    try {

        let recentBlockhash = await RPC_CONNECTION.getLatestBlockhash('processed')
        let result = await RPC_CONNECTION.getSignatureStatus(verifiedBet.depositSignature, { searchTransactionHistory: true })

        if (result.value.confirmationStatus === null || result.value.confirmationStatus === undefined) {
        try {
            await RPC_CONNECTION.confirmTransaction({ signature: verifiedBet.depositSignature, lastValidBlockHeight: recentBlockhash.lastValidBlockHeight, blockhash: recentBlockhash.blockhash  }, 'processed')
        } catch (error) {
            console.log(error)
            return FAILED
        }
        }
    
        let connection = mysql.createConnection(config)
        connection.on('error', function(err) {
            console.log("[mysql error]", err)
        })
    
        connection.query(SET_VERIFIED_INFO, [verifiedBet.amount, verifiedBet.lamports, verifiedBet.depositSignature], (err, rows) => {
            
            if (rows?.affectedRows > 0) {
        
                console.log("Sigature Added")
                connection.end()
                return SUCCESS
            } else {
            
                console.log("Signature failed to add")
                connection.end()
                return FAILED
            }
        })
    } catch(error) {
        console.log(error)
        return FAILED
    }
}

async function addTime(id, timestamp) {
    console.log(id + " " + timestamp)
    let connection = mysql.createConnection(config)
    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })
    connection.query(UPDATE_TIME, [timestamp, id], (err, rows) => {
        
        if (rows?.affectedRows > 0) {
            console.log("Time Added")
            connection.end()
            return
        } else {
            console.log("Time failed to add")
            connection.end()
            return
        }
    })
}

async function addSendingComplete(signature) {

    let connection = mysql.createConnection(config)
    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })
    connection.query(UPDATE_SENDING, [TRANSACTION_SUCCESS, signature], (err, rows) => {
        
        if (rows?.affectedRows > 0) {

            console.log("Sending changed")
            connection.end()
            return
        } else {

            console.log("sending failed to send")
            connection.end()
            return
        }
    })
}

async function getBetInfoById (signature) {
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
         
            for (let i in rows) {
                if (rows[i].complete !== COMPLETE_BET) {
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
                    resolve(data)
                    return
                } else {
                    connection.end()
                    reject(FAILED)
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

async function getColumn(wallet) {
    return new Promise((resolve, reject) => {
        try {
            let connection = mysql.createConnection(config)
            let userRows = []
            connection.on('error', function(err) {
                console.log("[mysql error]", err)
            })

            connection.query(GET_USER_INFO, [wallet], (err, rows) => {
                if (err) {
                    console.log(err)
                    console.log("ERROR")
                    reject(FAILED)
                }

                for (let i in rows) {
                    userRows.push(rows[i].id)
                }
                console.log(userRows.length)
                console.log(userRows)
                if (userRows.length < 1) {
                    connection.end()
                    resolve(USER_NOT_FOUND)
                } else {
                    connection.end()
                    resolve(SUCCESS)
                }
            })
        } catch (error) {
            console.log(error)
            reject(FAILED)
        }
    })
}

async function addRow(wallet, result) {
        try {
            console.log("adding row")
           let win;
            let loss;
            if (result === USER_WINNER) {
                win = 1
                loss = 0
            } else {
                win  = 0
                loss = 1
            }

            let connection = mysql.createConnection(config)
            let userRow = {
                wallet: wallet,
                betAmount: 1,
                wins: win,
                losses: loss
            }
            connection.on('error', function(err) {
                console.log("[mysql error]", err)
            })

            connection.query(ADD_FIRST_ROW, [userRow], (err, rows) => {
                if (err) {
                    connection.end()
                    console.log(err)
                    console.log("ERROR")
                    return
                }
                if (rows.affectedRows > 0) {
                    connection.end()
                    console.log("User Created")
                    return
                } else {
                    connection.end()
                    console.log("Failed to add row")
                    return
                }
            })
        } catch (err) {
            console.log(err)
            return
        }
}

async function updateRow(wallet, result) {
        try {
            let win;
             let loss;
             if (result === USER_WINNER) {
                 win = 1
                 loss = 0
             } else {
                 win  = 0
                 loss = 1
             }

             let connection = mysql.createConnection(config)
          
             connection.on('error', function(err) {
                 console.log("[mysql error]", err)
             })

             connection.query(UPDATE_USER_ROW, [BET_AMOUNT, win, loss, wallet], (err, rows) => {
                 if (err) {
                     connection.end()
                     console.log(err)
                     console.log("ERROR")
                     return
                 }
                 if (rows.affectedRows > 0) {
                     connection.end()
                     console.log("User Couted")
                    return
                 } else {
                     connection.end()
                     console.log("Failed to add row")
                     return
                 }
             })
        } catch (err) {
             console.log(err)
             return
        }
    }


module.exports = router
