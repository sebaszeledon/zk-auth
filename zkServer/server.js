const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { execSync } = require('child_process');

const app = express();
const dataPath = path.join(__dirname, 'data.json');

// Leer datos de usuarios desde el archivo JSON
function readData() {
    if (!fs.existsSync(dataPath)) {
      return [];
    }
    const rawData = fs.readFileSync(dataPath);
    return JSON.parse(rawData);
  }
  
  // Guardar datos de usuarios en el archivo JSON
  function writeData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }
  
  // Configurar Passport.js
  passport.use(new LocalStrategy(
    (username, password, done) => {
      const users = readData();
      const user = users.find(u => u.username === username);
      if (!user) {
        return done(null, false, { message: 'Usuario no encontrado' });
      }
  
      // Verificar contraseña usando zk-SNARK
      verifyPassword(password, user.hash_password)
        .then(isValid => {
          if (!isValid) {
            return done(null, false, { message: 'Contraseña incorrecta' });
          }
          return done(null, user);
        })
        .catch(err => done(err));
    }
  ));
  
  passport.serializeUser((user, done) => {
    done(null, user.username);
  });
  
  passport.deserializeUser((username, done) => {
    const users = readData();
    const user = users.find(u => u.username === username);
    done(null, user);
  });
  
  // Verificar contraseña con zk-SNARK
  async function verifyPassword(password, hash_password) {
    // Crear el test.json con las entradas
    const witnessInput = {
      password: Number(password),
      hash_password: Number(hash_password)
    };
    fs.writeFileSync('input.json', JSON.stringify(witnessInput));
  
    // Generar la prueba
    execSync('nargo execute witness -- --input input.json --output witness.json');
    execSync('nargo prove witness.json --compiled compiled_program.json --output proof.json');
  
    // Leer el resultado de la prueba
    const result = fs.readFileSync('proof.json');
    const proof = JSON.parse(result);
  
    // Verificar la prueba
    const verifyCommand = 'nargo verify proof.json --verifier verifier.json';
    try {
      execSync(verifyCommand);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Configurar middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Rutas
  app.get('/', (req, res) => {
    res.send('<h1>Bienvenido</h1>');
  });
  
  app.get('/login', (req, res) => {
    res.send('<form action="/login" method="post"><div><label>Usuario:</label><input type="text" name="username"/></div><div><label>Contraseña:</label><input type="password" name="password"/></div><div><input type="submit" value="Iniciar sesión"/></div></form>');
  });
  
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));
  
  app.get('/register', (req, res) => {
    res.send('<form action="/register" method="post"><div><label>Usuario:</label><input type="text" name="username"/></div><div><label>Contraseña:</label><input type="password" name="password"/></div><div><input type="submit" value="Registrarse"/></div></form>');
  });
  
  app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = readData();
  
    // Hash the password
    const hash_password = bcrypt.hashSync(password, 10);
    users.push({ username, hash_password });
    writeData(users);
  
    res.redirect('/login');
  });
  
  app.listen(3000, () => {
    console.log('Servidor ejecutándose en http://localhost:3000');
  });