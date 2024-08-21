const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Usuario = mongoose.model('Usuarios');

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    },
    async (email, password, done)=>{
        const usuario = await Usuario.findOne({email});
        if(!usuario) return done(null, false, {
            message: 'Usuario no existente'
        })

        // Usuario existe, vamos a verificarlo
        const verificarPassword = usuario.compararPassword(password);

        if(!verificarPassword) return done(null, false, {message: 'Password Incorrecto'});

        // El usuario existe y el password es correcto
        return done(null, usuario);
    })
);

passport.serializeUser((usuario, done)=> done(null, usuario._id));

passport.deserializeUser(async (id, done)=>{
    const usuario = await Usuario.findById(id).exec();
    return done(null, usuario)
})

module.exports = passport