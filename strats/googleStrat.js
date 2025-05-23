import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import db from "../models/index.js";

// Serialize user information into the session
passport.serializeUser((user, done) => {
    // Store the user ID in the session
    done(null, {
        id: user.id, 
        displayName: user.displayName, 
        email: user.email,
        role: user.role,
    });
});

// Deserialize user information from the session
passport.deserializeUser(async (userDetails, done) => {
    try {
        done(null, userDetails);
    } catch (error) {
        // Handle any errors during deserialization
        done(error, null);
    }
});

// Configure the Google OAuth 2.0 strategy for Passport
passport.use(new GoogleStrategy({
    // Client ID and secret for Google OAuth, stored in environment variables
    clientID: process.env.GOOGLE_SIGNIN_KEY,
    clientSecret: process.env.GOOGLE_SIGNIN_SECRET,
    // URL to handle the callback after Google authentication
    callbackURL: "/api/v1/user/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Find or create a user in the database based on the Google profile information
        const [user] = await db.users.findOrCreate({
            where: {
                // Match the user by their Google service ID and service type
                serviceId: profile.id,
                service: "google",
            },
            defaults: {
                // Set default values for a new user
                displayName: profile.displayName,
                email: profile.emails[0].value,
                service: "google",
            },
        });

        // Pass the user object to the next middleware
        done(null, user);
    } catch (error) {
        // Log and handle any errors during authentication
        console.error("Error during Google authentication:", error);
        done(error, null);
    }
}));
