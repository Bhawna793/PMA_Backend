const express = require("express");
const router = express.Router();
const {
  handleUserLogin,
  handleUserLogout,
  handleUserSignUp,
  refreshAccessToken,
  handleForgotPassword,
  handleResetPassword,
  handleChangePassword,
  handleVerifyUser,
  verify_user,
} = require("../controllers/user");
const { checkAuth } = require("../middlewares/auth");

router.post("/signup", handleUserSignUp);

router.post("/login", handleUserLogin);

router.post("/logout", checkAuth, handleUserLogout);

router.post("/refresh-token", refreshAccessToken);

router.post("/forgotPassword", handleForgotPassword);

router.post("/resetPassword", handleResetPassword);

router.post("/changePassword", checkAuth, handleChangePassword);

router.post("/verify-email", verify_user);

router.post("/verification", handleVerifyUser);

module.exports = router;
