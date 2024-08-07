# Proyecto de Autenticación con zk-SNARKs, Node.js y MongoDB

Este proyecto demuestra cómo implementar un esquema de autenticación utilizando zk-SNARKs, Node.js, MongoDB y Passport.js para autenticación privada.

## Requisitos

- Node.js
- MongoDB
- npm (Node Package Manager)

## Instalación

1. Clona el repositorio:

   ```sh
   git clone https://github.com/sebaszeledon/zk-auth.git
   cd zk-auth
   
2. Instala las dependencias:
   ```sh
   npm install

3. Instala MongoDB:

   ```sh
   brew tap mongodb/brew
   brew install mongodb-community@6.0

4. Configura el entorno:
   Crea un archivo .env en la raíz del proyecto y añade las siguientes variables de entorno:

   ```sh
   MONGO_URI=mongodb://127.0.0.1:27017/nombre_de_tu_base_de_datos
   SESSION_SECRET=your_secret_key

## Uso

Compila los circuitos zk-SNARKs:

Asegúrate de tener circom y snarkjs instalados. Si no los tienes, puedes instalarlos globalmente:
```sh
npm install -g circom snarkjs
```

Compila el circuito:
```sh
circom circuit.circom --r1cs --wasm --sym --c
```

Genera el test de prueba:
```sh
snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="1st Contributor Name" -v
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
```

Inicia el servidor:
```sh
node server.js
```

Abre tu navegador y navega a http://localhost:3000.


