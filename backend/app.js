const fs = require("fs")
const path = require("path")
const env = require('./env.js')

var express = require('express')
const app = express()
const cors = require('cors');

const http = require('http').createServer(app)


//Block bet routes
const configure = require("./routes/block-bets/configure.js")
const start = require("./routes/block-bets/start.js")
const withdrawRewards = require("./routes/block-bets/withdrawReward.js")
const getInfo = require("./routes/block-bets/getInfo.js")
const getCommunityBets = require('./routes/block-bets/getCommunityBets.js')
const getUserRecent = require('./routes/block-bets/getUserRecent.js')
const handleBet = require('./routes/block-bets/handleBet.js')
const processSignature = require('./routes/block-bets/processSignature.js')
const getWalletInfo = require('./routes/block-bets/getWalletInfo.js')

const { setIO } = require('./public/javascripts/socket.js')
const { config } = require("process")

//let io = setIO(https)
let io = setIO(http)

io.on("connection", function() {
        console.log("connected")
})

// middleware
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("client"));

//Block bets
app.use('/config', configure)
app.use('/start', start)
app.use('/withdrawRewards', withdrawRewards)
app.use('/getInfo', getInfo)
app.use('/getCommunityBets', getCommunityBets)
app.use('/getUserRecent', getUserRecent)
app.use('/handleBet', handleBet)
app.use('/processSignature', processSignature)
app.use('/getWallet', getWalletInfo)

http.listen(env.PORT,() => console.log(`Listening on port ${env.PORT}...`));
