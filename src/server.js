const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const snarkjs = require("snarkjs");
const fs = require("fs");

//Creación de servidor Express
const app = express();
app.use(express.json());
app.use(
  session({ secret: "your_secret_key", resave: false, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: "Usuario no encontrado" });
      }

      const { proof, publicSignals } = await generateProof(
        password,
        user.hashPassword
      );
      const isValid = await verifyProof(proof, user.hashPassword);

      if (isValid) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Contraseña incorrecta" });
      }
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

//Integración zk-SNARKs en Node.js
const generateProof = async (password, hashPassword) => {
  const input = { password, hash_password: hashPassword };
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "build/authentication_js/authentication.wasm",
    "build/authentication_final.zkey"
  );
  return { proof, publicSignals };
};

const verifyProof = async (proof, publicSignals) => {
  const vkey = JSON.parse(fs.readFileSync("build/verification_key.json"));
  return await snarkjs.groth16.verify(vkey, publicSignals, proof);
};

//Configuración MongoDB
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/zk-auth', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username: String,
  hashPassword: String
});

const User = mongoose.model('User', UserSchema);

//Registro de Usuario
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hashPassword = await hashPasswordWithPoseidon(password);

  const newUser = new User({ username, hashPassword });
  await newUser.save();

  res.redirect("/login");
});

const hashPasswordWithPoseidon = async (password) => {
  const { proof, publicSignals } = await generateProof(password, null);
  return publicSignals[0];
};