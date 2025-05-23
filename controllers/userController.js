// Import necessary modules from express and passport
import { Router } from "express";
import passport from "passport";
import authTools from "../tools/authentication.js";

// Create the router instance to define routes
const router = Router();

////////////////////
//    Requests    //
////////////////////

// Route to get the current user information
// GET: /
router.get("/", (req, res) => {
    // Check if user is authenticated
    if (req.isAuthenticated()) {
        // Send the user information as a response
        res.status(200).json({
            status: "success",
            data: req.user
        }); 
    } else {
        // Send an empty object if not authenticated
        res.status(401).json({ status: "failure", message: "Unauthorized" }); 
    }
});


// Route to initiate Google authentication
// GET: /google
router.get("/google", passport.authenticate("google", {
    // Request access to user's profile and email
    scope: ["profile", "email"]
}));

// Route to handle the callback after Google authentication
// GET: /google/callback
router.get("/google/callback", 
    passport.authenticate("google", {
        failureRedirect: "/api/v1/user/fail",    // Redirect to login page on failure
        successRedirect: "/api/v1/user/success"  // Redirect to dashboard on success
    })
);

// Route to log out the user and redirect to the homepage
// GET: /logout
router.get("/logout", (req, res) => {
    // Clear the token cookie
    authTools.clearTokenCookie(res);

    // Log out the user
    req.logout((err) => {
        if (err) {
            // Log error
            console.log(err); 
        }
        // Redirect to the homepage
        res.redirect(`${process.env.CLIENT_URL}/`); 
    });
});


export default router;