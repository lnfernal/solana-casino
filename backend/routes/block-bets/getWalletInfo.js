const express = require('express');
const router = express.Router();
const config = require('../../public/javascripts/config.js')
const mysql = require('mysql');

const FAILED = "Failed"
const GET_WALLET_INFO = "SELECT * FROM user_bet_info WHERE wallet = ?"

router.post('/', async function(req, res, next) {
    console.log("start getting user bets")
    var wallet = req.body.wallet
    var info;
    console.log(wallet)
    let connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })

    connection.query(GET_WALLET_INFO, [wallet], (err, rows) => {
        if (err) {
            console.log(err)
            connection.end()
            return res.send({ totalBets: 0 })
        }
        for (let i in rows) {
            info = rows[i].betAmount
        }
        if (info !== undefined) {
            let bets = {
                totalBets: info
            }
            console.log(bets)
            connection.end()
            return res.send(bets)
        } else {
            let zeroBets = {
                totalBets: 0
            }
             console.log(zeroBets)
            connection.end()
            return res.send(zeroBets)
        }
        
    })
    
})

module.exports = router