// Import necessary modules from express and passport
import { Router } from "express";
import passport from "passport";

// Create the router instance to define routes
const router = Router();

////////////////////
//    Requests    //
////////////////////

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
        failureRedirect: "/login",    // Redirect to login page on failure
        successRedirect: "/dashboard" // Redirect to dashboard on success
    })
);

// Route to log out the user and redirect to the homepage
// GET: /logout
router.get("/logout", (req, res) => {
    // Log out the user
    req.logout((err) => {
        if (err) {
            // Log error
            console.log(err); 
        }
        // Redirect to the homepage
        res.redirect("/"); 
    });
});


export default router;