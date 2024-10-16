const jwt = require('jsonwebtoken');
const secret = "abc@123";

function generateAccessToken(user) {
    const payload = {
        curUser : {
            _id: user._id,
            email: user.email,
            name: user.name,
            mobile: user.mobile,
        }
    }
    const expiry = {
        expiresIn: "1d",
    }
    return jwt.sign(payload, secret, expiry);
}

function generateRefreshToken(user) {
    const payload = {
        _id: user._id,
    }
    const expiry = {
        expiresIn: "10d",
    }
    return jwt.sign(payload, secret, expiry);
}

function getUser(token) {
    if(!token) return null;
    try {
        return jwt.verify(token, secret);
    }
    catch {
        return null;
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    getUser,
}