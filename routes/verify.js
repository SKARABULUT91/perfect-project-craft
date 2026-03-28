import express from "express";
import { verifyTwitterCredentials } from "../services/twitterService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { apiKey, apiSecret, accessToken, accessSecret } = req.body;

  const result = await verifyTwitterCredentials(
    apiKey,
    apiSecret,
    accessToken,
    accessSecret
  );

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

export default router;
