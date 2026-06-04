require('dotenv').config();

const cookieParser = require('cookie-parser');
const express = require('express');
const flash = require('connect-flash');
const session = require('express-session');

const sequelize = require('./database');
const authRoutes = require('./routes/authRoutes');
const dashRoutes = require('./routes/dashRoutes');

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

app.use(authRoutes);
app.use(dashRoutes);

sequelize.sync().then(() => app.listen(
    process.env.PORT,
    () => console.log('Servidor rodando')
));
