// const { MongoClient } = require('mongodb');

// // Tu URI de conexión
// const uri = "url";

// // Crear una nueva instancia de MongoClient
// const client = new MongoClient(uri);

// async function main() {
//   try {
//     // Conectar al cliente
//     await client.connect();

//     // Conectar a la base de datos específica (si es necesario)
//     const database = await client.db('devJobs'); // Reemplaza con el nombre de tu base de datos
//     const collection = await database.collection('vacantes'); // Reemplaza con el nombre de tu colección

//     // Realiza alguna operación como encontrar documentos
//     const docs = await collection.find({}).toArray();
//     console.log(docs);
//     console.log('Base de datos conectada ');

//   } catch (err) {
//     console.error(err);
//   } finally {
//     // Cerrar la conexión cuando hayas terminado
//     await client.close();
//   }
// }

// module.exports = {main}

// =======================================================================================================================
const mongoose = require('mongoose');
const path = require('path');


const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, 'variables.env') });

// conectarse a la base de datos
mongoose.connect(process.env.DATABASE);

// Evento que escucha la base de datos si hay un error
mongoose.connection.on('error', error=> console.log(error));

// Importar los modelos 
require('../models/Vacantes.js')
require('../models/Usuarios.js')

