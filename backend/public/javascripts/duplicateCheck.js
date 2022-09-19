const { cp } = require('fs');
const mysql = require('mysql');
const config = require('./config.js')

const GET_WALLET_FROM_SIGNATURE = "SELECT * FROM user_bets WHERE depositSignature = ?"
const CHECK_INITIAL_DUPLICATE = "SELECT * FROM user_bets WHERE depositSignature = ?"
const CHECK_DUPLICATE_DEPOSIT = "SELECT * FROM user_bets WHERE depositSignature = ? AND wallet = ?"
const CHECK_FOR_COMPLETE_BET = "SELECT * FROM user_bets WHERE depositSignature = ? AND complete = ?"
const COMPLETE_BET = "true"
const UNCOMPLETE_BET = "false"
const FAILED = "Failed"
const NO_DUPLICATE_FOUND = "true"
const DUPLICATE_FOUND = "false"
const ERROR = "Error"
const GET_RECENT_ID = "SELECT * FROM user_bets WHERE wallet = ? ORDER BY id DESC LIMIT 1"

async function duplicateCheck(signature, checkComplete, callback) {

    let wallet = "";
    await getWalletFromId(signature, function(result){
        wallet = result
    })
    console.log("START: " + wallet)
    if (wallet === ERROR) { 
        callback(FAILED)
        return 
    }

    if (checkComplete) {
        let checkForComplete = await checkForCompleteBet(signature)
    if (checkForComplete === FAILED || checkForComplete === COMPLETE_BET) {
        callback(FAILED)
        return 
    }
    }

    let connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })
    let deposits = []
    try {
        connection.query(CHECK_DUPLICATE_DEPOSIT, [signature, wallet], (err, rows) => {
            
            if (err) { 
                console.log(err)
                connection.end()
                callback(FAILED)
                return
            }
            for (let i in rows) {
                deposits.push(rows[i].despositSignature)
            }
            console.log(deposits)
            if (deposits.length > 1) {
                console.log("duplicate")
                connection.end()
                callback(DUPLICATE_FOUND)
                return
            } else {
                connection.end()
                console.log("no duplicate")
                callback(NO_DUPLICATE_FOUND)
                return
            }  
        })
    } catch (error) {
        connection.end()
        callback(FAILED)
        return
    }

}

async function getWalletFromId(signature, callback) {
    let connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })
    var wallet;
    try {
        connection.query(GET_WALLET_FROM_SIGNATURE, [signature], (err, rows) => {
            if (err) {
                connection.end()
                console.log(err)
                callback(FAILED)
                return
            }
            console.log(rows.length)
            for (let i in rows) {
                wallet = rows[i].wallet
            }
            connection.end()
            callback(wallet)
            return
        })
    } catch (error) {
        connection.end()
        console.log(error)
        callback(FAILED)
        return
    }
}

async function checkForCompleteBet(signature) {
    let connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })
    var complete;
    try {
        connection.query(CHECK_FOR_COMPLETE_BET, [signature, COMPLETE_BET], (err, rows) => {
            if (err) {
                connection.end()
                console.log(err)
                return FAILED
            }
            console.log(rows.length)
            for (let i in rows) {
                complete = rows[i].complete
            }
            if (complete === COMPLETE_BET) {
                connection.end()
                return FAILED;
            } else {
                connection.end()
                return UNCOMPLETE_BET;
            }
        })
    } catch (error) {
        connection.end()
        console.log(error)
        return FAILED
    }
}

async function initalDuplicateCheck(wallet, depositSignature, callback) {
    console.log("inital check wallet")
    console.log(wallet)
    let duplicateResult = await getRecentWallet(wallet, depositSignature)
    console.log(duplicateResult)
    if (duplicateResult === DUPLICATE_FOUND || duplicateCheck === FAILED) {
        console.log("DUP FAILED")
        callback(FAILED)
        return
    } else {
        callback(NO_DUPLICATE_FOUND)
        return 
    }
}

async function getRecentWallet(depositSignature, wallet) {
    let connection = mysql.createConnection(config)
    let userWallet = wallet
    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })

    let deposits = []
    try {
        connection.query(CHECK_INITIAL_DUPLICATE, [depositSignature], (err, rows) => {
            if (err) { 
                connection.end()
                return DUPLICATE_FOUND
            }
            for (let i in rows) {
                deposits.push({
                    wallet: rows[i].wallet,
                    depositSignature: rows[i].depositSignature,
                    complete: rows[i].complete
                })
            }
            if (deposits.length > 1) {
                console.log("DUPLICATE FOUND")
                connection.end()
                return DUPLICATE_FOUND
            } else {
                connection.end()
                return NO_DUPLICATE_FOUND
            }
        }) 
    } catch (error) {
        connection.end()
        console.log(error)
        return FAILED
    }
}

module.exports = { duplicateCheck, getWalletFromId, initalDuplicateCheck }