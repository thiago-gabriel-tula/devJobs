const { default: mongoose } = require("mongoose");
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');

const Usuarios = mongoose.model('Usuarios')


exports.subirImagen = (req, res, next)=>{
    upload(req, res, function(error){
        
        if(error){
            // Compruebe si el error es un error específico de Multer
            if(error instanceof multer.MulterError){
                switch(error.code){
                    case 'LIMIT_FILE_SIZE':
                        req.flash('error', 'El archivo es muy grande: Máximo 100kb');
                        break;

                    default:
                        req.flash('error', error.message);
                        break;
                }

            } else{
                // Manejar errores que no son de Multer
                req.flash('error', error.message);
            }
        
            // Redirigir a la página de administración en caso de cualquier error
            return res.redirect('/administracion');
        }
        
        // Si no hay ningún error, continúe con el siguiente middleware
        return next();
    })    
}


// Opciones de Multer
const configuracionMulter = {
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, cb)=>{
            cb(null, __dirname+'../../public/uploads/perfiles');
        },
        filename: (req, file, cb)=>{
            const extension = file.mimetype.split('/')[1];

            cb(null, `${shortid.generate()}.${extension}`)
        }
    }),
    fileFilter(req, file, cb){
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/svg'|| file.mimetype === 'image/png'){
            // El callback se ejecuta como true o como false : true cuando la imagen se acepta 
            cb(null, true);
        }else{
            cb(new Error('Formato no Válido'), false);
        }
    },
    // limits: {fileSize: 100000}
}


const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res)=>{
    res.render('crear-cuenta', {
        nombrePagina: 'Crear Cuenta en devJobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    })
};


exports.validarRegistro = async (req, res, next)=>{

    
    await Promise.all([
        body('nombre').isLength({ min: 1 }).withMessage('El Nombre es obligatorio').trim().escape().run(req),
        body('email').isEmail().withMessage('Eso no parece un Email').trim().escape().run(req),
        body('password').isLength({ min: 6 }).withMessage('El Password no puede ir vacío').trim().escape().run(req),
        body('confirmar').isLength({min:1}).withMessage('Confirmar Password no puede ir vacío').trim().escape().custom((value, { req }) => {
            // Comparar el campo 'confirmar' con el campo 'password'
            if (value !== req.body.password) {
                throw new Error('Confirmar Password debe coincidir con la contraseña');
            }
            return true;
        }).run(req)
    ]);

    const errores = validationResult(req);


    if(!errores.isEmpty()){
        // Si hay errores
        req.flash('error', errores.errors.map(error=> error.msg))

        res.render('crear-cuenta', {
            nombrePagina: 'Crear Cuenta en devJobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
            mensajes: req.flash()
        });

        return;
    }

    // Si toda la validacion es correcta
    next()

    
}

exports.crearUsuario = async (req, res, next)=>{
    const usuario = new Usuarios(req.body);

    try {
        await usuario.save();
        res.redirect('/iniciar-sesion');

    } catch (error) {
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    } 
}


// Formulario para iniciar sesion
exports.formIniciarSesion = (req, res, next)=>{
    res.render('iniciar-sesion', {
        nombrePagina: 'Iniciar Sesion en devJobs'
    })
}

// Form para editar el perfil
exports.formEditarPerfil = (req, res)=>{
    res.render('editar-perfil', {
        nombrePagina: 'Edita tu perfil en devJobs',
        usuario: req.user,
        cerrarSesion: true,
        nombre: req.user.nombre
    })
}

// Guardar cambios de editar perfil
exports.editarPerfil = async (req, res)=>{
    const usuario = await Usuarios.findById(req.user._id);

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;

    if(req.body.password){
        usuario.password = req.body.password;
    }

    if(req.file){
        usuario.imagen = req.file.filename;
    }
    
    await usuario.save();

    req.flash('correcto', 'Cambios Guardados Correctamente')

    res.redirect('/administracion');
};



exports.cerrarSesion = (req, res)=>{
    req.logout((err) => {
        if (err) { 
            return next(err); 
        }
        
        req.flash('correcto', 'Cerraste Sesión Correctamente');

        return res.redirect('/iniciar-sesion');
        
    });
    
}

// sanitizar y validar el formulario de editar perfil
exports.validarPerfil = async (req, res, next)=>{
    await Promise.all([
        body('nombre').isLength({min:1}).withMessage('El campo Nombre está vacío').trim().escape().run(req),
        body('email').isLength({min:1}).withMessage('El campo Email está vacío').trim().escape().run(req)
    ]);

    if(req.body.password){
        await body('password').trim().escape().run(req);
    }

    let errores = validationResult(req);

    if(!errores.isEmpty()){
        req.flash('error', errores.errors.map(error=> error.msg));

        res.render('editar-perfil', {
            nombrePagina: 'Edita tu perfil en devJobs',
            usuario: req.user,
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        });

        return;
    }

    next();
}