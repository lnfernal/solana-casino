const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const config = require('../../public/javascripts/config')
const web3 = require("@solana/web3.js")
require('dotenv').config()
const splToken = require("@solana/spl-token");
const CryptoJs = require('crypto-js')
const { SERVER_RPC, MAINNET_BETA_RPC, DEVNET_RPC } = require('../../public/javascripts/rpc.js')
const findDuplicate = require('../../public/javascripts/duplicateCheck.js')
const WRONG_WINNER = "House has won"
const SOL_SENT = "Sol is already sent"

const NO_SOL = 0
const DOUBLE_OR_NOTHING = 2
const COPPER_AMOUNT = 0.05
const QUARTZ_AMOUNT = 0.1
const IRON_AMOUNT = 0.25
const GOLD_AMOUNT = 0.5
const EMERALD_AMOUNT = 0.75
const DIAMOND_AMOUNT = 1

const FAILED = "Failed"
const SUCCESS = "Success"
const USER_WINNER = "user"
const HOUSE_WINNER = "house"
const DUPLICATE_FOUND = "false"
const SENDING_TO_USER = "true"
const NOT_SENT = "false"
const SENDING_TO_USER_DONE = "true"
const SENDING_TO_USER_FAILED = "false"
const SENT = "true"

const SLOW_TRANSACTION = "Transaction couldn't confirm"

//0.1 SOL
const COPPER_LAMPORTS = 100000000
const QUARTZ_LAMPORTS = 200000000
const IRON_LAMPORTS = 500000000
const GOLD_LAMPORTS = 1000000000
const EMERALD_LAMPORTS = 1500000000
const DIAMOND_LAMPORTS = 2000000000

const CHECK_WINNER = "SELECT * FROM user_bets WHERE depositSignature = ?"
const UPDATE_SUCCESS_CLAIM = "UPDATE user_bets SET withdrawSignature = ?, sendingToUser = ?, sent = ?, complete = ? WHERE depositSignature = ?"
const SENDING_TO_USER_QUERY = "UPDATE user_bets SET sendingToUser = ? WHERE depositSignature = ?"
const HANDLE_FAIL_DB = "UPDATE user_bets SET sendingToUser = ?, sent = ? WHERE depositSignature = ?"
const UPDATE_SIGNATURE = "UPDATE user_bets SET withdrawSignature = ? WHERE depositSignature = ?"

const RPC_CONNECTION = new web3.Connection(SERVER_RPC, 'confirmed')

const houseWinError = {
  status: FAILED,
  error: WRONG_WINNER
}

router.post('/', async function(req, res) {
  console.log("start claim")
  let check;
  await findDuplicate.duplicateCheck(req.body.signature, true, function(result){
      check = result

      console.log("check" + check)
      if (check === DUPLICATE_FOUND || check === FAILED) {
        let _obj = {
          status: FAILED,
        }
          return res.send(_obj)
      }
  })
  .catch((reason) => {
    console.log(reason)
    let _obj = {
      status: FAILED,
    }
      return res.send(_obj)
  })


  var amount;
  var winner
  var cardName;
  var withdrawSignature;
  var toWalletString;
  var isSent
  var depositSignature = req.body.signature

  let confirmResult = await confirmWinningDeposit(depositSignature)
  .catch((reason) => {
    console.log(reason)
    let _obj = {
      status: FAILED,
    }
    return res.send(_obj)
  })
  if (confirmResult === FAILED) {
    let _obj = {
      status: FAILED,
    }
    return res.send(_obj)
  }

  let sqlConn = mysql.createConnection(config)

  sqlConn.on('error', function(err) {
    console.log("[mysql error]", err)
  })
  

  try {

    
    //Get miner info

    sqlConn.query(CHECK_WINNER, [depositSignature], (err, rows) => {
      if (err) throw err

      for (let i in rows) {

        sqlConn.end()
        amount = rows[i].amount 
        cardName = rows[i].cardName
        winner = rows[i].winner
        toWalletString = rows[i].wallet
        isSent = rows[i].sent

        if (winner === HOUSE_WINNER) {
          console.log(houseWinError)
          return res.send(houseWinError)
        }
        console.log(isSent)
        console.log(SENT)
        if (isSent !== SENT) {
          //Start transaction
          createTransaction(toWalletString, amount)
        } else {
          console.log(isSent)
          //sol has been sent
          let errorObj = {
            status: SOL_SENT
          }
          console.log(errorObj)
          return res.send(errorObj)
        }
    	}    
    })
  } catch (error) {
    console.log("error")
    let errorObj = {
      status: FAILED,
      error: error?.message
    }
    console.log(errorObj)
    return res.send(errorObj)
  }


  
  async function createTransaction(userPublicKey, amount) {
    console.log("start transaction")
    let checkWalletSignatures = await confirmWalletSignature(userPublicKey, depositSignature)
    .catch((reason) => {
      let errorObj = {
        status: FAILED
      }
      console.log(reason)
      return res.send(errorObj)
    })
    if (checkWalletSignatures === FAILED) {
      let errorObj = {
        status: FAILED
      }
      console.log(errorObj)
      return res.send(errorObj)
    }
    let rewardResult = await organizeRewards(amount)
    .catch((reason) => {
      let errorObj = {
        status: FAILED
      }
      console.log(reason)
      return res.send(errorObj)
    })
    console.log(rewardResult)
    if (rewardResult === NO_SOL) {
      let errorObj = {
        status: SUCCESS,
        error: SOL_SENT
      }
      console.log(errorObj)
      return res.send(errorObj)
    }
    let splitArray = process.env.TREASURY_KEY.split(",");
    let secretKey = new Uint8Array(splitArray)
    let w1Wallet = web3.Keypair.fromSecretKey(secretKey)
    //RPC cluster
    let treasury = w1Wallet

    //user public key
   
    let user = new web3.PublicKey(userPublicKey)
    console.log(user)
    const claimTransactions = new web3.Transaction()
    
    try {
      
      //Create transfer instruction
      claimTransactions.add(
       web3.SystemProgram.transfer({
         toPubkey: user,
         fromPubkey: treasury.publicKey,
         lamports: rewardResult
       })
	    )
	    
      let blockHashObj = await RPC_CONNECTION.getLatestBlockhash()
      claimTransactions.feePayer = treasury.publicKey
      claimTransactions.recentBlockhash = blockHashObj.blockhash
      claimTransactions.lastValidBlockHeight = blockHashObj.lastValidBlockHeight
      
      //send transaction
      await changeUserSending(depositSignature, SENDING_TO_USER)
      
      console.log(`sending transaction, block hash: ${blockHashObj.blockhash}`)

      withdrawSignature = await web3.sendAndConfirmTransaction(RPC_CONNECTION, claimTransactions, [treasury], { commitment: 'processed' })
       await addSignature(withdrawSignature, depositSignature)
      //Create connection
      let _splConnection = mysql.createConnection(config)

      _splConnection.on('error', function(err) {
        console.log("[mysql error]", err)
      })

      //Update Mine
      _splConnection.query(UPDATE_SUCCESS_CLAIM, [withdrawSignature, SENDING_TO_USER_DONE, SENT, SENT, depositSignature], (err, rows) => {

        if (rows?.affectedRows > 0) {
          let successObj = {
              status: SUCCESS,
              withdrawSignature
          }
          _splConnection.end()
          console.log(successObj)
          return res.send(successObj)
        } else {
          _splConnection.end()
          let _obj = {
            status: FAILED,
            error: ""
          }
          console.log(_obj)
          return res.send(_obj)
        }   
      })
    } catch (error) {

      let _error = error?.message.includes(SLOW_TRANSACTION)
      //Handle any errors
      //Change status back to claim
      console.log(error)
      let failConnection = mysql.createConnection(config)

      failConnection.on('error', function(err) {
        console.log("[mysql error]", err)
      })

      failConnection.query(HANDLE_FAIL_DB, [SENDING_TO_USER_FAILED, NOT_SENT, depositSignature], (err, rows) => {
        if (rows?.affectedRows > 0) {
          console.log("success FAIL claim change")
          failConnection.end()
          let _obj = {
            status: FAILED,
          }
          console.log(_obj)
          return res.send(_obj)
          } else {
            console.log("fail failed claim changed")
            failConnection.end()
            let _obj = {
              status: FAILED,
            }
            return res.send(_obj)
          }
        })


    }  
  }    
})

async function checkForWinner(winner) {
  if (winner === HOUSE_WINNER) {
    return false
  } else {
    return true
  }
}

async function organizeRewards(amount) {
  console.log(amount)
  switch(amount) {
    case COPPER_AMOUNT:
      return COPPER_LAMPORTS
    case QUARTZ_AMOUNT:
      return QUARTZ_LAMPORTS
    case IRON_AMOUNT:
      return IRON_LAMPORTS
    case GOLD_AMOUNT:
      return GOLD_LAMPORTS
    case EMERALD_AMOUNT:
      return EMERALD_LAMPORTS
    case DIAMOND_AMOUNT:
      return DIAMOND_LAMPORTS
    default: 
      return NO_SOL
  }
}

async function multiplyLamports(lamports) {
  return lamports * DOUBLE_OR_NOTHING
}

async function changeUserSending(id, status) {

  let sqlConn = mysql.createConnection(config)
  let success;
  sqlConn.on('error', function(err) {
    console.log("[mysql error]", err)
  })

  sqlConn.query(SENDING_TO_USER_QUERY, [status, id], (err, rows) => {
    if (rows?.affectedRows > 0) {
      console.log("SENDING SOL TO USER")
      success = true
      sqlConn.end()
      return success
    } else {
      console.log("FAILED TO KEEP TRACK OF SENDING")
      success = false
      sqlConn.end()
      return success
    }
  })

}

async function addSignature(signature, id) {

  let connection = mysql.createConnection(config)
  connection.on('error', function(err) {
      console.log("[mysql error]", err)
  })
  connection.query(UPDATE_SIGNATURE, [signature, id], (err, rows) => {
      
      if (rows?.affectedRows > 0) {
          console.log("Sigature Added")
          connection.end()
          return
      } else {
          console.log("Signature failed to add")
          connection.end()
          return
      }
  })
}

async function confirmWinningDeposit(signature) {
  try {
    console.log(signature)
    let status = await RPC_CONNECTION.getSignatureStatus(signature, { searchTransactionHistory: true })
    let recentBlockhash = await RPC_CONNECTION.getLatestBlockhash() 
    if (status.value.confirmationStatus === undefined) {
   
      await connection.confirmTransaction({
        signature,
        lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
        blockhash: recentBlockhash.blockhash
      }, 'processed')

      return SUCCESS
    } else {
      return SUCCESS
    }
  } catch (error) {
    console.log(error)
    return FAILED
  }     
}

async function confirmWalletSignature(wallet, signature) {
  try {
    console.log(wallet)
    let pubKey = new web3.PublicKey(wallet)
    await RPC_CONNECTION.getSignaturesForAddress(pubKey, { limit: 200, until: signature }, 'confirmed')

    
    return SUCCESS
  } catch (error) {
    console.log(error)
    return FAILED
  }     
}



module.exports = router