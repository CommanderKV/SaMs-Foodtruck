import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import { engine } from "express-handlebars";


// Load environment variables
dotenv.config();

const app = express();

// Use Helmet to secure HTTP headers
app.use(helmet());

// Parse JSON requests
app.use(express.json());

// Configure Handlebars as the view engine
app.engine("hbs", engine({ 
    extname: ".hbs",
    defaultLayout: "base",
    layoutsDir: "./views/"
}));
app.set("view engine", "hbs");
app.set("views", "./views/");

// Controller routes
import homeController from "./controllers/homeController.js";
import menuController from "./controllers/menuController.js";
import cartController from "./controllers/cartController.js";
app.use("/", homeController);
app.use("/menu", menuController);
app.use("/", cartController);

// Error handling middleware
app.use((err, req, res, next) => {
	if (app.get("env") === "dev") {
		return res.status(500).send({ error: err.message });
	}
	res.status(500).send({ error: "Internal Server Error" });
});

// Configurable port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
