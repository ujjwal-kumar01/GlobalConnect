import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import dbconnect from "./db/index.js";

// 🔥 IMPORT 'server' FROM YOUR SOCKET FILE
import { server } from "./socket/socket.js"; 

// 🔥 We just import app.js so that the middlewares and routes get applied
import "./app.js"; 

const PORT = process.env.PORT || 8000;

dbconnect()
    .then(() => {
        // 🔥 Call server.listen() instead of app.listen()
        server.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Error connecting to DB:", error.message);
    });