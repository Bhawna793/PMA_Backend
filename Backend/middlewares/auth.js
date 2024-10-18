const { getUser } = require("../service/auth");

async function checkAuth(req, res, next) {
    try {
        const token = req.cookies?.accessToken
        if(!token) {
            return res.status(400).json({msg: "You are not logged In."});
        }
        const data = getUser(token);
        if(!data) {
            return res.status(400).json({msg: "Unauthorized access"});
        }
        req.user = data.curUser;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    checkAuth,
}