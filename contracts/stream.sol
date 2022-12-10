// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract stream {

    uint256 public streamId;

    struct Stream{
        address sender;
        address receiver;
        address token;
        uint256 id;
        uint256 amount;
        uint256 startTime;
        uint256 stopTime;
        uint256 rate;
        bool cancelled;
        bool claimed;
    }

    mapping(uint256 => Stream) public streams;

    event StreamCreated(address indexed sender, address indexed receiver,address token,uint256 indexed id, uint256 amount, uint256 startTime, uint256 stopTime, uint256 rate);
    event StreamClaimed(address indexed sender, address indexed receiver,address token,uint256 indexed id, uint256 amount, uint256 startTime, uint256 stopTime, uint256 rate, bool claimed);
    event StreamCancelled(address indexed sender, address indexed receiver,address token,uint256 indexed id, uint256 amount, uint256 startTime, uint256 stopTime, uint256 rate, bool cancelled);

    function  createStream(address receiver,address token,uint256 amount, uint256 startTime, uint256 stopTime) public {
        require(startTime < stopTime, "Stream: start time is not before stop time");
        require(amount > 0, "Stream: amount is 0");
        require(msg.sender != receiver, "Stream: sender and receiver are the same address");
        unchecked{
            streamId++;
        }        
        streams[streamId] = Stream(msg.sender, receiver,token, streamId, amount, startTime, stopTime, amount/(stopTime-startTime), false,false);
        emit StreamCreated(msg.sender, receiver,token, streamId, amount, startTime, stopTime, amount/(stopTime-startTime));
    }

    function withdrawFromStream(uint256 id) public {
        require(!streams[id].cancelled, "stream does not exist");
        require(!streams[id].claimed, "Already claimed");
        require(streams[id].receiver == msg.sender, "you are not the receiver of this stream");
        require(block.timestamp >= streams[id].stopTime, "stream hasn't stopped");

        uint256 amount = (block.timestamp - streams[id].startTime) * streams[id].rate;

        if(amount > streams[id].amount){
            amount = streams[id].amount;
        }

        IERC20(streams[id].token).transferFrom(streams[id].sender,streams[id].receiver, amount);

        streams[id].claimed = true;
        emit StreamClaimed(streams[id].sender, streams[id].receiver,streams[id].token, streams[id].id, streams[id].amount, streams[id].startTime, streams[id].stopTime, streams[id].rate, streams[id].claimed);
    }

    function cancelStream(uint256 id) public {
        require(!streams[id].cancelled, "stream does not exist");
        require(streams[id].sender == msg.sender, " you are not the sender of this stream");
        require(block.timestamp < streams[id].stopTime, "stream has stoped");
        if(block.timestamp >= streams[id].startTime){
            streams[id].cancelled = true;
            uint256 sentAmount = (block.timestamp - streams[id].startTime) * streams[id].rate;
            IERC20(streams[id].token).transferFrom(streams[id].sender,streams[id].receiver, sentAmount);
        }
        streams[id].claimed = true;
        emit StreamCancelled(streams[id].sender, streams[id].receiver,streams[id].token, streams[id].id, streams[id].amount, streams[id].startTime, streams[id].stopTime, streams[id].rate,true);
    }
}