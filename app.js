import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import helmet from "helmet";
import db from "./models/index.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import routes from "./routes.js";

// Load environment variables
dotenv.config();

const app = express();

// Use Helmet to secure HTTP headers
app.use(helmet());

// Parse JSON requests
app.use(express.json());

// Use express-session middleware
app.use(session({
    secret: "sample-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: false,  // change in prod
        secure: false,    // Change in prod
        maxAge: undefined // Change in prod
    }
}));

// API routes
app.use("/api", routes);

// Swagger configuration
const docOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SaM's Foodtruck API",
            version: "1.0.0",
            description: "An API for SaM's Foodtruck",
        }
    },
    apis: ["./controllers/*.yaml"]
}
const openapiSpecification = swaggerJSDoc(docOptions);

// // Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Error handling middleware
app.use((err, req, res, next) => {
	if (app.get("env") === "dev") {
		return res.status(500).send({ error: err.message });
	}
	res.status(500).send({ error: "Internal Server Error" });
});

// Configurable port
const PORT = process.env.PORT || 3000;

// Make sure the database is connected and 
// updated before starting the server
const startServer = async () => {
    try {
        await db.sequelize.sync({ alter: true });
        console.log("Database synchronized");

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        return server;
    } catch (err) {
        console.error("Error synchronizing the database:", err);
    }
};

// Export app for testing
export { app, startServer };
