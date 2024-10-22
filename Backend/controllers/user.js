const user = require("../models/user");
const bcrypt = require("bcryptjs");
const {
  generateAccessToken,
  generateRefreshToken,
  getUser,
} = require("../service/auth");

const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

async function handleUserSignUp(req, res) {
  try {
    const { name, email, mobile, password } = req.body;
    if (!email || !name || !mobile || !password) {
      return res.status(403).json({ msg: "Please fill your credentials" });
    }

    const passwordValidationRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const nameValidationRegex = /^[a-zA-Zs]+$/;
    const mobileValidationRegex = /[6-9][0-9]{9}$/;

    if (!passwordValidationRegex.test(password)) {
      return res.status(400).json({
        msg: "Invalid Password",
      });
    }

    if (!nameValidationRegex.test(name)) {
      return res.status(400).json({
        msg: "Invalid Name",
      });
    }

    if (!mobileValidationRegex.test(mobile)) {
      return res.status(400).json({
        msg: "Invalid Mobile number",
      });
    }

    const existingUser = await user.findOne({
      $or: [{ email }, { mobile }],
    });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const newUser = await user.create({
      name,
      email,
      mobile,
      password,
      isVerfied: false,
      verificationToken: jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" }),
    });
    handleVerifyUser(email, newUser.verificationToken);
    return res.json({ msg: "User created", user: newUser });
  } catch (error) {
    return res.status(500).json({ msg: "Internal server error" });
  }
}

async function handleVerifyUser(email, token) {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.USER_MAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.USER_MAIL,
      subject: "Verification Mail",
      html: `<h2>Email Verification</h2><p>Please verify your email by clicking the link below:</p>
          <a href="http://localhost:4200/verify-email?token=${token}">Verify Email</a>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log("Email not sent");
  }
}

async function verify_user(req, res) {
  const { token } = req.body;
  console.log(req.body);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const user1 = await user.findOne({ email, verificationToken: token });

    if (!user1) {
      return res.status(400).json({ message: "Invalid token or user" });
    }

    user1.isVerified = true;
    user1.verificationToken = null;
    await user1.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ message: "Token verification failed", error });
  }
}

async function handleUserLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(403).json({ msg: "Please fill your credentials" });
    }

    const curUser = await user.findOne({ email });
    if (!curUser) {
      return res.status(404).json({ msg: "Invalid Email" });
    }

    if (curUser.isVerified == false) {
      return res.status(401).json({ msg: "Email not verified" });
    }

    const result = await bcrypt.compare(password, curUser.password);

    if (!result) {
      return res.status(400).json({ msg: "Invalid Password" });
    }

    const accessToken = generateAccessToken(curUser);
    const refreshToken = generateRefreshToken(curUser);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .cookie("accessToken", accessToken, (SameSite = "None"), options)
      .cookie("refreshToken", refreshToken, (SameSite = "None"), options);
    res.json({ curUser });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

async function handleUserLogout(req, res, next) {
  try {
    res.clearCookie("accessToken", (SameSite = "None"));
    res.clearCookie("refreshToken", (SameSite = "None"));
    res.json({ msg: "logout successful" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

async function refreshAccessToken(req, res) {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
      return res.status(403).json({ msg: "You are not loggedIn" });
    }

    const userId = getUser(incomingRefreshToken)._id;
    const curUser = await user.findById(userId);

    if (!curUser) {
      return res.status(400).json({ msg: "You was logged out! Login Again" });
    }

    const accessToken = generateAccessToken(curUser);
    const refreshToken = generateRefreshToken(curUser);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .cookie("accessToken", accessToken, (SameSite = "None"), options)
      .cookie("refreshToken", refreshToken, (SameSite = "None"), options);
    res.json({ msg: "successful" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

async function handleForgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(403).json({ msg: "Please fill your email" });
    }

    const resetToken = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const user1 = await user.findOneAndUpdate(
      { email },
      { resetToken },
      { new: true }
    );

    if (!user1) {
      return res.status(404).send({ message: "User not found" });
    }

    await user1.save();

    res.cookie("resetToken", resetToken, (SameSite = "None"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.USER_MAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    const mailOptions = {
      to: user1.email,
      from: process.env.USER_MAIL,
      subject: "Password Reset",
      html: `<p>You requested a password reset. Click <a href="http://localhost:4200/resetPassword">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.send({ message: "Password reset email sent" });
  } catch (err) {
    res
      .status(500)
      .send({ message: "Error sending reset email", error: err.message });
  }
}

async function handleResetPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(403).json({ msg: "Please fill password" });
    }
    const resetToken1 = req.cookies?.resetToken;
    if (!resetToken1) {
      return res.status(400).send({ message: "Reset token missing" });
    }

    const decoded = jwt.verify(resetToken1, process.env.JWT_SECRET);

    const user1 = await user.findById(decoded.id);
    if (!user1 || user1.resetToken !== resetToken1) {
      return res.status(400).send({ message: "Invalid or expired token" });
    }

    user1.password = password;
    user1.resetToken = null;
    await user1.save();
    res.clearCookie("resetToken");

    res.send({ message: "Password reset successfully" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).send({ message: "Token expired" });
    } else {
      res
        .status(500)
        .send({ message: "Error resetting password", error: error.message });
    }
  }
}

async function handleChangePassword(req, res, next) {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(403).json({ msg: "Please fill your Credentials" });
    }
    const _id = req.user._id;
    const curUser = await user.findOne({ _id });
    if (!curUser) {
      return res.status(400).json({ msg: "You are not Authorized" });
    }

    const result = await bcrypt.compare(oldPassword, curUser.password);

    if (!result) {
      return res.status(400).json({ msg: "Old Password is wrong!" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ msg: "Confirm Password does not match" });
    }

    curUser.password = newPassword;
    await curUser.save();
    res.json({ msg: "Password changed successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Something went wrong" });
  }
}

module.exports = {
  handleUserSignUp,
  handleUserLogin,
  handleUserLogout,
  refreshAccessToken,
  handleForgotPassword,
  handleResetPassword,
  handleChangePassword,
  handleVerifyUser,
  verify_user,
};
