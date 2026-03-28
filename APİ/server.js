import express from "express";
import cors from "cors";
import verifyRouter from "./routes/verify.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/verify", verifyRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("API server running on port " + PORT));
