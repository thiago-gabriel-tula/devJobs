const {mostrarTrabajos} = require('../controllers/homeController.js');
const vacantesController = require('../controllers/vacantesController.js');
const usuariosController = require('../controllers/usuariosController.js');
const authController = require('../controllers/authController.js');

const express = require('express');
const router = express.Router();

module.exports = ()=>{
    router.get('/', mostrarTrabajos);

    // Crear vacantes
    router.get('/vacantes/nueva', authController.verificarUsuario, vacantesController.formularioNuevaVacante);
    router.post('/vacantes/nueva', authController.verificarUsuario,  vacantesController.validarVacantes, vacantesController.agregarVacante);

    // mostrar Vacante
    router.get('/vacante/:url', vacantesController.mostrarVacante);

    // editar Vacante
    router.get('/vacantes/editar/:url', authController.verificarUsuario, vacantesController.formEditarVacante);
    router.post('/vacantes/editar/:url', authController.verificarUsuario,  vacantesController.validarVacantes, vacantesController.editarVacante);

    
    //Eliminar Vacante
    router.delete('/vacantes/eliminar/:id', vacantesController.eliminarVacante) 

    // Crear cuentas
    router.get('/crear-cuenta', usuariosController.formCrearCuenta);
    router.post('/crear-cuenta', usuariosController.validarRegistro, usuariosController.crearUsuario);

    // Autenticar Usuarios
    router.get('/iniciar-sesion', usuariosController.formIniciarSesion);
    router.post('/iniciar-sesion', authController.autenticarUsuario);

    // Cerrar Sesion
    router.get('/cerrar-sesion', authController.verificarUsuario, usuariosController.cerrarSesion);

    // Resetear password (email)
    router.get('/reestablecer-password', authController.formReestablecerPassword);
    router.post('/reestablecer-password', authController.enviarToken);

    // Resetear password (almacenar en la base de datos)
    router.get('/reestablecer-password/:token', authController.reestablecerPassword);
    router.post('/reestablecer-password/:token', authController.guardarPassword);

    // Panel de administracion
    router.get('/administracion', authController.verificarUsuario, authController.mostrarPanel);

    // Editar Perfil
    router.get('/editar-perfil', authController.verificarUsuario, usuariosController.formEditarPerfil);
    router.post('/editar-perfil', authController.verificarUsuario, 
        usuariosController.validarPerfil,
        usuariosController.subirImagen,
        usuariosController.editarPerfil
    );


    // Recibir mensajes de candidatos
    router.post('/vacante/:url', vacantesController.subirCv, vacantesController.contactar);

    // Muestra los candidatos por vacantes
    router.get('/candidatos/:id', authController.verificarUsuario, vacantesController.mostrarCandidatos);

    // Buscador de vacante
    router.post('/buscador', vacantesController.buscarVacantes)

    return router;
}