const { default: mongoose } = require('mongoose');
const passport = require('passport');
const Vacantes = mongoose.model('Vacante');
const Usuario = mongoose.model('Usuarios');
const crypto = require('crypto');
const { enviarEmail } = require('../helpers/email.js');
const { body, validationResult } = require('express-validator');


exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios'
});

// Revisar si el usuario está autenticado o no
exports.verificarUsuario = (req, res, next)=>{
    // Revisar el usuario
    if(req.isAuthenticated()){
        return next() // Estan autenticados
    }

    // redireccionar
    res.redirect('/iniciar-sesion')
}

exports.mostrarPanel = async (req, res)=>{

    // Consultar el usuario autenticado
    const vacantes = await Vacantes.find({autor: req.user._id});


    res.render('administracion', {
        nombrePagina: 'Panel de Administración',
        tagline: 'Crea y Administra tus vacantes desde aquí',
        vacantes,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
};

// Formulario para reiniciar el password
exports.formReestablecerPassword = (req, res, next)=>{
    res.render('reestablecer-password', {
        nombrePagina: 'Reestablece tu Password',
        tagline: 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu email'
    });
}

// Genera el token en la base de datos del usuario
exports.enviarToken = async (req, res, next)=>{
    const email = req.body.email;

    const usuario = await Usuario.findOne({email});

    if(!usuario){
        req.flash('error', 'No existe ningun usuario con ese Email');

        return res.redirect('/iniciar-sesion');
    }

    // El usuario existe, generar token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    // Guardar el usuario
    await usuario.save();

    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

    const html = `
        <h1>Has solicitado Reestablecer tu contraseña</h1>
        <p>Para reestablecer tu contraseña y recuperar tu acceso devJobs, <a href=${resetUrl} >presiona aquí</a></p>
    `;

    await enviarEmail('gabytula08@gmail.com', email, 'devJobs', 'Recupera tu cuenta a devJobs', 'Reestablece tu contraseña', html)


    req.flash('correcto', 'Revisa tu email para las indicaciones')
    res.redirect('/iniciar-sesion');
}


// Valida si el token es valido y el usuario existe, muestra la vista
exports.reestablecerPassword = async (req, res, next)=>{
    const usuario = await Usuario.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now() //$gt = esta sintaxis es para comprobar que sea mayor que Date.now(). Osea funciona como "<" este signo
        }
    });

    if(!usuario){
        req.flash('error', 'El formulario ya no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }

    // Si está todo bien, mostrar el formulario
    res.render('nuevo-password', {
        nombrePagina: 'Nuevo password'
    })
}

// Almacena el nuevo password en la base de datos
exports.guardarPassword = async (req, res)=>{
    const usuario = await Usuario.findOne({
        token: req.params.token,
        expira: {
            $gt: Date.now() //$gt = esta sintaxis es para comprobar que sea mayor que Date.now(). Osea funciona como "<" este signo
        }
    });

    if(!usuario){
        req.flash('error', 'El formulario ya no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }

    //Revisa que el campo no esté vacío
    await body('password').isLength({min: 6}).withMessage('La contraseña debe tener al menos 6 caracteres').trim().escape().run(req);

    let resultado = validationResult(req);

    if(!resultado.isEmpty()){
        req.flash('error', resultado.errors[0].msg);
        return res.redirect('back');
    }

    // Asignar nuevo password, limpiar valores previos
    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    // Agregar y eliminar valores del objeto
    await usuario.save();

    // Redirirgir
    req.flash('correcto', 'Password modificado correctamente');
    res.redirect('/iniciar-sesion');

}