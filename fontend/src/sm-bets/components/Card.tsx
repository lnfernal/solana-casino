import { useEffect, useState, Component, FC} from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Container, Snackbar } from '@mui/material';
import Alert from '@mui/material/Alert';
import CopperRock from '../img/CopperRock.png'
import QuartzRock from '../img/QuartzRock.png'
import IronRock from '../img/Iron.png'
import GoldRock from '../img/Gold.png'
import EmeraldRock from '../img/Emerald.png'
import DiamondRock from '../img/Diamond.png'
import CopperWin from '../img/CopperWin.png'
import QuartzWin from '../img/QuartzWin.png'
import IronWin from '../img/IronWin.png'
import GoldWin from '../img/GoldWin.png'
import EmeraldWin from '../img/EmeraldWin.png'
import DiamondWin from '../img/DiamondWin.png'
import Lose from '../img/lose.png'
import CopperGif from '../img/CopperGif.gif'
import QuartzGif from '../img/QuartzGif.gif'
import IronGif from '../img/IronGif.gif'
import GoldGif from '../img/GoldGif.gif'
import EmeraldGif from '../img/EmeraldGif.gif'
import DiamondGif from '../img/DiamondGif.gif'

import LeftArrow from '../img/white-arrow-left.png'
import RightArrow from '../img/white-arrow-right.png'

import useSound from 'use-sound';
import WinOutput from "../audio/WinOutput.mp3"
import LoseOutput from '../audio/LoseOutput.mp3'
import MiningShimmer from '../audio/MiningWithShimmer.mp3'
import ArcadeBottom from '../img/ArcadeBottom.png'
import ArcadeMachine from '../img/ArcadeMachine.png'

import '../utils/font.css'
import { 
    ConfirmTransaction, 
    CardStatus, 
    CardAttributes,
    PopUpMessages,
    ResultImages,
    ErrorMessages,
    PhantomErrors,
    LocalRoute,
    WalletErrors,
    MachineState
} from '../constants';

import { 
    depositToTreasury
} from '../utils/Transaction'
import { AlertState } from '../utils/utils';
import { useWallet  } from '@solana/wallet-adapter-react';
import { 
    Connection,
    PublicKey,
    BlockheightBasedTransactionConfirmationStrategy,
    clusterApiUrl,
} from '@solana/web3.js';
import { RPC } from '../utils/rpc';


const CONNECTION = new Connection(RPC.rpcUrl, 'processed')

const Rock3 = "Rock3"

const SUCCESS = "Success"
const FAILED = "Failed"
const DEPOSIT_CONFIRMED = "Deposit Confirmed"
const WITHDRAW_CONFIRMED = "Withdraw Confirmed"
const USER_WINNER = "user"
const HOUSE_WINNER = "house"
const NO_WINNER = "no winner"
const NO_CARD = "no card detected"
const SOL_SENT = "Sol is already sent"
const BLANK_BET = "Blank Bet"
const NO_BLOCKHASH = "No BlockHash;"

const Card = (props: any) => {
 
    var config = {
        headers: {
          'Content-Type' : 'application/json'
        },
       };
       const configStart: Object = {
        headers: {
          'Content-Type' : 'application/json'
        },
        timeout: 1000 * 30
       };
       const configClaim: Object = {
        headers: {
          'Content-Type' : 'application/json'
        },
        //timeout: 1000 * 30
       };
       const configHandle: Object = {
        headers: {
          'Content-Type' : 'application/json'
        },
        timeout: 1000 * 30
       };
//timeout: 1000 * 10
    const [rockInfo, setRockInfo] = useState(props.rock)
    const fromWallet = useWallet()
    const [lastBetCard, setLastBet] = useState("")
    const { publicKey, sendTransaction } = useWallet()
    const [openingBool, setOpeningBool] = useState(false)
    const [machineState, setMachineState] = useState(props.machineState)
    const [playWin] = useSound(WinOutput)
    const [playLose] = useSound(LoseOutput)
    const [playMining] = useSound(MiningShimmer)

    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: '',
        severity: undefined,
      });

    const startBet = async (cardName: any) => {

        if (!publicKey) { return }
        if (cardName !== lastBetCard) {
            resetImage(cardName)
        }

        setOpeningBool(true)
        try {

            let configData = { wallet: publicKey.toBase58(), cardName}
           await axios.post(LocalRoute.local + "/config", JSON.stringify(configData), config)
            .then((res) => {
                if (res.data.status === FAILED) {
                    setStatusUI(cardName, CardStatus.errorOccurred)
                    setAlertState({
                        open: true,
                        message:
                        PopUpMessages.clickError,
                        severity: 'error',
                    });
                    setOpeningBool(false)
                    return
                } else {
                    setStatusUI(cardName, CardStatus.configuring)
                    setUpTransaction(cardName, res.data.time)
                    return
                }
            })
        } catch (error: any) {
                console.log(error)
                setAlertState({
                    open: true,
                    message:
                    PopUpMessages.clickError,
                    severity: 'error',
                });
                setStatusUI(cardName, CardStatus.errorOccurred)
                setOpeningBool(false)
                return
        }
    }


    const setUpTransaction = async (cardName: string, time: string) => {

        
        let signature = ''
        let toKey = process.env.REACT_APP_SOL
        let feeKey = process.env.REACT_APP_FEE
        if ( toKey === undefined || fromWallet.publicKey === null || feeKey === undefined) {
            setStatusUI(cardName, CardStatus.tryAgain)
            setOpeningBool(false)
            return
        }

        let toPublicKey = new PublicKey(toKey)
        let toFeePublicKey = new PublicKey(feeKey)
        let configResult = await depositToTreasury(toPublicKey, fromWallet.publicKey, toFeePublicKey, cardName, props.verifiedHolder)
        
        let status = configResult.status
        let transaction = configResult.transaction
        console.log(status)
        if (status === NO_BLOCKHASH) {
            setStatusUI(cardName, CardStatus.tryAgain)
            setOpeningBool(false)
            setAlertState({
                open: true,
                message: PopUpMessages.noBlockhash,
                severity: 'error',
            });
            return
        }

        if (status !== SUCCESS) {
            setStatusUI(cardName, CardStatus.tryAgain)
            setOpeningBool(false)
            setAlertState({
                open: true,
                message: PopUpMessages.simulationFailed,
                severity: 'error',
            });
            return
        }
  
        try {
            
            signature = await sendTransaction(transaction, CONNECTION)
            let userObj = {
                signature,
                wallet: publicKey
            }
            await axios.post(LocalRoute.local + "/processSignature", JSON.stringify(userObj), configStart)
            .then((res) => {
                if (res.data.status === FAILED) {
                    setAlertState({
                        open: true,
                        message: "Error Processing request.",
                        severity: 'error',
                    });
                    setStatusUI(cardName, CardStatus.tryAgain)
                    setOpeningBool(false)
                    throw { message: FAILED }
                }
            })

            setDeposit(cardName, signature)
            setAlertState({
                open: true,
                message: PopUpMessages.sendingDepositToHouse,
                severity: 'success',
              });
            setStatusUI(cardName, CardStatus.sendingDeposit)
            let blockHashObj = await CONNECTION.getLatestBlockhash()
            let blockStrat: BlockheightBasedTransactionConfirmationStrategy = {
                signature,
                blockhash: blockHashObj.blockhash,
                lastValidBlockHeight: blockHashObj.lastValidBlockHeight
            }
            await CONNECTION.confirmTransaction(
                blockStrat,
                'processed'
            )

            //start Mining animation

            // Success handle
           
            sendOpening(signature, cardName, true)
            return
        } catch (error: any) {
            let deleteObj;
            let slowError = error?.message.includes(ErrorMessages.cantConfirm)
            let userRejected = error?.message.includes(WalletErrors.userRejected)
            let insufficientFunds = error?.message.includes(WalletErrors.insufficientFunds)
            if (slowError) {
                setStatusUI(cardName, CardStatus.tryAgain)
                setOpeningBool(false)
                return
            }

            if (userRejected) {
                setAlertState({
                    open: true,
                    message: PhantomErrors.userRejected.title + ": " + PhantomErrors.userRejected.discription,
                    severity: 'error',
                  });
                  resetLoss(cardName)
                  setOpeningBool(false)
                  return
            }

            if (insufficientFunds) {
                setAlertState({
                    open: true,
                    message: PhantomErrors.insufficientFunds.title + ": " + PhantomErrors.insufficientFunds.discription,
                    severity: 'error',
                  });
                  resetLoss(cardName)
                  setOpeningBool(false)
                  return
            }

            switch (error?.code) {
                case PhantomErrors.disconnected.code:
                    setAlertState({
                        open: true,
                        message: PhantomErrors.disconnected.title + ": " + PhantomErrors.disconnected.discription,
                        severity: 'error',
                      });
                    break
                case PhantomErrors.unauthorized.code:
                    setAlertState({
                        open: true,
                        message: PhantomErrors.unauthorized.title + ": " + PhantomErrors.unauthorized.discription,
                        severity: 'error',
                      });
                    break
                case PhantomErrors.userRejected.code:
                    setAlertState({
                        open: true,
                        message: PhantomErrors.userRejected.title + ": " + PhantomErrors.userRejected.discription,
                        severity: 'error',
                      });
                      resetLoss(cardName)
                      setOpeningBool(false)
                      return
                    
                case PhantomErrors.internalError.code:
                    setAlertState({
                        open: true,
                        message: PhantomErrors.internalError.title + ": " + PhantomErrors.internalError.discription,
                        severity: 'error',
                    });
                    break
                case PhantomErrors.insufficientFunds.code:
                    setAlertState({
                        open: true,
                        message: PhantomErrors.insufficientFunds.title + ": " + PhantomErrors.insufficientFunds.discription,
                        severity: 'error',
                    });
                    break
                default: 
                    console.log(error)
                    setAlertState({
                        open: true,
                        message: "Error Processing request.",
                        severity: 'error',
                    });
                    setStatusUI(cardName, CardStatus.tryAgain)
                    setOpeningBool(false)
                    
                    return
            }
            setStatusUI(cardName, CardStatus.tryAgain)
            setOpeningBool(false)
            return
            
        }
  
    }

    const setOpeningGif = async (cardName: string) => {
        switch (cardName) {
            case CardAttributes.copperImage:
                setImageUI(cardName, ResultImages.copperGif)
                break
            case CardAttributes.quartzImage:
                setImageUI(cardName, ResultImages.quartzGif)
                break
            case CardAttributes.goldImage:
                setImageUI(cardName, ResultImages.goldGif)
                break
            case CardAttributes.emeraldImage:
                setImageUI(cardName, ResultImages.emeraldGif)
                break
            case CardAttributes.diamondImage:
                setImageUI(cardName, ResultImages.diamondGif)
                break
            default:
                console.log("error occurred")
                return
        }
        playMining()
        await wait(1000 * 5)
        return
    }

    const sendOpening = async (signature: string, cardName: string, gifBool: boolean) => {
        if (gifBool) { 
            await setOpeningGif(cardName)
         }
        let payload = {
            signature
        } 
        axios.post(LocalRoute.local + '/start', JSON.stringify(payload), configStart)
        .then((res) => {
            switch (res.data.winner) {
                case USER_WINNER: 
                    //Start Claim
                    setOpeningBool(true)
               
                    setStatusUI(cardName, CardStatus.claimReady)
                    setWinningImage(cardName)
                    playWin()
                    setAlertState({
                        open: true,
                        message: PopUpMessages.userWon1,
                        severity: 'success',
                    });
                    
                    return
                case HOUSE_WINNER:
                    //LOSE MESSAGE
                    //setLosingImage(cardName)
                    setOpeningBool(true)
                    setStatusUI(cardName, CardStatus.userLost)                
                    setImageUI(cardName, ResultImages.losing)
                    playLose()
                    setAlertState({
                        open: true,
                        message: PopUpMessages.userLost,
                        severity: 'success',
                    });

                    setLastBet(cardName)
                    props.setRefreshUser(true)
                    return
                case NO_WINNER: 
                    //Error message
                    setAlertState({
                        open: true,
                        message: PopUpMessages.clickError,
                        severity: 'error',
                    });
                    setStatusUI(cardName, CardStatus.errorOccurred)
                    resetImage(cardName)
                    setOpeningBool(false)
                    return
                default: 
                    setAlertState({
                        open: true,
                        message: PopUpMessages.clickError,
                        severity: 'error',
                    });
                    setOpeningBool(false)
                    resetImage(cardName)
                    setStatusUI(cardName, CardStatus.errorOccurred)
                    return
            } 

        })
        .catch((err) => {
                setAlertState({
                    open: true,
                    message: PopUpMessages.clickError,
                    severity: 'error',
                });
                resetImage(cardName)
                setStatusUI(cardName, CardStatus.errorOccurred)
                setOpeningBool(false)
                return
        })
        return
    }

    const setWinningImage = async (cardName: any) => {
        if (cardName === CardAttributes.copperName) {
            setImageUI(cardName, ResultImages.winningCopper)
        } else if (cardName === CardAttributes.quartzName) {
            setImageUI(cardName, ResultImages.winningQuartz)
        } else if (cardName === CardAttributes.ironName) {
            setImageUI(cardName, ResultImages.winningIron)
        } else if (cardName === CardAttributes.goldName) {
            setImageUI(cardName, ResultImages.winningGold)
        } else if (cardName === CardAttributes.emeraldName) {
            setImageUI(cardName, ResultImages.winningEmerald)
        } else if (cardName === CardAttributes.diamondName) {
            setImageUI(cardName, ResultImages.winningDiamond)
        } else {
            console.log("no winner detected")
        }
        return
    }


    const resetImage = async (cardName: any) => {
        if (cardName === CardAttributes.copperName) {
            setImageUI(cardName, CardAttributes.copperImage)
        } else if (cardName === CardAttributes.quartzName) {
            setImageUI(cardName, CardAttributes.quartzImage)
        } else if (cardName === CardAttributes.ironName) {
            setImageUI(cardName, CardAttributes.ironImage)
        } else if (cardName === CardAttributes.goldName) {
            setImageUI(cardName, CardAttributes.goldImage)
        } else if (cardName === CardAttributes.emeraldName) {
            setImageUI(cardName, CardAttributes.emeraldImage)
        } else if (cardName === CardAttributes.diamondName) {
            setImageUI(cardName, CardAttributes.diamondImage)
        } else {
            console.log("no winner detected")
        }

        return
    }

    const resetLoss = async (cardName: any) => {
        setStatusUI(cardName, CardStatus.ready)
        setOpeningBool(false)
        resetAll()
        if (cardName === CardAttributes.copperName) {
            setImageUI(cardName, CardAttributes.copperImage)
        } else if (cardName === CardAttributes.quartzImage) {
            setImageUI(cardName, CardAttributes.quartzImage)
        } else if (cardName === CardAttributes.ironName) {
            setImageUI(cardName, CardAttributes.ironImage)
        } else if (cardName === CardAttributes.goldName) {
            setImageUI(cardName, CardAttributes.goldImage)
        } else if (cardName === CardAttributes.emeraldName) {
            setImageUI(cardName, CardAttributes.emeraldImage)
        } else if (cardName === CardAttributes.diamondName) {
            setImageUI(cardName, CardAttributes.diamondImage)
        } else {
            console.log("no winner detected")
        }
        
        return
    }

    const nextMachine = async (currentName: string) => {
        let index = getIndex(currentName)
        if (index != 5) {
            setMachineState(MachineState.machineName[index + 1])
            return 
        } else {
            setMachineState(MachineState.machineName[0])
            return 
        }
    
    }

    const previousMachine = async (currentName: string) => {
        let index = getIndex(currentName)
        if (index != 0) {
            setMachineState(MachineState.machineName[index - 1])
            return
        } else {
            setMachineState(MachineState.machineName[5])
            return
        }
        
    }

    const claimReward = async (signature: string, cardName: string, amount: number) => {
        setAlertState({
            open: true,
            message:
              PopUpMessages.sendingRewards,
            severity: 'success',
        });
        let _obj = { signature }
        setStatusUI(cardName, CardStatus.sendingRewards)
        axios.post(LocalRoute.local + "/withdrawRewards", JSON.stringify(_obj), configClaim)
        .then((res) => {
            switch (res.data.status) {
                case SUCCESS:
                    setAlertState({
                        open: true,
                        message:
                          PopUpMessages.rewardsClaimed + amount * 2 + " SOL",
                        severity: 'success',
                    });
                    setStatusUI(cardName, CardStatus.claimSucceeded);
                    setOpeningBool(false)
                    resetImage(cardName)
                    resetAll()
                    props.setRefreshUser(true)
                    return
                case FAILED:
                      if (res.data.error === ErrorMessages.cantConfirm) {
                        
                        setStatusUI(cardName, CardStatus.claimSucceeded);
                        setOpeningBool(false);
                        setAlertState({
                            open: true,
                            message:
                              ErrorMessages.solanaSlow,
                            severity: 'error',
                        });
                        return
                      }

                    setAlertState({
                        open: true,
                        message: PopUpMessages.rewardsFailedToSend,
                        severity: 'error',
                      });
                    setStatusUI(cardName, CardStatus.claimFailed)
                    setOpeningBool(true)
                    return
                case SOL_SENT: 
                    setAlertState({
                        open: true,
                        message: amount * 2 + PopUpMessages.alreadySent,
                        severity: 'success',
                    });
                    setStatusUI(cardName, CardStatus.claimSucceeded);
                    setOpeningBool(false)
                    resetImage(cardName)
                    props.setRefreshUser(true)
                    return
                default:
                    console.log("ERROR")
                    setStatusUI(cardName, CardStatus.claimFailed)
                    setAlertState({
                        open: true,
                        message: PopUpMessages.rewardsFailedToSend,
                        severity: 'error',
                      });
                      setOpeningBool(true)
                      resetImage(cardName)
                    return

            }
        })
        .catch(error => {
            console.log(error)
            setAlertState({
                open: true,
                message: "Error Processing request.",
                severity: 'error',
            });
            resetImage(cardName)
            setStatusUI(cardName, CardStatus.claimFailed)
            setOpeningBool(false)
            return
        })
        return
    }

    const handleActive = async (obj: any) => {
        setStatusUI(obj.cardName, CardStatus.confirming)
        setOpeningBool(true)
        setAlertState({
            open: true,
            message:
            PopUpMessages.handlingError,
            severity: 'info',
        });
    
        let _obj = { signature: obj.depositSignature, wallet: publicKey }
        axios.post(LocalRoute.local + "/handleBet", JSON.stringify(_obj), configHandle)
        .then((res) => {
            switch (res.data.status) {
                case FAILED: 
                    setAlertState({
                        open: true,
                        message:
                        PopUpMessages.clickError,
                        severity: 'error',
                    });
                    setStatusUI(obj.cardName, CardStatus.errorOccurred)
                    setOpeningBool(true)
                    return
                case DEPOSIT_CONFIRMED:
                    sendOpening(obj.depositSignature, obj.cardName, true)
                    return
                case WITHDRAW_CONFIRMED:
                    setOpeningBool(false)
                    setAlertState({
                        open: true,
                        message:
                          PopUpMessages.rewardsClaimed + obj.amount * 2,
                        severity: 'success',
                    });
                    setStatusUI(obj.cardName, CardStatus.claimSucceeded)
                    setRockInfo(rocksReady)
                    props.setRefreshUser(true)
                    return
                case USER_WINNER: 
                    setAlertState({
                        open: true,
                        message: PopUpMessages.userWon1,
                        severity: 'success',
                    });
                    setOpeningBool(true)
                    setStatusUI(obj.cardName, CardStatus.claimReady)
                    setWinningImage(obj.cardName)
                    playWin()
                    return
                case HOUSE_WINNER:
                    setOpeningBool(true)
                    setStatusUI(obj.cardName, CardStatus.userLost)                
                    setImageUI(obj.cardName, ResultImages.losing)
                    playLose()
                    setAlertState({
                        open: true,
                        message: PopUpMessages.userLost,
                        severity: 'success',
                    });

                    setLastBet(obj.cardName)
                    props.setRefreshUser(true)
                    return
                case BLANK_BET:
                    setAlertState({
                        open: true,
                        message:
                        PopUpMessages.errorHandled,
                        severity: 'success',
                    });
                    props.setRefreshUser(true)
                    setStatusUI(obj.cardName, CardStatus.ready)
                    setRockInfo(rocksReady)
                    setOpeningBool(false)
                    
                    return
                default:
           
                    setAlertState({
                        open: true,
                        message:
                        PopUpMessages.clickError,
                        severity: 'error',
                    });
                    setStatusUI(obj.cardName, CardStatus.errorOccurred)
                    setOpeningBool(true)
                    props.setRefreshUser(true)
                    return 
            }
        }).catch((err) => {
            console.log(err)
            setAlertState({
                open: true,
                message: PopUpMessages.clickError,
                severity: 'error',
            });
            setStatusUI(obj.cardName, CardStatus.errorOccurred)
            setOpeningBool(false)
           
            return

        })
    }

    const resetAll = () => {
        for (let i in rockInfo) {
            setStatusUI(rockInfo[i].cardName, CardStatus.ready)
        }  
        return
    }

    const setDeposit = (card: string, depositSignature: string) => {
        let index = getIndex(card)
        let newObj = [...rockInfo]
        newObj[index].depositSignature = depositSignature
        setRockInfo(newObj)
        return
    }

    const setImageUI = (card: string, image: string) => {
        let index = getIndex(card)
        let newObj = [...rockInfo]
        newObj[index].image = image
        setRockInfo(newObj)
        return
    }

    //Set NFT card status
    const setStatusUI = (card: string, status: string) => {
        let index = getIndex(card)
        let newObj = [...rockInfo]
        newObj[index].status = status
        setRockInfo(newObj)
        return
    }

    const getIndex = (val: any) => {
        return rockInfo.findIndex((obj: any) => obj.cardName === val)
    }

    //confirm trasaction dummy
  const wait = (timeToDelay: any) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

 

    return(  
            
        <CardDiv>
           <Snackbar
                   style={{ 
                
                    top: "75px",
                    right: "24px",
                    left: "auto"
                 }}        
                open={alertState.open}
                autoHideDuration={
                    alertState.hideDuration === undefined ? 6000 : alertState.hideDuration
                }
                onClose={() => setAlertState({ ...alertState, open: false })}
                anchorOrigin={{horizontal: 'left', vertical: 'top'}}
            >
                <Alert
                    onClose={() => setAlertState({ ...alertState, open: false })}
                    severity={alertState.severity}
                >
                    {alertState.message}
                </Alert>
            </Snackbar>
           <RockDiv>  
           
                {rockInfo.filter((card: any) => card.cardName === machineState).map((arr: any, index: any) => {

                switch (arr.image) {
                    case CardAttributes.copperImage:
                        arr.image = CopperRock
                        break
                    case CardAttributes.quartzImage:
                        arr.image = QuartzRock
                        break
                    case CardAttributes.ironImage: 
                        arr.image = IronRock
                        break
                    case CardAttributes.goldImage:
                        arr.image = GoldRock
                        break
                    case CardAttributes.emeraldImage:
                        arr.image = EmeraldRock
                        break
                    case CardAttributes.diamondImage:
                        arr.image = DiamondRock
                        break
                    case ResultImages.winningCopper:
                        arr.image = CopperWin
                        break
                    case ResultImages.winningQuartz:
                        arr.image = QuartzWin
                        break
                    case ResultImages.winningIron:
                        arr.image = IronWin
                        break
                    case ResultImages.winningGold:
                        arr.image = GoldWin
                        break
                    case ResultImages.winningEmerald:
                        arr.image = EmeraldWin
                        break
                    case ResultImages.winningDiamond:
                        arr.image = DiamondWin
                        break
                    case ResultImages.losing:
                        arr.image = Lose
                        break
                    case ResultImages.copperGif:
                        arr.image = CopperGif
                        break
                    case ResultImages.quartzGif:
                        arr.image = QuartzGif
                        break
                    case ResultImages.ironGif: 
                        arr.image = IronGif
                        break;
                    case ResultImages.goldGif:
                        arr.image = GoldGif
                        break
                    case ResultImages.emeraldGif:
                        arr.image = EmeraldGif
                        break
                    case ResultImages.diamondGif:
                        arr.image = DiamondGif
                        break
                    default:
                        break
                }

                return (
                    
                        <RockCard >
                            <ArrowDiv>
                                <LeftArrowImg onClick={() => previousMachine(arr.cardName)} src={LeftArrow}/>
                                <RightArrowImg onClick={() => nextMachine(arr.cardName)} src={RightArrow}/>
                            </ArrowDiv>
                            {arr.status === CardStatus.ready && openingBool === false ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>
                                    <Button onClick={() => startBet(arr.cardName)}>{arr.status}</Button>  
                                </>
                            ) : arr.status === CardStatus.configuring && openingBool === true ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button>{arr.status}</Button>  
                                </>
                            ) : arr.status === CardStatus.sendingDeposit && openingBool === true ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button>{arr.status}</Button>
                                </>
                            ) : arr.status === CardStatus.claimReady && openingBool === true ? ( 
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button onClick={() => claimReward(arr.depositSignature, arr.cardName, arr.amount)}>{arr.status} {arr.amount * 2} SOL</Button> 
                                </>
                            ) : arr.status === CardStatus.claimFailed && openingBool === true ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button onClick={() => handleActive(arr)}>{arr.status}</Button> 
                                </>
                            ) : arr.status === CardStatus.claimSucceeded && openingBool === false ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button onClick={() => startBet(arr.cardName)}>{arr.status}</Button> 
                                </>
                            ) : arr.status === CardStatus.sendingRewards && openingBool === true ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>        
                                    <Button>{arr.status} {arr.amount * 2} SOL</Button> 
                                </>
                            ) : arr.status === CardStatus.userLost && openingBool === true ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button onClick={() => resetLoss(arr.cardName)}>{arr.status}</Button> 
                                </>
                            ) : arr.status === CardStatus.errorOccurred ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button onClick={() => handleActive(arr)}>{arr.status}</Button> 
                                </>
                             ) : arr.status === CardStatus.tryAgain && openingBool === false ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button onClick={() => startBet(arr.cardName)}>{arr.status}</Button> 
                                </>
                             ) : arr.status === CardStatus.confirming && openingBool === true ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button>{arr.status}</Button>
                                </>
                            ) : arr.status === CardStatus.confirmingTransaction && openingBool === true ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button>{arr.status}</Button>
                                </>
                            ) : arr.status === CardStatus.solanaSlow && openingBool === false ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button onClick={() => handleActive(arr)}>{arr.status}</Button> 
                                </>

                            ) : arr.status === CardStatus.unavailable && openingBool === false ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button>{arr.status}</Button> 
                                </>
                            ) : openingBool === true ? (
                                <>
                                    <Amount>{arr.amount} SOL</Amount>
                                    <RockImg src={arr.image}/>      
                                    <Button>Unavailable</Button> 
                                </>
                            ) : (
                                <>
                                <Amount>{arr.amount} SOL</Amount>
                                <RockImg src={arr.image}/>      
                                <Button onClick={() => handleActive(arr)}>{arr.status}</Button>
                                </>
                            )}
                                
                        </RockCard>
      

                    )
                })}
                      
           </RockDiv>
           
    
           </CardDiv>

    )
}

const rocksReady = [{
    cardName: CardAttributes.copperName,
    image: CardAttributes.copperImage,
    status: CardStatus.ready,
    amount: CardAttributes.copperAmount
},
{
    cardName: CardAttributes.quartzName,
    image: CardAttributes.quartzImage,
    status: CardStatus.ready,
    amount: CardAttributes.quartzAmount
},
{
    cardName: CardAttributes. ironName,
    image: CardAttributes.ironName,
    status: CardStatus.ready,
    amount: CardAttributes.ironAmount
},
{
    cardName: CardAttributes.goldName,
    image: CardAttributes.goldImage,
    status: CardStatus.ready,
    amount: CardAttributes.goldAmount
},
{
    cardName: CardAttributes.emeraldName,
    image: CardAttributes.emeraldImage,
    status: CardStatus.ready,
    amount: CardAttributes.emeraldAmount
},
{
    cardName: CardAttributes.diamondName,
    image: CardAttributes.diamondImage,
    status: CardStatus.ready,
    amount: CardAttributes.diamondAmount
}]


const Bottom = styled.img`
display: none;
@media (max-width: 1349px) {
    
    -webkit-background-size: cover;
      -moz-background-size: cover;
      -o-background-size: cover;
      height: 80px;
    width: 100%;
    display: inline-block;
    margin-top: 0px;
}
@media (max-width: 1004px) {
    margin-top: -25px;
}

@media (max-width: 669px) {
    display: none;
}

`

const AlertDiv = styled.div`
position: absolute;
top: 0;
right: 0;
`

const ArcadeImage = styled.img`
    padding:10px;

`

const Amount = styled.div`
    margin-top: 25px;
    font-size: 25px;
    font-family: FreePixel;
`

const RockDiv = styled.div`
    display:flex;
    justify-content: center;
    flex-flow: row wrap;
    padding-top: 322px;
    @media (max-width: 1226px) {
        padding-top: 302px;
    }
    @media (max-width: 1078px) {
        padding-top: 305px;
    }
    @media (max-width: 1037px) {
        padding-top: 285px;
    }
    @media (max-width: 1004px) {
        padding-top: 100px;
    }
 
`

const RockCard = styled.div`
    background-image: url(${ArcadeMachine});
    background-repeat: no-repeat; 
    background-size: contain;
    height: 770px;
    width: 325px;
 
    margin-right: 5px;
    margin-left: 5px; 
    @media (max-width: 1920px) {

        margin-bottom: -130px;
    }

    @media (max-width: 1004px) {
        margin-bottom: -160px;
    }
    
    
`

const RockImg = styled.img`
width: 219px;
height: 219px;
padding-top: 55px;
padding-bottom: 124px;
@media (max-width: 337px) {
    padding-top: 17%;
   width: 67%;
   height: 28%;
}

`
const Button = styled.button`
display: flex;
justify-content: center;
background: transparent;
width: 63%;
color: black;
text-decoration: none;
border-radius: 10px;
font-family: FreePixel;
font-size: 17px;
padding: 0px;
margin-left: 93px;
border: none;
`

const CardDiv = styled.div`

`

const RightArrowImg = styled.img`
position: absolute;
width: 50px;


`

const LeftArrowImg = styled.img`
position: absolute;
width: 50px;
margin-left: -375px;

@media(max-width: 444px) {
    margin-left: -75px;
}

`

const ArrowDiv = styled.div`
position: absolute;
display: flex-row;
padding-left: 325px;
padding-top: 300px;
@media(max-width: 444px) {
    padding-top: 600px;
    padding-left: 175px;
}
`

export default Card
