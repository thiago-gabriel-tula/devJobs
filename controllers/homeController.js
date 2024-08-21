const { default: mongoose } = require("mongoose")
const Vacante = mongoose.model('Vacante')

exports.mostrarTrabajos = async (req, res, next)=>{

    const vacantes = await Vacante.find();

    if(!vacantes){
        return next()
    }

    res.render('home', {
        nombrePagina: 'DevJobs',
        tagline: 'Encuentra y Publica Trabajos para Desarrolladores Web',
        barra: true,
        boton: true,
        vacantes
    })
}