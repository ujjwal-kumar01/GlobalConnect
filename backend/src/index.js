import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import dbconnect from "./db/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 8000;

dbconnect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Error connecting to DB:", error.message);
    });