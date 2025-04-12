import jwt from "jsonwebtoken";

function generateToken(user) {
    // Setup JWT payload with user info
    const payload = {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
    };

    // Create the token options
    const jwtOptions = {
        expiresIn: "1hr"
    };

    // Return the new token
    return jwt.sign(payload, process.env.JWT_SECRET, jwtOptions);
}

// Set a token in the cookies
function setTokenCookie(res, token) {
    res.cookie("authToken", token, {
        httpOnly: true, 
        secure: true,
        sameSite: "None"
    });
}

// Clear the token that is in the cookies
function clearTokenCookie(res) {
    res.clearCookie("authToken", {
        httpOnly: true,
        secure: true,
    });
}

export default {
    generateToken,
    setTokenCookie,
    clearTokenCookie
}