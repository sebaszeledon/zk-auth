const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { execSync } = require('child_process');
const crypto = require('crypto');

const app = express();
const dataPath = path.join(__dirname, 'data.json');
const nargoDir = path.resolve(__dirname, '../zkAuth');
const tomlPath = path.resolve(nargoDir, 'Prover.toml');

// Cambiar el directorio a zkAuth
process.chdir(nargoDir);


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

    // Usar SHA-256 para generar un hash del password y luego convertir a BigInt
    const passwordHash = Number(password)
    const hashPasswordHash = crypto.createHash('sha256').update(hash_password).digest('hex');

    const shorterhashPasswordHash = hashPasswordHash.slice(0, 16);  // Tomar solo los primeros 16 caracteres

    const numericShorterPasswordHash = BigInt(`0x${shorterhashPasswordHash}`);
    
    const tomlContent = `password = ${passwordHash}
    hash_password = ${numericShorterPasswordHash}`;
    fs.writeFileSync(tomlPath, tomlContent);

    // Debug: imprimir contenido de toml 
    console.log('Prover.toml content:', tomlContent);

    // Verificar que el archivo se ha creado correctamente
    if (!fs.existsSync(tomlPath)) {
      console.error('Prover.toml not found after writing!');
      return false;
    }
    
    // Generar la prueba
    try {
      execSync(`nargo execute -p Prover`);
    } catch (error) {
      console.error("Error executing nargo:", error.stderr.toString());
      return false;
    }
    
    // Ejecutar la prueba
    try {
      execSync(
        "nargo prove witness --compiled compiled_program.json --output proof.json"
      );
    } catch (error) {
      console.error("Error proving with nargo:", error.stderr.toString());
      return false;
    }

    // Leer el resultado de la prueba
    const result = fs.readFileSync('proof.json');
    const proof = JSON.parse(result);
    console.log('Proof: ', proof);

    // Verificar la prueba
    const verifyCommand = 'nargo verify --input proof.json --verifier verifier.json';

    try {
      execSync(verifyCommand);
      return true;
    } catch (error) {
      console.error('Error verifying with nargo:', error.stderr.toString());
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