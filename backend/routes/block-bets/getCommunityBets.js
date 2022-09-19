const express = require('express');
const router = express.Router();
const config = require('../../public/javascripts/config.js')
const mysql = require('mysql');

const SUCCESS = "Success"



const COMPLETED_BETS = "true"

const GET_RECENT_BET_INFO = "SELECT * FROM user_bets WHERE complete = ? ORDER BY id DESC LIMIT 10"


router.get('/', async function(req, res, next) {
    console.log("start getting community info")
 

    
 
    var bets = [{}]
    let connection = mysql.createConnection(config)

    connection.on('error', function(err) {
        console.log("[mysql error]", err)
    })

    connection.query(GET_RECENT_BET_INFO, [COMPLETED_BETS], (err, rows) => {

        for (let i in rows) {
         
            bets.push({
                
                wallet: rows[i].wallet,
                shortenedAddress: shortenAddress(rows[i].wallet),
                amount: rows[i].amount,
                winner: rows[i].winner,
                time: rows[i].time
            })
        }
        bets.shift()
        
        connection.end()
        return res.send(bets)
        
    })

})

const shortenAddress = (address, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

module.exports = router