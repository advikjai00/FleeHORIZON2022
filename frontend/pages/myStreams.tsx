import { FETCH_STREAMS_BY_RECEIVER,FETCH_STREAMS_BY_SENDER,subgraphQuery } from "../components";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {contractAddress, abi , erc20Abi} from "../constants/index";
import { ToastContainer,toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
interface Stream {
    id: string;
    sender: string;
    receiver: string;
    amount: string;
    token: string;
    startTime: string;
    stopTime: string;
    cancelled: boolean;
    claimed: boolean;
}


import { useAccount,useSigner } from "wagmi"; 


export default function MyStreams() {
    const [data, setData] = useState< Stream[]>([]);
    const [receiver, setReceiver] = useState<boolean>(false);
    const { address, isConnecting, isDisconnected } = useAccount()
    const { data: signer, isError, isLoading } = useSigner();


    const cancelStream = async (id: string) => {
        try{
            const contract = new ethers.Contract(contractAddress, abi, signer as ethers.Signer);
            const tx = await contract.cancelStream(id);
            await tx.wait();
            toast.success("Stream cancelled successfully");
        }
        catch(err: any){
            alert(err);
        }
    }

    const withdrawStream = async (id: string) => {
        try{
            const contract = new ethers.Contract(contractAddress, abi, signer as ethers.Signer);
            const tx = await contract.withdrawFromStream(id);
            await tx.wait();
            toast.success("Withdrawn successfully");
        }
        catch(err: any){
            alert(err);
        }
    }



    const getStreams = async () => {
        const data = await subgraphQuery(FETCH_STREAMS_BY_SENDER(address || ""));
        setData(data.streams);
    }

    const getReceiveStreams = async () => {
        const data = await subgraphQuery(FETCH_STREAMS_BY_RECEIVER(address || ""));
        setData(data.streams);
    }

    useEffect(() => {
        if(receiver){
            getReceiveStreams();
        }
        else{
            getStreams();
        }
    }, [receiver]);

    console.log(new Date())
    return (
        <div className="text-white px-20 font-['Fasthand'] overflow-hidden mt-4">
            <div className="flex gap-28 items-center text-2xl justify-center ">
                <button className="px-8 py-2 rounded-3xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" onClick={()=>{setReceiver(false)}}>Your Streams</button>
                <button className="px-8 py-2  rounded-3xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" onClick={()=>{setReceiver(true)}}>Receiving Streams</button>
            </div>
            <div className="border-0 border-white mt-4 h-[32rem] p-4 bg-gray-900">
                <div className="flex text-xl px-10">
                    <p className="w-96">{receiver ? "Sender" : "Receiver"}</p>
                    <p className="w-20 ml-10">Amount</p>
                    <p className="w-28 ml-20">startTime</p>
                    <p className="w-28 ml-28">endTime</p>
                    <p className="ml-20">status</p>
                    <p></p>
                </div>
                {
                    data && data?.map((stream) => {
                        const startTime = new Date(parseInt(stream.startTime) * 1000).toLocaleString();
                        const stopTime = new Date(parseInt(stream.stopTime) * 1000).toLocaleString();
                        const status= stopTime > new Date().toLocaleString() ? "Active" : "Completed";
                        return (
                            <div className="flex text-xl px-10 py-3 items-center" key={stream.id}>
                                <p className="w-96">{!receiver ? stream.receiver : stream.sender}</p>
                                <p className="w-10 ml-12">{ethers.utils.formatEther(stream.amount)}</p>
                                <p className="w-52 ml-20">{startTime}</p>
                                <p className="w-52 ml-2">{stopTime}</p>
                                <p className="ml-2 w-20">{stream.cancelled ? "Canceled" : status }</p>
                                {
                                    stream.cancelled === null && !receiver && status === "Active" ? <button className="ml-16 p-2 rounded-xl bg-red-600" onClick={()=>cancelStream(stream.id)}>Cancel</button> : ""
                                }
                                {
                                    receiver && !stream.cancelled && status === "Completed" ? stream.claimed ? <p className="ml-16 p-2 rounded-xl bg-blue-500 px-4">Claimed</p>:<button className="ml-16 p-2 rounded-xl bg-green-600" onClick={()=>withdrawStream(stream.id)}>Claim</button> : ""
                                }
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}
            