// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract flee {

    uint256 public fleeId;

    struct Flee{
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

    mapping(uint256 => Flee) public flees;

    event FleeCreated(address indexed sender, address indexed receiver,address token,uint256 indexed id, uint256 amount, uint256 startTime, uint256 stopTime, uint256 rate);
    event FleeClaimed(address indexed sender, address indexed receiver,address token,uint256 indexed id, uint256 amount, uint256 startTime, uint256 stopTime, uint256 rate, bool claimed);
    event FleeCancelled(address indexed sender, address indexed receiver,address token,uint256 indexed id, uint256 amount, uint256 startTime, uint256 stopTime, uint256 rate, bool cancelled);

    function  createFlee(address receiver,address token,uint256 amount, uint256 startTime, uint256 stopTime) public {
        require(startTime < stopTime, "Flee: start time is not before stop time");
        require(amount > 0, "Flee: amount is 0");
        require(msg.sender != receiver, "Flee: sender and receiver are the same address");
        unchecked{
            fleeId++;
        }        
        flees[fleeId] = Flee(msg.sender, receiver,token, fleeId, amount, startTime, stopTime, amount/(stopTime-startTime), false,false);
        emit FleeCreated(msg.sender, receiver,token, fleeId, amount, startTime, stopTime, amount/(stopTime-startTime));
    }

    function withdrawFromFlee(uint256 id) public {
        require(!flees[id].cancelled, "flee does not exist");
        require(!flees[id].claimed, "Already claimed");
        require(flees[id].receiver == msg.sender, "you are not the receiver of this flee");
        require(block.timestamp >= flees[id].stopTime, "flee hasn't stopped");

        uint256 amount = (block.timestamp - flees[id].startTime) * flees[id].rate;

        if(amount > flees[id].amount){
            amount = flees[id].amount;
        }

        IERC20(flees[id].token).transferFrom(flees[id].sender,flees[id].receiver, amount);

        flees[id].claimed = true;
        emit FleeClaimed(flees[id].sender, flees[id].receiver,flees[id].token, flees[id].id, flees[id].amount, flees[id].startTime, flees[id].stopTime, flees[id].rate, flees[id].claimed);
    }

    function cancelFlee(uint256 id) public {
        require(!flees[id].cancelled, "flee does not exist");
        require(flees[id].sender == msg.sender, " you are not the sender of this flee");
        require(block.timestamp < flees[id].stopTime, "flee has stoped");
        if(block.timestamp >= flees[id].startTime){
            flees[id].cancelled = true;
            uint256 sentAmount = (block.timestamp - flees[id].startTime) * flees[id].rate;
            IERC20(flees[id].token).transferFrom(flees[id].sender,flees[id].receiver, sentAmount);
        }
        flees[id].claimed = true;
        emit FleeCancelled(flees[id].sender, flees[id].receiver,flees[id].token, flees[id].id, flees[id].amount, flees[id].startTime, flees[id].stopTime, flees[id].rate,true);
    }
}
