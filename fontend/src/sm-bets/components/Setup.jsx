
import React, { useEffect, useState, createRef} from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import axios from "axios";
import { useWallet} from '@solana/wallet-adapter-react';   
import { CardStatus, LocalRoute, MachineState } from '../constants'
import styled from 'styled-components';
import Card from './Card'
import { Rocks , CardAttributes} from '../constants';
import Leaderboards from './Leaderboards';
import Arcade from '../img/BlankBackground.png'
import LoginMachine from '../img/LoginMachine.png'
import Navigation from './Navigation';
import ResponsiveArcade from '../img/ResponsiveArcade.png'
import ArcadeBottom from '../img/ArcadeBottom.png'
import BlockBetsBannerImg from '../img/BlockBetsBanner.png'
import { getParsedNftAccountsByOwner} from "@nfteyez/sol-rayz";
import { RPC } from '../utils/rpc';



const NOT_COMPLETED = "false"

const FAILED = "Failed"
const CONNECTION = new Connection(RPC.rpcUrl, 'processed')

const Setup = (props) => {
    const [loading, setLoading] = useState(false);
    const [refreshUser, setRefreshUser] = useState(false)
    const [verifiedHolder, setVerifiedHolder] = useState(false)
    const [rocks, setRocks] = useState([{}])
    const [machineState, setMachineState] = useState(MachineState.machineName[0])
    const wallet =  useWallet()
    const { publicKey } = useWallet()
    const [solanaTPS, setSolanaTPS] = useState()
    const authorityWallet = process.env.REACT_APP_AUTH_WALLET
    const splToken = require('@solana/spl-token');

    
      var config = {
        headers: {'Content-Type' : 'application/json' },
        'Access-Control-Allow-Origin': '*' 
       };

       const getAllNftData = async () => {
        
        try {
            //create connection
            let ownerToken = wallet.publicKey
            //get nft data from Nft Eyez
            const nfts = await getParsedNftAccountsByOwner({
                publicAddress: ownerToken,
                connection: CONNECTION,
                serialization: true,
            });
            return nfts;
        } catch (error) {
            console.log(error);
        }
    };

    //Function to get all nft metadata from getAllNftData
    const getNftTokenData = async () => {
        try {
            //Get data from nfts
            let nftData = await getAllNftData();
            //Map object from wallets nft metadata
            var data = Object.keys(nftData).map((key) => nftData[key])
            //Declare mint array for comparison                                         
            let arr = []
            let n = nftData.length;
            //Loop through nfts and look for nfts with the correct authority wallet
        for (let i = 0; i < n; i++) {
                if (nftData[i].updateAuthority == authorityWallet) {
                    setVerifiedHolder(true)
                    return
                }

        }
        } catch (error) {
        console.log(error);
        }   
    }

       const getChainInfo = async () => {
           axios.get("https://api.solscan.io/chaininfo", config)
           .then((res) => {
               
              
          
                for (let i in res.data.data.tpsByTimeframe) {
                        setSolanaTPS(Math.floor(res.data.data.tpsByTimeframe[i][0].tps))
                }
                return
            })
       }

       const getPossibleRocks = async () => {
        setLoading(true)
        if (wallet.publicKey?.toBase58() === undefined) { return }
        let info = { wallet: wallet.publicKey?.toBase58()}
        
        let errorCard = ""
        let returnValue = [{}]
        await axios.post(LocalRoute.local + '/getInfo', JSON.stringify(info), config) 
        .then((res) => {
            if (res.data.length === 0) {
                setRocks(Rocks)
                setLoading(false)
                return 
            }
            for (let i in res.data) {

                if (res.data[i].complete === NOT_COMPLETED) {
                   
                    errorCard = res.data[i].cardName

                    for (let j in Rocks) {
                        
                        if (Rocks[j].cardName === errorCard) {
                           
                           returnValue.push({
                                id: res.data[i].id,
                                wallet: res.data[i].wallet,
                                image: res.data[i].cardName,
                                cardName: res.data[i].cardName,
                                amount: Rocks[j].amount,
                                lamports: res.data[i].lamports,
                                sendingToTreasury: res.data[i].sendingToTreasury,
                                sendingToUser: res.data[i].sendingToUser,
                                winner: res.data[i].winner,
                                depositSignature: res.data[i].depositSignature,
                                withdrawSignature: res.data[i].withdrawSignature,
                                sent: res.data[i].sent,
                                status: CardStatus.errorOccurred,
                                complete: res.data[i].complete
                            })
                            setMachineState(res.data[i].cardName)
                           
                        } else {
                            
                            returnValue.push({
                                id: Rocks[j].id,
                                wallet: Rocks[j].wallet,
                                image: Rocks[j].cardName,
                                cardName: Rocks[j].cardName,
                                amount: Rocks[j].amount,
                                lamports: Rocks[j].lamports,
                                sendingToTreasury: Rocks[j].sendingToTreasury,
                                sendingToUser: Rocks[j].sendingToUser,
                                winner: Rocks[j].winner,
                                depositSignature: Rocks[j].depositSignature,
                                withdrawSignature: Rocks[j].withdrawSignature,
                                sent: Rocks[j].sent,
                                status: CardStatus.unavailable,
                                complete: Rocks[j].complete
                            })
                            
                            
                        }
                    }

                   returnValue.shift()
                   setRocks(returnValue)
                   setLoading(false)
                    return 
                } else  {
                    setRocks(Rocks)
                    setLoading(false)
                   return
                }   
            }
        })
       }

       const getTokenAccount = async () => {
        try {
        if (wallet.publicKey?.toBase58() === undefined) { return }
     
           let mint = new PublicKey("2WkfiH18rMcxXxkkufiK5BjZhzkSuwZquNoMdMZPh7WZ")
        
           let account = await   CONNECTION.getTokenAccountsByOwner(wallet.publicKey,
                {   
                    mint,
                     programId: splToken.TOKEN_PROGRAM_ID 
                }
            )
            let balance = await CONNECTION.getTokenAccountBalance(account.value[0].pubkey, 'confirmed')
            if (balance.value.uiAmount > 0) {
                setVerifiedHolder(true)
            } 
            return
            } catch (error) {
                console.log(error)
                return
            }
       }

       //Lifecycle
    useEffect( () => {
        getTokenAccount()
        getNftTokenData()
        getChainInfo()
         getPossibleRocks()
          
      }, [wallet.connected]);

    return(
        <div className='main'>
            <>
              {!loading ? (
                <>
                    <Background>
                        <Navigation solanaTPS={solanaTPS} refreshUser={refreshUser} verifiedHolder={verifiedHolder}/>
                        {verifiedHolder ? (
                            <>
                            <BlockBetsBannerVerified src={BlockBetsBannerImg}/>
                            </>
                        ): (
                            <>
                            <BlockBetsBanner src={BlockBetsBannerImg}/>
                            </>
                        )}
                 
                        <Card rock={rocks} refreshUser={refreshUser} setRefreshUser={setRefreshUser} verifiedHolder={verifiedHolder} machineState={machineState}/>
                     
                    </Background>
                    <Leaderboards  refreshUser={refreshUser} setRefreshUser={setRefreshUser}/>
                </>
              ):(
                <>
                    <LoginScreen>
                        <Navigation solanaTPS={solanaTPS}/>
                        <BlockBetsBannerLogin src={BlockBetsBannerImg}/>
                        <LoginMachineImg src={LoginMachine}/>
                    </LoginScreen>
                </>
              )}
            </> 
        </div>
    )
};

const Background = styled.div`
    text-align: center;
    background: url(${Arcade}) no-repeat;
    width: 100%;
    height: 1080px;

    background-size: 100% 100%;


@media (max-width: 1920px) {
    background: url(${Arcade}) no-repeat ;
    background-size: cover;
    height: 1080px;
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
}

@media (max-width: 1004px) {
    height: 1170px;
}

`


const RockLoad = styled.p`
    font-family: FreePixel;
    color: #fff;
    display: flex;
    justify-content: center;
    font-size: 35px;

`


const LoginScreen = styled.div`
text-align: center;
background: url(${Arcade}) no-repeat;
width: 100%;
height: 1080px;

background-size: 100% 100%;


@media (max-width: 1920px) {
background: url(${Arcade}) no-repeat ;
background-size: cover;
height: 1080px;
-webkit-background-size: cover;
-moz-background-size: cover;
-o-background-size: cover;
}
@media (max-width: 1004px) {
height: 1170px;
}
`

const BlockBetsBannerVerified = styled.img`
    pointer-events: none;
    position: absolute;
    padding-top: 200px;
    left: 50%;
    top: 160px;
    transform: translate(-50%, -50%);
    width: 400px;
    @media (max-width: 1004px) {
        padding-top: 530px;
    }
    @media (max-width: 400px) {
        width: 100%;
    }
`

const BlockBetsBanner = styled.img`
pointer-events: none;
position: absolute;
padding-top: 200px;
left: 50%;
top: 160px;
transform: translate(-50%, -50%);
width: 400px;
@media (max-width: 1004px) {
    padding-top: 430px;
}

@media (max-width: 400px) {
    width: 100%;
}
`

const BlockBetsBannerLogin = styled.img`
pointer-events: none;
    position: absolute;
    padding-top: 200px;
    left: 50%;
    top: 160px;
    transform: translate(-50%, -50%);
    width: 400px;
    @media (max-width: 1004px) {
        padding-top: 450px;
    }
    @media (max-width: 400px) {
        width: 100%;
    }
`
const LoginMachineImg = styled.img`
height: 602px;
width: 325px;
margin-top: 305px;
padding-left: 5px;

@media (max-width: 1920px) {

    margin-bottom: -130px;
}

@media (max-width: 1319px) {
 
}
@media (max-width: 1004px) {
    margin-top: 135px;
}

`
export default Setup


