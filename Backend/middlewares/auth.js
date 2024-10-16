const { getUser } = require("../service/auth");

async function checkAuth(req, res, next) {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token) {
            return res.status(400).json({msg: "You are not logged In."});
        }
        const user = getUser(token);
        if(!user) {
            return res.status(400).json({msg: "Unauthorized access"});
        }
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    checkAuth,
}