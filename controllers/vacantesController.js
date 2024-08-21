const { default: mongoose } = require("mongoose")

const Vacante = mongoose.model('Vacante')
const { body, validationResult } = require('express-validator');

const multer = require('multer');
const shortid = require('shortid');

exports.formularioNuevaVacante = (req, res)=>{
    res.render('nuevaVacante', {
        nombrePagina: 'Nueva Vacante',
        tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

// Agregar la vacante a la base de datos 
exports.agregarVacante = async (req, res)=>{
    const vacante = new Vacante(req.body);

    // Usuaio Autor de la vacante
    vacante.autor = req.user._id;

    // Crear arreglo de skills
    vacante.skills = req.body.skills.split(',')

    // Almacenar en la base de datos
    const nuevaVacante = await vacante.save();

    // redireccionar
    res.redirect(`/vacante/${nuevaVacante.url}`)
}

// muestra una vacante 
exports.mostrarVacante = async (req, res, next)=>{
    const {url} = req.params;

    const vacante = await Vacante.findOne({url}).populate('autor');

    if(!vacante) return next();

    res.render('vacante', {
        vacante,
        nombrePagina: vacante.titulo,
        barra: true
    })
}


// Formulario para editar
exports.formEditarVacante = async (req, res, next)=>{
    const vacante = await Vacante.findOne({url: req.params.url});

    if(!vacante) return next();

    res.render('editar-vacante', {
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
};

// Editar La vacante
exports.editarVacante = async (req, res, next)=>{
    const vacanteActualizada = req.body;

    vacanteActualizada.skills = req.body.skills.split(',');

    const vacante = await Vacante.findOneAndUpdate({url: req.params.url}, vacanteActualizada, {new: true, runValidators: true});

    res.redirect(`/vacante/${vacante.url}`)
}

// Validar y sanitizar los campos de la nueva vacantes
exports.validarVacantes = async (req, res, next)=>{
    // Sanitizar los campos
    await Promise.all([
        body('titulo').isLength({min: 1}).withMessage('El campo Titulo está Vacío').trim().escape().run(req),
        body('empresa').isLength({min: 1}).withMessage('Agrega una Empresa').trim().escape().run(req),
        body('ubicacion').isLength({min: 1}).withMessage('Agrega una Ubicación').trim().escape().run(req),
        body('salario').trim().escape().run(req),
        body('contrato').isLength({min: 1}).withMessage('Selecciona un tipo de Contrato').trim().escape().run(req),
        body('skills').trim().escape().run(req)
    ])

    let errores = validationResult(req);

    if(!errores.isEmpty()){
        // Recargar la vista con los errores
        req.flash('error', errores.errors.map(error=> error.msg));

        res.render('nuevaVacante', {
            nombrePagina: 'Nueva Vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })
        return;
    }
    
    next(); // Siguiente middleware
}

// 
exports.eliminarVacante = async (req, res, next)=>{
    const {id} = req.params;

    const vacante = await Vacante.findById(id);

    if(!vacante){
        return res.status(403).send('Vacante no encontrada')
    }

    if(verificarAutor(vacante, req.user)){
        // Sí, es el usuario, eliminar
        await vacante.deleteOne();

        res.status(200).send('Vacante Eliminada correctamente');

    }else{
        // No permitido
        res.status(403).send('Error');
    }

    
}

const verificarAutor = (vacante = {}, usuario = {})=>{
    if(!vacante.autor.equals(usuario._id)){
        return false;
    }else{
        return true;
    }
}

// Opciones de Multer
const configuracionMulter = {
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, cb)=>{
            cb(null, __dirname+'../../public/uploads/cv');
        },
        filename: (req, file, cb)=>{
            const extension = file.mimetype.split('/')[1];

            cb(null, `${shortid.generate()}.${extension}`)
        }
    }),
    fileFilter(req, file, cb){
        if(file.mimetype === 'application/pdf'){
            // El callback se ejecuta como true o como false : true cuando la imagen se acepta 
            cb(null, true);
        }else{
            cb(new Error('Formato no Válido'), false);
        }
    },
    // limits: {fileSize: 100000}
}

const upload = multer(configuracionMulter).single('cv');

// Subir archivos en pdf
exports.subirCv = (req, res, next)=>{
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
            return res.redirect('back');
        }
        
        // Si no hay ningún error, continúe con el siguiente middleware
        return next();
    })    
};


// Almacenar los candidatos en la base de datos
exports.contactar = async (req, res, next)=>{
    const vacante = await Vacante.findOne({url: req.params.url});

    if(!vacante){
        return next();
    }

    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    };

    // Almacenar la vacante
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();

    // Mensaje flash y redireccion
    req.flash('correcto', 'Se envió tu Curriculum correctamente');

    res.redirect('/')
};

exports.mostrarCandidatos = async (req, res, next)=>{
    const vacante = await Vacante.findById(req.params.id);

    if(vacante.autor != req.user._id.toString()){
        return next();
    }

    if(!vacante) return next();

    res.render('candidatos', {
        nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos
    })
}

// Buscador de vacantes
exports.buscarVacantes = async (req, res)=>{
    const vacantes = await Vacante.find({
        $text: {
            $search: req.body.q
        }
    });

    // mostrar las vacantes
    res.render('home', {
        nombrePagina: `Resultados para las búsqueda : ${req.body.q}`,
        barra: true,
        vacantes
    })

}