import cors from "cors"
import helmet from "helmet"
import express from "express"
import { createServer } from "node:http"
import rateLimit from "express-rate-limit"
import { socketController } from "./src/controllers/socketController.js"

const app = express()
const server = createServer(app)

app.use(cors({
  origin: [
    "https://anonchat.lucasfurtado.xyz"
  ]
}))

app.use(helmet())

app.use(rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: "Requests limit reached. Try again later"
}))

socketController(server)

const port = 5000

server.listen(port, () => {
  console.log("Server running on port " + port)
})