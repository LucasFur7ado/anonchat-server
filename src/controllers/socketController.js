import fs from "fs"
import { JSDOM } from "jsdom"
import dompurify from "dompurify"
import { Server } from "socket.io"

const window = new JSDOM("").window
const purify = dompurify(window)

export const socketController = (http) => {
    const io = new Server(http, {
        cors: {
            origin: "https://anonchat.lucasfurtado.xyz",
            methods: ["GET", "POST"]
        }
    })

    let connectedUsers = []

    io.on("connection", (socket) => {

        if (connectedUsers.length > 20) {
            socket.disconnect()
            return null
        }

        const sanitizedUsername = purify.sanitize(socket.handshake.query.username)

        connectedUsers.push({
            username: sanitizedUsername,
            id: socket.id
        })

        console.log("User connected => " + socket.id)

        io.emit("user-entered", {
            username: sanitizedUsername
        })

        let rawMessages = fs.readFileSync("src/data/messages.json")
        let messages = JSON.parse(rawMessages.toString())

        socket.emit("get-messages", messages)

        socket.on("client-new-message", msg => {
            const sanitizedMessage = purify.sanitize(msg.message)
            const sanitizedMessageUsername = purify.sanitize(msg.username)

            const newMessage = {
                username: sanitizedMessageUsername,
                message: sanitizedMessage,
                socketId: socket.id,
                time: new Date()
            }

            if (messages.length > 19)
                messages.shift()

            messages.push(newMessage)

            fs.writeFileSync("src/data/messages.json", JSON.stringify(messages, null, 2))
            io.emit("new-message", newMessage)
        })

        socket.on("disconnect", () => {
            connectedUsers = connectedUsers.filter(c => c.id == socket.id)
        })
    })
}

// -- LISTENERS --

// client-new-message => new move from client

// -- EMISSIONS --

// user-entered => user joined the room notification
// new-message => new message from client to everyone
// get-messages => sends messages to a new connected user