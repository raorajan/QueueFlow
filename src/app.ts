import express from "express";
import cors from "cors";
import helmet from "helmet";
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());


app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Welcome to QueueFlow Backend" });
});

export default app;