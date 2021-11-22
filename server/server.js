const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const verifyToken = require("./middleware/verifyToken");

require("./config/database").connect();
const dataUsers = require("./model/user");

const app = express();
const jsonParser = express.json();

const generateAccessToken = (user_id, email) => {
  const payload = {
    user_id,
    email,
  };

  return jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: "2h" });
};

const generateResetPasswordToken = (user_id, name, email) => {
  const payload = {
    user_id,
    name,
    email,
  };

  return jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: "30m" });
};

const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
  auth: {
    user: "t7estes@yandex.ru",
    pass: "bmjninkovzefmdbu",
  },
});

app.post("/reg", jsonParser, async (req, res) => {
  password / reset;
  try {
    const { email, name, password } = req.body;

    const oldUser = await dataUsers.findOne({ email });

    if (oldUser) {
      return res.status(409).json({ message: "Exists" });
    }

    const encryptPassword = await bcrypt.hash(password, 12);

    const information = await new dataUsers({
      email: email.toLowerCase(),
      name,
      password: encryptPassword,
    });

    const token = generateAccessToken(information._id, email);

    information.token = token;

    transporter.sendMail(
      {
        from: "MyTrello <t7estes@yandex.ru>",
        to: email,
        subject: "Thank you for registering",
        text: "Thank you for registering on my service",
      },
      (error, info) => {
        if (error) return console.log(error);
        return console.log(info);
      }
    );

    information.save((error) => {
      if (error) {
        console.log(error);
        return res.sendStatus(500);
      }

      return res.status(201).json({ information });
    });
  } catch (error) {
    console.log(error);
    res.status(400).send("Error");
  }
});

app.post("/sig", jsonParser, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await dataUsers.findOne({ email });

    const decryptPassword = await bcrypt.compare(password, user.password);

    if (user && decryptPassword) {
      const token = generateAccessToken(user._id, email);

      user.token = token;

      user.save((error) => {
        if (error) {
          console.log(error);
          return res.sendStatus(500);
        }
      });
      return res.status(200).json({ user });
    }

    return res.sendStatus(400);
  } catch (error) {
    console.log(error);
    res.status(400).send("Error");
  }
});
// need change this
app.post("/forg", jsonParser, async (req, res) => {
  try {
    const { email, name } = req.body;

    const user = await dataUsers.findOne({ email, name });

    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = generateResetPasswordToken(user._id, name, email);

    user.resetToken = resetToken;

    user.save((error) => {
      if (error) {
        console.log(error);
        return res.sendStatus(500);
      }
    });

    // need generate token to reset password link
    transporter.sendMail({
      from: "MyTrello <t7estes@yandex.ru>",
      to: email,
      subject: "your data",
      text:
        "link to reset your password\n you have 30 minutes\n " +
        "http://localhost:3000/" +
        user.resetToken +
        "/reset/",
    });

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(400).send("Error");
  }
});

app.post("/password/validate", jsonParser, verifyToken, async (req, res) => {
  try {
    const { token } = req.body;

    const { resetToken } = await dataUsers.findOne({ resetToken: token });

    if (!resetToken) return res.status(404).json({ message: "User not found" });

    res.status(200).send("Valid");
  } catch (error) {
    console.log(error);
    res.status(400).send("Error");
  }
});

app.post("/password/reset", jsonParser, verifyToken, async (req, res) => {
  try {
    const { token, password } = req.body;

    const data = await dataUsers.findOne({ resetToken: token });

    if (!data) return res.status(404).json({ message: "User not found" });

    const decryptPassword = await bcrypt.compare(password, data.password);

    if (decryptPassword) {
      return res.status(400).send({ message: "Need another password" });
    }

    const encryptPassword = await bcrypt.hash(password, 12);

    data.password = encryptPassword;

    data.save((error) => {
      if (error) {
        console.log(error);
        return res.sendStatus(500);
      }
    });

    res.status(200).send({ message: "successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).send("Error");
  }
});

app.listen(5000, () => {
  console.log("Server is running");
});
