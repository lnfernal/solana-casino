import { useEffect, useState} from 'react';
import axios from "axios";
import {useWallet} from '@solana/wallet-adapter-react';   
import { LocalRoute } from '../constants'
import styled from 'styled-components';
import CaveImg from '../img/BockBetsCave.png'
import '../utils/font.css'
import LeaderboardFrame from '../img/LeaderboardFrame.png'

import {
    getTime
} from '../utils/utils'



const FAILED = "Failed"
const SUCCESS = "Success"

const USER_WINNER = "user"

var config = {
    headers: {'Content-Type' : 'application/json' },
    'Access-Control-Allow-Origin': '*' 
   };



const Leaderboards = (props: any) => {
    const wallet = useWallet()
    const [communityLoading, setCommunityLoading] = useState(false)
    const [userLoading, setUserLoading] = useState(false)
    const [fetchBool, setFetchBool] = useState(false)
    const [userBets, setUserBets] = useState([{}])
    const [comunityBets, setCommuityBets] = useState([{}])


    

    const getCommunity = async () => {

        if (wallet.publicKey?.toBase58() === undefined) { return }
        if (fetchBool) { return }

        let newObj = [{}]
        axios.get(LocalRoute.local + "/getCommunityBets", config)
        .then((res) => {
            if (res.data.status === FAILED) {
                return
            }

            for (let i in res.data) {
                let time = getTime(res.data[i].time)
                newObj.push({
                    wallet: res.data[i].wallet,
                    shortenedAddress: res.data[i].shortenedAddress,
                    amount: res.data[i].amount,
                    winner: res.data[i].winner,
                    time
                })
            }

            newObj.shift()
           
            setCommuityBets(newObj)
            setCommunityLoading(false)
            setFetchBool(true)
        
            return
        })

    } 


    const getUserBets= async () => {
        if (wallet.publicKey?.toBase58() === undefined) { return }
        
        setUserLoading(true)
        let info = { wallet: wallet.publicKey?.toBase58()}
        let newObj = [{}]
        await axios.post(LocalRoute.local + "/getUserRecent", JSON.stringify(info), config)
        .then((res) => {
            if (res.data === FAILED) {
                return
            }
     
            for (let i in res.data) {
                let time = getTime(res.data[i].time)
                if (res.data[i].complete === 'true'){
                    newObj.push({
                        amount: res.data[i].amount,
                        winner: res.data[i].winner,
                        depositSignature: res.data[i].depositSignature,
                        withdrawSignature: res.data[i].withdrawSignature,
                        message: "You mined a block for " + res.data[i].amount + " and got ",
                        time
                    })
                } else {
                    newObj.push({
                        amount: res.data[i].amount,
                        winner: res.data[i].winner,
                        depositSignature: res.data[i].depositSignature,
                        withdrawSignature: res.data[i].withdrawSignature,
                        message: "You have a pending bet.",
                        time
                    })
                }
            }
            newObj.shift()
            setUserBets(newObj)
            setUserLoading(false)
        
            return
        })

    }

   

    const refetchUserBets= async () => {
        if (wallet.publicKey?.toBase58() === undefined) { return }
        if (!props.refreshUser) { return }
        setUserBets([])
        setUserLoading(true)
        let info = { wallet: wallet.publicKey?.toBase58()}
        let newObj = [{}]
        await axios.post(LocalRoute.local + "/getUserRecent", JSON.stringify(info), config)
        .then((res) => {
            if (res.data === FAILED) {
                return
            }

            for (let i in res.data) {
                let time = getTime(res.data[i].time)
                if (res.data[i].complete === 'true'){
                    newObj.push({
                        amount: res.data[i].amount,
                        winner: res.data[i].winner,
                        depositSignature: res.data[i].depositSignature,
                        withdrawSignature: res.data[i].withdrawSignature,
                        message: "You mined a block for " + res.data[i].amount + " and got ",
                        time
                    })
                } else {
                    newObj.push({
                        amount: res.data[i].amount,
                        winner: res.data[i].winner,
                        depositSignature: res.data[i].depositSignature,
                        withdrawSignature: res.data[i].withdrawSignature,
                        message: "You have a pending bet",
                        time
                    })
                }
            }
            newObj.shift()
        
            setUserBets(newObj)
           
            setUserLoading(false)
            return
        })

    } 

      function secondsDiff(d1: any, d2: any) {
        let millisecondDiff = ((d2-d1)/1000).toString()
        return millisecondDiff;
     }


             //Lifecycle
    useEffect(() => {
        if (props.refreshUser) {
            refetchUserBets()
            props.setRefreshUser(false)
        } else {
            getCommunity()
            getUserBets()
        }
    /* 
                
                */
        
       
    }, [props.refreshUser]);

    return(
        <Background>
            <TitleDiv>
            <CommunityTitle>Community Bets</CommunityTitle> 
            <UserTitle>Your Bets</UserTitle> 
            </TitleDiv>

            <LeaderboardDiv>
                {comunityBets.length !== 0 ? (
                    <>
                     <CommunityFrame src={LeaderboardFrame}/>
                        <CommunityDiv>
                       
                                {comunityBets.map((src: any, ind) => {
                                    return (
                        
                            <CommunityItem>
                                <CommunityPhrase>{src.shortenedAddress} mined a block for {src.amount} and got {src.winner === "user" ? (<> {src.amount * 2}.</>):(<>{0}.</>)}</CommunityPhrase>
                                <CommunityTime>{src.time}</CommunityTime>
                            </CommunityItem>
                                )
                            })}              
                        </CommunityDiv> 
                    </>
                ): (
                    <>
                    <CommunityFrame src={LeaderboardFrame}/>
                    <h1>No Data Found</h1>
                    </>
                )}
                
                {userBets.length !== 0 ? (
                    <>
                        <UserDiv>
                        <UserFrame src={LeaderboardFrame}/>
                                {userBets.map((src: any, ind: any) => {
                                    return (
                                 
                                        <UserItem>
                                  
                                            <UserPhrase>{src.message}{src.winner === "user" ? (<>{src.amount * 2+"."}</>):src.winner === "house" ?(<>{0+"."}</>):(<></>)}</UserPhrase>
                             
                                    <ButtonDiv>
                                    <DepositBtn ><ButtonAttribute target="_blank" rel="noreferrer noopener" href={"https://solscan.io/tx/" + src.depositSignature}>Deposit</ButtonAttribute></DepositBtn>
                                    <WithdrawBtn><ButtonAttribute target="_blank" rel="noreferrer noopener" href={"https://solscan.io/tx/" + src.withdrawSignature}>Withdraw</ButtonAttribute></WithdrawBtn>
                                    <BetTime>{src.time}</BetTime>
                                    </ButtonDiv>
                               
                                
                            </UserItem>
                        )
                    })}
                </UserDiv>
                    </>
                ) : (
                    <>
                   
                        <UserDiv>
                        <UserFrame src={LeaderboardFrame}/>
                            <NoData>No data found</NoData>
                        </UserDiv>
                    </>
                )}
            </LeaderboardDiv>
                     
           
        </Background>
    )

};

/* */

const Background = styled.div`
    background: url(${CaveImg});
    width: 100%;
    height: 1080px;
  
    background-size: 100% 100%;
  
    @media (max-width: 1920px) {
        background: url(${CaveImg}) no-repeat center center;
        background-size: cover;
      height: 1080px;
      -webkit-background-size: cover;
      -moz-background-size: cover;
      -o-background-size: cover;
    }

    @media (max-width: 1352px) {
        height: 1080px;
    }
    

    @media (max-width: 1139px) {
        height: 2000px;
    }
    

    @media (max-width: 989px) {
        height: 2000px;
    }
    @media (max-width: 620px) {
        height: 2250px;
    }


`

const TitleDiv = styled.div`
padding-top: 80px;
text-align: center;
    
    display: flex;
    justify-content: center;
    font-family: FreePixel;
   
`

const CommunityTitle = styled.h1`

    color: #fff;
    position:absolute;
    margin-right: 575px;
    @media (max-width: 1139px) {
        margin-right: -25px;
        width: 225px;
    }

`

const UserTitle = styled.h1`

    color: #fff;
    margin-left: 570px;
    @media (max-width: 1139px) {
        padding-top: 825px;
        position: absolute;
        margin-left: 0px;
    }
  
    @media (max-width: 620px) {
        padding-top: 970px;
    }
`

const LeaderboardDiv = styled.div`

    width: 100%;
    display: flex;
    justify-content: center;
   
@media (max-width: 1139px) {
    display:flex;
    flex-flow: row wrap;

}


`


const CommunityFrame = styled.img`

    width: 565px;
    height: 740px; 
    position: absolute;
    margin-left: -285px;
    margin-top: -35px;
    pointer-events: none;
@media (max-width: 1139px) {
    display:flex;
    flex-flow: row wrap;
    width: 565px;
    margin-left: 12px;
    margin-top: 65px;
}


@media (max-width: 620px) {
    height: 1110px; 
    width: 500px;
    display: none;
  
 
}
`

const CommunityDiv = styled.div`
    background: #fff;
    height: 670px;
    width: 500px; 
    font-size: 17px;
    display: inline-block;    
    border-radius: 5px;
    margin-right: 60px;
    margin-bottom: 30px;

    @media (max-width: 1139px) {
        margin-left: 75px;
       
        margin-top: 100px;
    }

 
    @media (max-width: 620px) {
        margin-left: 0px;
        margin-right: 0px;
        width: 90%;
        height: 820px;
        width: 440px;
    }

`

const CommunityItem = styled.div`
    width: 100%;
    height: 65px;
    border: 1px solid black;
    display: flex;
    justify-content: space-between;
    @media (max-width: 620px) {
        height: 80px;
    }

`

const CommunityPhrase = styled.p`
float: left;
font-size: 14px;
font-family: FreePixel;
padding-left: 10px;
padding-top: 10px;
`


const CommunityTime = styled.div`
    float: right;
    font-family: FreePixel;
    font-size: 14px;
    padding-right: 10px;
    padding-top: 25px;
    width: 100px;
    @media (max-width: 462px) {
        padding-top: 25px;
    }
  
`

const UserDiv = styled.div`
    background: #fff;
    height: 670px;
    width: 500px; 
    font-size: 17px;

    display: inline-block;
    border-radius: 5px;
    margin-left: 20px;
    margin-bottom: 30px;
    @media (max-width: 1139px) {
        margin-top: 150px;
    }
    @media (max-width: 620px) {
        margin-left: 0px;
        width: 440px;
       
    }
    

`

const UserFrame = styled.img`
pointer-events: none;

    width: 565px;
    height: 740px; 
    position: absolute;
    margin-left: -30px;
    margin-top: -35px;
    overflow: hidden;

@media (max-width: 620px) {
    height: 740px; 
    width: 500px;
    display: none;
 
}
   
`


const UserItem = styled.div`
    width: 100%;
    height: 65px;
    display: flex;
    justify-content: space-between;
    border: 1px solid black;
  
`


const UserPhrase = styled.p`
float: left;
font-size: 14px;
font-family: FreePixel;
padding-left: 10px;
padding-top: 10px;
`
const ButtonDiv = styled.div`
    display: flex;
    justify-self: center;

    float: right;

`

const ButtonAttribute = styled.a`
color: #000;

`


const BetTime = styled.p`
    float: right;
    width:100px;
    font-family: FreePixel;
    font-size: 14px;
    padding-top: 25px;
    padding-right: 15px;
    pointer-events: none;
 
`

const DepositBtn = styled.p`

    font-family: FreePixel;
    font-size: 15px;
    color: #000;
    padding-right: 5px;

`

const WithdrawBtn = styled.p`

    font-family: FreePixel;
    font-size: 15px;
    color: #000;
    margin-right: -85px;

    @media (max-width: 507px) {
        padding-right: 0px;
    }

`

const NoData = styled.h3`
    padding-left: 185px;
    @media (max-width: 620px) {
        padding-left: 10px;
    }
    
`

export default Leaderboards
