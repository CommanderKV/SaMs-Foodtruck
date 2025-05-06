import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import helmet from "helmet";
import db from "./models/index.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import routes from "./routes.js";
import cors from "cors";
import {Strategy as jwtStrategy, ExtractJwt } from "passport-jwt";

// Import the user stuff
import passport from "passport";
import "./strats/googleStrat.js";
import userController from "./controllers/userController.js";
import authTools from "./tools/authentication.js";

// Load environment variables
dotenv.config();

const app = express();

// Use Helmet to secure HTTP headers
app.use(helmet());

// Parse JSON requests
app.use(express.json());

// Cors: Allow angular client http access
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: "GET,POST,PUT,DELETE,HEAD,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type,Authorization",
}));

// Use express-session middleware
app.use(session({
    secret: "sample-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: false,  // change in prod
        secure: false,    // Change in prod
        maxAge: undefined, // Change in prod
    }
}));


// Setup users
app.use(passport.initialize());
app.use(passport.session());
// Where to redirect on success or failure of login
app.get("/api/v1/user/fail", (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login`);
});
app.get("/api/v1/user/success", (req, res) => {
    // Generate a jwt
    const token = authTools.generateToken(req.user);

    // Set the token in the cookies
    authTools.setTokenCookie(res, token);

    // Redirect to the client dashboard based off the role
    if (req.user.role == "user") {
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } else if (req.user.role == "admin") {
        res.redirect(`${process.env.CLIENT_URL}/admin`);
    }
});

// Other methods for user login
app.use("/api/v1/user", userController);

// Setup JWT authentication
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
}
let strat = new jwtStrategy(jwtOptions, async (jwtPayload, callback) => {
    try {
        // Try to find the user
        const user = await db.users.findByPk(jwtPayload.id);
        
        // If the user found
        if (user) {
            // Send no error and the user object
            return callback()

        // If the user not found
        } else {
            // Send error
            return callback(null, false);
        }
    } catch (error) {
        return callback(null, false);
    }
})

passport.use(strat);


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
