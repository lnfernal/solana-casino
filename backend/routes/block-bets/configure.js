
const express = require('express');
const mysql = require('mysql');
const router = express.Router();

const config = require('../../public/javascripts/config.js')
const findDuplicate = require('../../public/javascripts/duplicateCheck.js')
const { SERVER_RPC, MAINNET_BETA_RPC, DEVNET_RPC } = require('../../public/javascripts/rpc.js')
const INSERT_INTO_DB = "INSERT INTO user_bets SET ?"
const VERIFY_LAST_BET = "SELECT * FROM user_bets WHERE wallet = ? ORDER BY id DESC LIMIT 1"
const SOLSCAN_MAINNET = "https://api.solscan.io/transaction"
const SOLSCAN_DEVNET = "https://api-devnet.solscan.io/transaction?tx="
const FAILED = "Failed"
const SUCCESS = "Success"
const COMPLETE_BET = "true"

const failedResponse = {
    status: "Failed",
}
router.post('/', async function(req, res, next) {
    var betTime = Date()
    let addBet = await addInitialBet(req.body.wallet, betTime, req.body.cardName)
    .catch((reason) => {
        console.log(reason)
        return res.send(failedResponse)
    })
    if (addBet === FAILED) {
        //recycleSuspicious(req.body.wallet, betTime)
        return res.send(failedResponse)
    } else {
        let successResponse = {
            status: SUCCESS,
            time: Date()
        }
        return res.send(successResponse)
    }
})

async function addInitialBet(wallet, betTime, cardName) {
    var connection = mysql.createConnection(config)
    try {
        let insertData = {
            wallet,
            cardName,
            amount: 0,
            lamports: 0,
            sendingToTreasury: "true",
            sendingToUser: "false",
            winner: "",
            depositSignature: "",
            withdrawSignature: "",
            sent: "false",
            complete: "false",
            time: betTime
        }

        connection.on('error', function(err) {
            console.log("[mysql error]", err)
        })

        connection.query(INSERT_INTO_DB, [insertData], (err, rows) => {
            if (rows?.affectedRows > 0) {
                connection.end()
                return SUCCESS
            } else {
                console.log(err)
                connection.end()
                return FAILED
            }
        })
    } catch (error) {
        console.log(error)
        connection.end()
        return FAILED
    }

}


module.exports = router