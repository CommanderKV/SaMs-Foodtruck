import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import helmet from "helmet";
import db from "./models/index.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import routes from "./routes.js";

// Import the user stuff
import passport from "passport";
import "./strats/googleStrat.js";
import userController from "./controllers/userController.js";

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


// Setup users
app.use(passport.initialize());
app.use(passport.session());

app.use("/user", userController);

// FOR DEV ONLY
if (process.env.ENV === "dev") {
    app.get("/login", (req, res) => {
        res.send(req.session);
    });
    app.get("/dashboard", (req, res) => {
        res.send(req.session);
    });
}

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
	if (process.env.ENV === "dev") {
		return res.status(500).send({ error: err.message, errStack: err.stack });
	}
	res.status(500).send({ error: "Internal Server Error"});
});

// Configurable port
const PORT = process.env.PORT || 3000;

// Make sure the database is connected and 
// updated before starting the server
const startServer = async () => {
    try {
        if (process.env.ENV === "dev") {
            // Used because it will try to update
            // a table with a column that has a 
            // unique tag
            try {
                await db.sequelize.sync({ alter: true });
                console.log("Database connected successfully");
            } catch (err) {
                console.error("Error synchronizing the database:", err.message);
            }
        } else {
            await db.sequelize.authenticate();
            console.log("Database connected successfully");
        }

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
