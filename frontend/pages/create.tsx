import { useState } from "react";
import { useAccount, useContract, useSigner } from 'wagmi'
import {contractAddress, abi , erc20Abi} from "../constants/index";
import { ethers } from "ethers";
import { Web3Storage } from "web3.storage";
import { ToastContainer,toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Create() {
    const { data: signer, isError, isLoading } = useSigner();
    const [balance, setBalance] = useState(0);
    const {address} = useAccount();

    const getTokenBalance = async () => {
        try{
            const tokenAddress = (document.getElementById("tokenAddress") as HTMLInputElement).value;
            const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer as ethers.Signer);
            const balance = await tokenContract.balanceOf(address);
            setBalance(Number(ethers.utils.formatEther(balance.toString())));
        }
        catch(err){
            console.log(err);
        }
    }

    const giveAllowance = async () => {
        try{
            const tokenAddress = (document.getElementById("tokenAddress") as HTMLInputElement).value;
            const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer as ethers.Signer);
            const amount = (document.getElementById("tokenAmount") as HTMLInputElement).value;
            const tx = await tokenContract.approve(contractAddress, ethers.utils.parseEther(amount));
            await tx.wait();
            toast.success("Allowance given successfully");
        }
        catch(err: any){
            alert(err);
            throw new Error(err);
        }
    }

    const setMax = () => {
        const amount = (document.getElementById("tokenAmount") as HTMLInputElement);
        amount.value = balance.toString();
    }

    function makeFileObjects (data : any) {
        const obj = data;
        const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' })
        const files = [
          new File([blob], address+'.json')
        ]
        return files
    }  
    //storeContent function uploads the data to IPFS using Web3.storage.
    const storeContent = async (data : any) => {
        const web3storage_key = process.env.NEXT_PUBLIC_WEB3_STORAGE_KEY;
        const client = new Web3Storage({ token: web3storage_key || ""});
        const files = makeFileObjects(data);
        const cid = await client.put([files[0]]);
        console.log(cid);
    }
    const create = async () => {
        try{
            const startTime = document.getElementById("startTime") as HTMLInputElement;
            const startDate = new Date(startTime.value);
            const startTimestamp = Math.floor(startDate.getTime() / 1000);
            const endTime = document.getElementById("endTime") as HTMLInputElement;
            const endDate = new Date(endTime.value);
            const endTimestamp = Math.floor(endDate.getTime() / 1000);
            const tokenAddress = (document.getElementById("tokenAddress") as HTMLInputElement).value;
            const tokenAmount =  ethers.utils.parseEther((document.getElementById("tokenAmount") as HTMLInputElement).value);
            const receiverAddress = (document.getElementById("receiverAddress") as HTMLInputElement).value;
            await giveAllowance();
            let data:any= {};
            data["startTime"] = startTimestamp;
            data["endTime"] = endTimestamp;
            data["tokenAddress"] = tokenAddress;
            data["tokenAmount"] = tokenAmount;
            data["receiverAddress"] = receiverAddress;
            data["senderAddress"] = address;
            storeContent(data);
            const contract = new ethers.Contract(contractAddress, abi, signer || undefined);
            const tx = await contract.createStream(receiverAddress, tokenAddress, tokenAmount, startTimestamp, endTimestamp);
            await tx.wait();
            toast("Stream Created Successfully");
        }
        catch(err){
            alert(err);
        }
    }
    return (
        <div className=" text-white px-60 pt-10">
            <div className="flex items-center flex-col">
                <h1 className="text-3xl font-['Fasthand']">Create  stream</h1>
            </div>
            <div className="flex gap-28">
                <div className="py-3 w-1/2">
                    <h1 className="text-2xl font-['Fasthand']">Receiver address</h1>
                    <input className="w-full mt-2 bg-gray-600 h-8 rounded-md focus:outline-none p-2" type="text" placeholder="Enter address" id="receiverAddress"/>
                </div>
                <div className="py-3 ">
                    <h1 className="text-2xl font-['Fasthand']">Start Time</h1>
                    <input className=" mt-2 bg-gray-600 h-8 rounded-md focus:outline-none p-2" type="datetime-local" id="startTime" />
                </div>
            </div>
            <div className="flex gap-28">
                <div className="py-3 w-1/2">
                    <h1 className="text-2xl font-['Fasthand']">Token address</h1>
                    <input className="w-full mt-2 bg-gray-600 h-8 rounded-md focus:outline-none p-2" type="text" placeholder="Enter address" id="tokenAddress" onChange={getTokenBalance}/>
                </div>
                <div className="py-3 ">
                    <h1 className="text-2xl font-['Fasthand']">End Time</h1>
                    <input className=" mt-2 bg-gray-600 h-8 rounded-md focus:outline-none p-2" type="datetime-local" id="endTime" required/>
                </div>
            </div>
            <div className="flex gap-28 ">
                <div className="py-3 w-1/2">
                    <h1 className="text-2xl font-['Fasthand']">Amount</h1>
                    <input className="w-full mt-2 bg-gray-600 h-8 rounded-md focus:outline-none p-2" type="number" placeholder="Enter amount" id="tokenAmount" />
                </div>
                <div className="flex gap-4 py-14 items-center">
                    <p className="text-2xl font-['Fasthand']">Available : </p><p className="text-xl">{balance.toFixed(2)}</p>
                    <button className="font-['Fasthand'] px-3 py-1 rounded-md bg-red-500" onClick={setMax}>Max</button>
                </div>
                
            </div>
            
            <div className="py-6 flex justify-center">
                <button className="bg-violet-500 text-2xl font-['Fasthand'] w-40 rounded-md p-3" onClick={create}>Create</button>
            </div>
            <ToastContainer />
        </div>
    );
} 