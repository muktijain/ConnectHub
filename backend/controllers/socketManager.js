import { Server } from "socket.io";

const connectToSocket = (server) => {
    const io = new Server(server , {
        cors : {
            origin: "*", // Allow requests from any origin (for development purposes)
            methods: ["GET", "POST"] ,
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
           // Fired when a client wants to join a video call room identified by `path`.
        socket.on("join_call", (path) => {
            if(connections[path] === undefined){ 
                connections[path] = [];
            }
            connections[path].push(socket.id);    //Register this client in the room
            timeOnline [socket.id] = new Date();  //Record join time for later diffing


             // Notify every client in the room that a new user has joined,
            // passing the new client's socket ID and the updated connections list.
            for(let a = 0; a < connections[path].length; a++){ 
                io.to(connnections[path][a]).emit("user-joined", socket.id, connections[path]);
            }

            // If this room already has chat history, replay it for the newly joined client.
            if(messages[path] !== undefined){          
                for (let a=0; a < messages[path].length; ++a){
                    io.to(socket.id).emit("chat-message", messages[path][a]["data"],
                    messages[path][a]["sender"], messages[path][a]["socket-id-sender"]
                    );
                }
        }
        });


        // Forwards a WebRTC signaling message (offer/answer/ICE candidate)
        // from the sender to a specific recipient identified by `toId`.
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        // Receives a chat message from a client, stores it, and broadcasts it
        // to all other clients in the same room.
        socket.on("chat-message", (sender, data) => {
             
            const [matchingRoom, found] = Object.entries(connections)   //check which room sender is in and send the message to all clients in that room
            .reduce(([room, isFound], [roomKey, roomValue]) => {
                if(!isFound && roomValue.includes(socket.id)){         //check if the sender is in the current room
                    return [roomKey, true];                           /// Found the room — stop searching
                }

                return [room, isFound];                                  //if the sender is not in the current room, return the previous room and isFound value
             }, ["", false]);

             if(found === true){
                if(messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }


                // Persist the message so late-joining clients can receive history
                messages[matchingRoom].push({'data': data, 'sender': sender, 'socket-id-sender': socket.id}); //store the message in the messages object with the room key and the message data, sender, and socket ID of the sender
                console.log('message stored in room ' + sender + ': ' + data);

                connections[matchingRoom].forEach(ele => {
                    io.to(ele).emit("chat-message", data, sender, socket.id) //send the message to all clients in the same room
                })
                }
        });

        // Fired automatically when a client's connection drops.
        // Removes the client from its room and notifies remaining peers.
        socket.on("disconnect", () => {

            // Calculate how long this client was connected (in milliseconds)
            var diffTime = Math.abs(timeOnline[socket.id] - new Date()); //calculate the time difference between the time the client joined the room and the time the client disconnected
            
            var key 

            //Deep-clone entries to avoid mutating the object while iterating it
            for( const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))){ //find the room key that the disconnected client is in
                
                for(let a = 0; a < v.length; a++){
                    if(v[a] === socket.id){
                        key = k; // This is the room the disconnected client was in
                        
                         // Tell every remaining client in the room that this user left
                        for( let a = 0; a < connections[key].length; ++a){
                            io.to(connections[key][a]).emit("user-left", socket.id); //send a "user-left" event to all clients in the same room, along with the socket ID of the disconnected client and the time difference calculated earlier
                        }

                        // Remove the disconnected client from the room's array
                        var index = connections[key].indexOf(socket.id); //find the index of the disconnected client in the room's connections array

                        connections[key].splice(index, 1);

                        // If the room is now empty, clean up both storage objects
                        if(connections[key].length === 0){ 
                            delete connections[key];
                            delete messages[key];
                        }
                    }
            }
        }
    }); //close io.on("connection")

    return io;
})
};


export default connectToSocket