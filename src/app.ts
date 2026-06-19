import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import logger from "./utils/logger";

const app = express();

const swaggerDocument = YAML.load(path.join(process.cwd(), "src", "swagger.yaml"));

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path, ip: req.ip }, "Incoming Request");
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Welcome to QueueFlow Backend" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;