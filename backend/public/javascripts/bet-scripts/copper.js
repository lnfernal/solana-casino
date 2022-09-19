const mysql = require('mysql');
const config = require('../config')

//prcentage from 0 to 1
const HOUSE_PERCENTAGE = 0.5

const SUCCESS = "Success"
const FAILED = "Failed"
const COMPLETE = "true"
const USER_WINNER = "user"
const HOUSE_WINNER = "house"
const UPDATE_USER_WINNER = "UPDATE user_bets SET winner = ? WHERE depositSignature = ?"
const UPDATE_HOUSE_WIN = "UPDATE user_bets SET winner = ?, complete = ? WHERE depositSignature = ?"

const failedObj = {
    status: FAILED,
    winner: FAILED
}

const userSuccess = {
    status: SUCCESS,
    winner: USER_WINNER
}

const houseSuccess = {
    status: SUCCESS,
    winner: HOUSE_WINNER
}

module.exports = async function copperScript(depositId, callback) {
    //user win is true and house win is false
    var randomNumber = Math.random()
    console.log(randomNumber)

    if (randomNumber < HOUSE_PERCENTAGE) {
        //house wins
        let count = await countHouseWinner(depositId)
        console.log(count)
        switch (count) {
            case SUCCESS: 
                console.log("HOUSE WINS!!!!")
                callback(houseSuccess)
                return
            case FAILED:
                console.log("failed to keep track house")    
                callback(failedObj)
                return
        }
    } else {
        //user wins
        let count = await countUserWinner(depositId)
        console.log(count)
        switch (count) {
            case SUCCESS: 
                console.log("User WINS")
                callback(userSuccess)
                return 
            case FAILED:
                console.log("failed to keep track user")
                callback(failedObj)
                return
        }
    }

}



async function countUserWinner(betId) {
    try {
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection(config)
        connection.on('error', function(err) {
            console.log("[mysql error]", err)
        })

        

        connection.query(UPDATE_USER_WINNER, [USER_WINNER, betId], (err, rows) => {
        
            if (rows?.affectedRows > 0) {
                console.log("User WIN COUNTED at row " + betId)
                connection.end()
                resolve(SUCCESS)
                return
            } else {
                console.log("User win failed to COUNT")
                connection.end()  
                reject(FAILED)
                return
            }
            
        })
    })
    } catch (error) {
        console.log(error)
    }

}

async function countHouseWinner(betId) {
    try {
        return new Promise((resolve, reject) => {
   
            let connection = mysql.createConnection(config)
            connection.on('error', function(err) {
                console.log("[mysql error]", err)
            })

            connection.query(UPDATE_HOUSE_WIN, [HOUSE_WINNER, COMPLETE, betId], (err, rows) => {
            
                if (rows?.affectedRows > 0) {
                    console.log("House WIN COUNTED")
                    connection.end()
                    resolve(SUCCESS)
                    return
                } else {
                    console.log("house win failed to COUNT")
                    connection.end()
                    reject(FAILED)
                    return
                }
                
            })
        })
    } catch (error) {
        console.log(error)
    }
    
}
