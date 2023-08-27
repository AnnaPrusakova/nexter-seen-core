import express from "express";

require("dotenv").config();
require("./database/database.ts").connect();
const router = require("./routes");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.get("/", (req, res) => {
    res.send({ message: "Hello, nodemon!" });
});

app.use("/api", router);

app.listen(port, () => {
    console.log(`app is listening at http://localhost:${port}`);
});
