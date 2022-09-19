const express = require('express');
const router = express.Router();
const config = require('../../public/javascripts/config.js')
const mysql = require('mysql');
const { get } = require('https');

const SUCCESS = "Success"
const FAILED = "Failed"
const USER_WINNER = "user"
const HOUSE_WINNER = "house"
const NO_WINNER = "no winner"
const NO_CARD = "no card detected"
const CARD_1 = "Gem1"
const CARD_2 = "Gem2"

const TRANSACTION_SUCCESS = "false"

const GET_RECENT_BET_INFO = "SELECT * FROM user_bets WHERE wallet = ? ORDER BY id DESC LIMIT 10"

router.post('/', async function(req, res, next) {
    console.log("start getting user bets")
    var wallet = req.body.wallet
    var cards = [{}]
    console.log(wallet)
    let connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })

    connection.query(GET_RECENT_BET_INFO, [wallet], (err, rows) => {

        for (let i in rows) {
         
            cards.push({
                
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
        }
        cards.shift()
    
        connection.end()
        return res.send(cards)
        
    })

})

module.exports = router