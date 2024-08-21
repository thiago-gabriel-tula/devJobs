const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const bcrypt = require('bcrypt');

const UsuariosSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    nombre: {
        type: String,
        required: 'Agrega tu nombre',
        trim: true

    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    token: String,
    expira: Date,
    imagen: String
});

// Metodos para hashear el password
UsuariosSchema.pre('save', async function(next){
    // Si el password ya está hasheado no hacemos nada
    if(!this.isModified('password')){
        return next(); //Deten la ejecucion
    }

    // Si no está hasheado 
    const hash = await bcrypt.hash(this.password, 10);

    this.password = hash;
    next();
});


// Envia Alerta cuando un usuario ya está registrado
UsuariosSchema.post('save', async function(error, doc, next){
    // Cuando hay usuarios duplicados
    if(error.name === 'MongoError' && error.code === 11000){
        next('Ese Correo ya está registrado');
    }else{
        next(error);
    }
});

// Auntenticar Usuarios
UsuariosSchema.methods = {
    compararPassword: function(password){

        return bcrypt.compareSync(password, this.password);
    }
}

module.exports = mongoose.model('Usuarios', UsuariosSchema);