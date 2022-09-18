


export const ConfirmTransaction = {
    processed: "processed",
    confrimed: "confirmed",
    finalized: "finalized"
}

export const WalletErrors = {
    insufficientFunds: "custom program error: 0x1",
    userRejected: "User rejected the request"
}

export const CardStatus = {
    ready: "Start",
    configuring: "Configuring",
    sendingDeposit: "Sending Deposit",
    claimReady: "Claim",
    claimSucceeded: "Start",
    claimFailed: "Claim Failed",
    sendingRewards: "Sending",
    userLost: "Click to Reset",
    errorOccurred: "Click to Resolve Issue",
    tryAgain: "Click to Resolve Issue",
    confirmingTransaction: "Confirming",
    confirming: "Confirming",
    solanaSlow: "Confirm Transaction",
    reset: "Reset",
    unavailable: "Unavailable"
}

export const LocalRoute = {
    local: ""
}

export const ErrorMessages = {
    userRegectedDeposit: "User rejected the request.",
    handleTimout: "timeout of 30000ms exceeded",
    startTimout: "timeout of 30000ms exceeded",
    cantConfirm: "Transaction was not confirmed",
    solanaSlow: "Couldn't confirm transacrion, try again!",
    expiredBlockhash: "block height exceeded.",
    blockhashNotFound: "Blockhash not found"
}

export const PopUpMessages = {
    depositFailed: `Deposit Failed, Click "Error Occurred" to handle the error.`,
    depositSucceeded: "Deposit Succeeded.",
    rewardsClaimed: "Rewards Claimed: ",
    rewardsFailedToSend: "Rewards failed to send.",
    sendingDepositToHouse: "Sending Deposit. Please wait for confirmation.",
    userWon1: "You won, Make sure to claim!",
    userLost: "You lose, try again.",
    sendingRewards: "Sending rewards!",
    errorHandled: "Error Handled! Try Again.",
    confirmingTransaction: "Confirming previous transaction... Please wait.",
    confirming: "Confirming, please wait.",
    clickError: `Click to handle the error.`,
    alreadySent: " SOL already sent.",
    handlingError: "Handling Error, Please wait.",
    noBlockhash: "Transaction simulation failed: Blockhash not found.",
    simulationFailed: "Transaction failed to configure."
}

export const TimeSuffix = {
    seconds: " seconds ago",
    minutes: " minutes ago",
    hours: " hours ago",
    second: " second ago",
    minute: " minute ago",
    hour: " hour ago"
}

export const MachineState = {
    machineName: ["Copper", "Quartz", "Iron", "Gold", "Emerald", "Diamond"]
}

export const PhantomErrors = {
    disconnected: {
        code: 4900,
        title: "Disconnected",
        discription: "Phantom could not connect to the network."
    },
    unauthorized: {
        code: 4100,
        title: "Unauthorized",
        discription: "The requested method and/or account has not been authorized by the user."
    },
    userRejected: {
        code: 4001,
        title: "User Rejected Request",
        discription: "The user rejected the request through Phantom."
    },
    internalError: {
        code: -32603,
        title: "Internal Error",
        discription: "Something went wrong within Phantom."
    },
    insufficientFunds: {
        code: -32003,
        title: "Insufficent Funds",
        discription: "Not enough SOL in wallet  "
    }

}

export const CardAttributes = {
    copperName: "Copper",
    copperImage: "Copper",
    copperAmount: 0.05,
    quartzName: "Quartz",
    quartzImage: "Quartz",
    quartzAmount: 0.1,
    ironName: "Iron",
    ironImage: "Iron",
    ironAmount: 0.25,
    goldName: "Gold",
    goldImage: "Gold",
    goldAmount: 0.5,
    emeraldName: "Emerald",
    emeraldImage: "Emerald",
    emeraldAmount: 0.75,
    diamondName: "Diamond",
    diamondImage: 'Diamond',
    diamondAmount: 1
}

export const ResultImages = {
    winningCopper: "CopperWin",
    winningQuartz: "QuartzWin",
    winningIron: "IronWin",
    winningGold: "GoldWin",
    winningEmerald: "EmeraldWin",
    winningDiamond: "DiamondWin",
    losing: "losing",
    copperGif: "CopperGif",
    quartzGif: "QuartzGif",
    ironGif: "IronGif",
    goldGif: "GoldGif",
    emeraldGif: "EmeraldGif",
    diamondGif: "DiamondGif"

}


export var Rocks = [
{
    cardName: CardAttributes.copperName,
    image: CardAttributes.copperImage,
    status: CardStatus.ready,
    amount: CardAttributes.copperAmount,
    id: 0,
    wallet: "",
    lamports: "",
    sendingToTreasury: "",
    sendingToUser: "",
    winner: "",
    depositSignature: "",
    withdrawSignature: "",
    sent: "",
    complete: "",
    time: ""
},    
{
    cardName: CardAttributes.quartzName,
    image: CardAttributes.quartzImage,
    status: CardStatus.ready,
    amount: CardAttributes.quartzAmount,
    id: 0,
    wallet: "",
    lamports: "",
    sendingToTreasury: "",
    sendingToUser: "",
    winner: "",
    depositSignature: "",
    withdrawSignature: "",
    sent: "",
    complete: "",
    time: ""
}, 
{    

    cardName: CardAttributes.ironName,
    image: CardAttributes.ironImage,
    status: CardStatus.ready,
    amount: CardAttributes.ironAmount,
    id: 0,
    wallet: "",
    lamports: "",
    sendingToTreasury: "",
    sendingToUser: "",
    winner: "",
    depositSignature: "",
    withdrawSignature: "",
    sent: "",
    complete: "",
    time: ""
},
{
    cardName: CardAttributes.goldName,
    image: CardAttributes.goldImage,
    status: CardStatus.ready,
    amount: CardAttributes.goldAmount,
    id: 0,
    wallet: "",
    lamports: "",
    sendingToTreasury: "",
    sendingToUser: "",
    winner: "",
    depositSignature: "",
    withdrawSignature: "",
    sent: "",
    complete: "",
    time: ""
},
{
    cardName: CardAttributes.emeraldName,
    image: CardAttributes.emeraldImage,
    status: CardStatus.ready,
    amount: CardAttributes.emeraldAmount,
    id: 0,
    wallet: "",
    lamports: "",
    sendingToTreasury: "",
    sendingToUser: "",
    winner: "",
    depositSignature: "",
    withdrawSignature: "",
    sent: "",
    complete: "",
    time: ""
},
{
    cardName: CardAttributes.diamondName,
    image: CardAttributes.diamondImage,
    status: CardStatus.ready,
    amount: CardAttributes.diamondAmount,
    id: 0,
    wallet: "",
    lamports: "",
    sendingToTreasury: "",
    sendingToUser: "",
    winner: "",
    depositSignature: "",
    withdrawSignature: "",
    sent: "",
    complete: "",
    time: ""
}]
