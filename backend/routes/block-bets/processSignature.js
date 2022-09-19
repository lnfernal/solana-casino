const { Connection } = require('@solana/web3.js');
const { default: axios } = require('axios');
const express = require('express');
const { cp } = require('fs');
const mysql = require('mysql');
const router = express.Router();

const config = require('../../public/javascripts/config.js')
const findDuplicate = require('../../public/javascripts/duplicateCheck.js')
const { SERVER_RPC, MAINNET_BETA_RPC, DEVNET_RPC } = require('../../public/javascripts/rpc.js')
const FAILED = "Failed"
const SUCCESS = "Success"
const DUPLICATE_FOUND = "false"
const COMPLETE_BET = "true" 

const DELETE_SUSPICIOUS_WALLET = "DELETE FROM user_bets WEHRE wallet = ? AND time = ?"
const UPDATE_DEPOSIT_SIGNATURE = "UPDATE user_bets SET depositSignature = ? WHERE id = ?"
const GET_RECENT_ID = "SELECT * FROM user_bets WHERE wallet = ? ORDER BY id DESC LIMIT 1"

const successResponse = {
    status: "Success"
}

const failedResponse = {
    status: "Failed"
}
router.post('/', async function(req, res, next) {
   
  
    console.log("PROCESS START")


    let depositSignature = req.body.signature
    let wallet = req.body.wallet
    console.log(depositSignature)
    console.log(wallet)
    let getId = await getUserLatestBet(wallet)
    .catch((reason) => {
        console.log(reason)
        return res.send(failedResponse)
    })

    console.log("id: " + getId)
    if (getId === FAILED) {
        console.log("USER ID ERR")
        return res.send(failedResponse)
    }
    console.log(getId)

    let check;
    await findDuplicate.initalDuplicateCheck(wallet, depositSignature, function(result){
        check = result
        
        console.log("check:" + check)
        if (check === FAILED || check ===  DUPLICATE_FOUND) {
            console.log("DUP ERROR")
            //recycleSuspicious(req.body.wallet, betTime)
            return res.send(failedResponse)
        }
    })
    .catch((reason) => {
        console.log(reason)
        return res.send(failedResponse)
    })
  
    console.log("START UPDATING")
    try {
    var connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })

    connection.query(UPDATE_DEPOSIT_SIGNATURE, [depositSignature, getId], (err, rows) => {
        if (err) {
            connection.end()
            console.log(err)
            return res.send(failedResponse)
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
})

const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));


function recycleSuspicious(wallet) {
let connection = mysql.createConnection(config)
    try {
        connection.on('error', function(err) {
            console.log("[mysql error]", err)
        })

        connection.query(DELETE_SUSPICIOUS_WALLET, [wallet], (err, rows) => {
            if (rows?.affectedRows > 0) {
                connection.end()
                console.log("RECYCLED")
                return 
            } else {
                console.log(err)
                connection.end()
                return
            }
        })
    } catch (error) {
    console.log(error)
    connection.end()
    return 
    }

}

async function getUserLatestBet(wallet) {
    
    return new Promise((resolve, reject) => {
        try {
            let connection = mysql.createConnection(config)

            connection.on('error', function(err) {
                console.log("[mysql error]", err)
            })
            var id;;
            var complete;
            var dbWallet;
                connection.query(GET_RECENT_ID, [wallet], (err, rows) => {
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
                    } else {
                        resolve(id)
                    }
                    
                })
        } catch (error) {
            console.log(error)
            return
        }   
    })
     

}

module.exports = router