import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import SmLogo from '../img/SmLogo4.png'
import '../utils/font.css'
import styled from 'styled-components';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { Connection } from '@solana/web3.js';
import { RPC } from '../utils/rpc';
import axios from 'axios';
import { LocalRoute } from '../constants';
import CheckMarkGreen from '../img/CheckMarkGreen.png'

var config = {
    headers: {
      'Content-Type' : 'application/json'
    },
};

const FAILED = "Failed"

const Navigation = (props) => {

    const wallet = useWallet()
    const connection = new Connection(RPC.rpcUrl, 'processed')
    const [solBalance, setSolBalance] = useState(0)
    const [betAmount, setBetAmount] = useState(5)
    const shortenAddress = (address, chars = 4) => {
        return `${address.slice(0, chars)}...${address.slice(-chars)}`;
      };
      const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));
      const getUserBalance = async () => {
        if (wallet.publicKey === null) { return }
        await wait(5000)
        let result = await connection.getBalance(new PublicKey(wallet.publicKey), 'processed')
        let balance = result / LAMPORTS_PER_SOL
        setSolBalance(balance)
        return
    }

    const getBetAmount = async () => {
        if (wallet.publicKey === null) { return }
        let body = {
            wallet: wallet.publicKey
        }
        axios.post(LocalRoute.local + "/getWallet", JSON.stringify(body), config)
        .then((res) => {
            if (res.data.totalBets === "") {
                setBetAmount(5)
            } else {
                setBetAmount(5 - res.data.totalBets)
            }
            console.log(betAmount)
        })
    }

         //Lifecycle
         useEffect(() => {
      
            if (props.refreshUser) {
                getUserBalance()
                getBetAmount()
            } else {
                getUserBalance()
                getBetAmount()
            }
        }, [props.refreshUser]);

    return (

       <NavBar>
            <LogoDiv>
                <SMAttribute href={"https://solanaminers.com/#/"} ><Logo src={SmLogo}></Logo></SMAttribute>
                <PortalButton><PortalAttribute href='https://solanaminers.com/#/myb'>MYB</PortalAttribute></PortalButton>
              
            </LogoDiv>
            <WalletDiv>
            <Address>SOL Balance: {solBalance}</Address>
            <Address>Solana Network: {props.solanaTPS || "0"} TPS</Address>
            <Address>{shortenAddress(wallet.publicKey?.toBase58() || "")}</Address>
            {props.verifiedHolder ? (<><Address>Verified Holder</Address></>):(<></>)}
            <Givaway>Giveaway: {betAmount <= 0 ? (<><CheckIcon src={CheckMarkGreen} alt="entered"/></>) : betAmount === 1 ? (<>{betAmount} Bet Left.</>) : betAmount > 1 ? (<>{betAmount} Bets Left.</>) : (<>...</>)}</Givaway>
           
                {wallet.connected ? (
                    <>
                    <ConnectDiv>
                        <WalletDisconnectButton style={{ marginTop: '40px' }} onClick={() => { wallet.disconnect() }}></WalletDisconnectButton>
                    </ConnectDiv>
                    </>
                ) : (
                    <>
                      <ConnectDiv>
                    <WalletMultiButton style={{ paddingTop: '40px' }}/>
                    </ConnectDiv>
                    </>
                )}
                
                </WalletDiv>  
           
        </NavBar>
    )

} 

const LogoDiv = styled.div`
    display: flex;
    flex-direction: row;
    
    @media (max-width: 1004px) {
        margin-right: 25px;
    }
`

    const PortalButton = styled.div`
        margin-left: 10px;
        margin-top: 20px;
        display: flex;
        justify-content: center;
        background: #B2BEB5;
        width: 75px;
        height: 30px;
        border-radius: 10px;
        font-family: FreePixel;
        font-size: 17px;
        padding-top: 15px;
    `
    const SMAttribute = styled.a`
        text-decoration: none;
        color: #000;
    `
    const PortalAttribute = styled.a`
        text-decoration: none;
        color: #000;
    `

    const ConnectDiv = styled.div`
        margin-left: 20px;
    `

    const WalletDiv = styled.div`
        display: flex;
        flex-direction: row;
        margin-top:20px;
        margin-left: 70px;

        @media (max-width: 1004px) {
            display: flex;
            flex-direction: column;
            margin-top:80px;
            margin-left: -270px;
        
        }
    
        @media (max-width: 721px) {
            margin-top: 75px;
        }

        
    `

    const Logo = styled.img`

    width: 100px;
    height: 50px;
    padding-top: 20px;
    padding-left: 50px;

    @media (max-width: 1004px) {
        padding-right: 20px;
    }

    @media (max-width: 390px) {
        padding-right: 0px;
        margin-left: 30px;
    }
  
    `
    const NavBar = styled.div`
        display: flex;
        font-family: FreePixel;
        justify-content: space-between;
        margin-bottom: -5px;
        background: transparent;

        @media (max-width: 1004px) {
            justify-content: center;
        }
      
    `

const Address = styled.p`;
    color: #fff;
    fontSize: 20px;
    padding-right: 20px;
`

const Givaway = styled.div`
    display: flex;
    flex-direction: row;
    color: #fff;
    fontSize: 20px;
    padding-right: 20px;
    padding-top: 16px;
    padding-bottom: 10px;

    @media (max-width: 1004px) {
        justify-content: center;
        padding-right: 0px;
    }
`

const CheckIcon = styled.img`
    margin-top: -4px;
    padding-left: 5px;
    height: 25px;
    width: 25px;
`
export default Navigation
