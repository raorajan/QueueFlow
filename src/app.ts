import express from "express";
import cors from "cors";
import helmet from "helmet";


const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Apply rate limiting specifically to the LLM interaction routes


app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Welcome to Spur Support AI Backend" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


export default app;