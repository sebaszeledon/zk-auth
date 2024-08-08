# Proyecto de Autenticación con zk-SNARKs, Node.js y Noir/Nargo

Este proyecto demuestra cómo implementar un esquema de autenticación utilizando zk-SNARKs, Node.js, Noir/Nargo y Passport.js para autenticación privada.

## Requisitos

- Node.js
- Noir/Nargo
- npm (Node Package Manager)
- Passport.js

## Instalación

1. Clona el repositorio:

   ```sh
   git clone https://github.com/sebaszeledon/zk-auth
   cd zk-auth
   ```

2. Instala las dependencias:

   ```sh
   npm install
   npm install express express-session passport passport-local bcrypt dotenv
   ```

3. Crea un archivo vacío llamado data.json en la carpeta zkServer para almacenar los usuarios:
   ```json
   []
   ```

## Uso

Compila los circuitos zk-SNARKs:

Asegúrate de tener Nargo instalado. Si no lo tienes, puedes instalarlo globalmente:

```sh
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
```

Después cierre la terminal, abra una nueva y ejecute el siguiente comando:

```sh
noirup
```

Compila el circuito dentro de la carpeta zkAuth:

```sh
nargo compile
```

Inicia el servidor:

```sh
node server.js
```

Abre tu navegador y navega a http://localhost:3000/register para registrar un usuario.

Navega a http://localhost:3000/login para iniciar sesión con el usuario creado.
