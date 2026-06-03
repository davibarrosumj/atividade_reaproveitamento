require('dotenv').config();

const flash = require('connect-flash');
const express = require('express');
const session = require('express-session');

const sequelize = require('./database');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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


sequelize.sync().then(() => app.listen(
    process.env.PORT,
    () => console.log('Servidor rodando')
));
