import app from "./app";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

dotenv.config();

const port = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();