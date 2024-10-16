const user = require('../models/user')
const bcrypt = require('bcryptjs')
const {generateAccessToken, generateRefreshToken, getUser} = require('../service/auth')
const JWT_SECRET = '$rrr%';  

async function handleUserSignUp(req, res) {
    const { name, email, mobile, password } = req.body;

    await user.create({
        name,
        email,
        mobile,
        password
    })

    return res.json({msg:"user Created"});
}

async function handleUserLogin(req, res, next) {
    try {
        const {email, password} = req.body;
        let curUser = await user.findOne({email});
        if(!curUser) {
            return res.status(400).json({msg: "Invalid Email"});
        }

        const result = await bcrypt.compare(password, curUser.password)


        if(!result) {
            return res.status(400).json({msg: "Invalid Password"});
        }

        const accessToken = generateAccessToken(curUser);
        const refreshToken = generateRefreshToken(curUser);
        curUser.refreshToken = refreshToken;
        curUser.save();

        const options = {
            httpOnly: true,
            secure: true,
        }

        res
        .cookie('accessToken', accessToken, SameSite='None', options)
        .cookie('refreshToken', refreshToken, SameSite='None', options);
        return res.json({curUser});
    }
    catch(error) {
        next(error);
    }
}

async function handleUserLogout(req, res, next) {
    try {
        const newUser = await user.findByIdAndUpdate(
            req.user._id,
            {
                $set: { refreshToken: "" } 
            },
            { new: true } 
        );
        res.clearCookie('accessToken', SameSite='None');
        res.clearCookie('refreshToken', SameSite='None');
        return res.json({msg : "logout successful"});
    }
    catch(error) {
        next(error);
    }
}

async function refreshAccessToken(req, res) {
    console.log("request for new Access Token");
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    console.log(incomingRefreshToken);
    if(!incomingRefreshToken) {
        return res.status(400).json({msg: "You are not loggedIn"});
    }

    const userId = getUser(incomingRefreshToken)._id;
    console.log("userId: ", userId);
    const curUser = await user.findById(userId);
    console.log("cur user", curUser);

    if(!curUser) {
        return res.status(400).json({msg: "You was logged out! Login Again"});
    }

    if(curUser.refreshToken !== incomingRefreshToken) {
        console.log(curUser);
        console.log(curUser.refreshToken);
        console.log(incomingRefreshToken);
        return res.status(400).json({msg: "You was logged out! Login Again."});
    }

    const accessToken = generateAccessToken(curUser);
    const refreshToken = generateRefreshToken(curUser);
    curUser.refreshToken = refreshToken;
    curUser.save();

    console.log("tokens updated");

    const options = {
        httpOnly: true,
        secure: true,
    }

    res
    .cookie('accessToken', accessToken, SameSite='None', options)
    .cookie('refreshToken', refreshToken, SameSite='None', options);
    return res.json({msg : "successful"});
}

async function handleForgotPassword(req, res) {
    const { email } = req.body;


    try {
      const user1 = await user.findOne({ email });
      if (!user1) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      const resetToken = jwt.sign({ id: user1._id }, JWT_SECRET, { expiresIn: '1h' });

  
      user1.resetPasswordToken = resetToken;
      await user1.save();
  
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'a32584663@gmail.com',  
          pass: 'nhgm oewb whjg buzm',   
        },
      });
  
      const mailOptions = {
        to: user1.email,
        from: 'a32584663@gmail.com',
        subject: 'Password Reset',
        html: `<p>You requested a password reset. Click <a href="http://localhost:4200/resetPassword?token=${resetToken}">here</a> to reset your password.</p>`,
      };
  
      await transporter.sendMail(mailOptions);
      res.send({ message: 'Password reset email sent' });
  
    } catch (err) {
      res.status(500).send({ message: 'Error sending reset email' });
    }
}

async function handleResetPassword(req, res) {
    const { token, newPassword } = req.body;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user1 = await user.findById(decoded.id);
      if (!user1) {
        return res.status(404).send({ message: 'User not found' });
      }

      user1.password = newPassword;
      user1.resetPasswordToken = undefined; 
      await user1.save();
  
      res.send({ message: 'Password reset successful' });
  
    } catch (err) {
      res.status(500).send({ message: 'Invalid or expired token' });
    }
}

async function handleChangePassword(req, res, next) {
    try {
        const {oldPassword, newPassword, confirmPassword} = req.body;
        const accessToken = req.cookies?.accessToken;
        console.log("access Token: ", accessToken);
        let data = getUser(accessToken);
        const _id = data.curUser._id;
        console.log(_id);
        const curUser = await user.findOne({_id});
        console.log(curUser);
        if(!curUser) {
            return res.status(400).json({msg: "You are not loggedIn!"});
        }

        const result = await bcrypt.compare(oldPassword, curUser.password);

        if(!result) {
            return res.status(400).json({msg : "Old Password is wrong!"});
        }

        if(newPassword !== confirmPassword) {
            return res.status(400).json({msg: "Confirm Password does not match"});
        }

        curUser.password = newPassword;
        await curUser.save();
        return res.json({msg: "Password changed successfully!"});

    }catch(error) {
        next(error);
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
}