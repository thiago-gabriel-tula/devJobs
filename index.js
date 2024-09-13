// Importar la configuracion a la base de datos
const mongoose = require('mongoose');
require('./config/db.js');

// Importar dependencias
const express = require('express');
const exphbs = require('express-handlebars');
const { engine } = require('express-handlebars'); // Importar desde express-handlebars
const path = require('path');
const router = require('./routes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const createError = require('http-errors');
const passport = require('./config/passport.js');

const dotenv = require('dotenv');

const app = express();

// Habilitar handlebars como view
app.engine('handlebars', 
    engine({
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars'),
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true
        }
    }),
    
)

dotenv.config({ path: path.join(__dirname, 'variables.env') });

app.set('view engine', 'handlebars');

// Habilitar bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// validacion de campos
// app.use(expressValidator());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

const store = MongoStore.create({
    mongoUrl: process.env.DATABASE,
    collectionName: 'sessions'
});

app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave:false,
    saveUninitialized: false,
    store
}));

// Inicializar passport
app.use(passport.initialize());
app.use(passport.session());

// Alertas y Flash messages
app.use(flash());

// Crear nuestro middleware
app.use((req, res, next)=>{
    res.locals.mensajes = req.flash();
    next()
})

app.use('/', router());

// 404 Pagina no existente
app.use((req, res, next)=>{
    next(createError(404, 'No encontrado'))
})

// Administracion de los errores
app.use((error, req, res, next)=>{
    res.locals.mensaje = error.message;

    const status = error.status || 500;

    res.locals.status = status;

    res.status(status);
    
    res.render('error')
})


const puerto = process.env.PORT || 3000;

app.listen(puerto, ()=> console.log('Escuchando en el puerto ' + puerto))