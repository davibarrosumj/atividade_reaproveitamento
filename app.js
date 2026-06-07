require('dotenv').config();

const cookieParser = require('cookie-parser');
const express = require('express');
const flash = require('connect-flash');
const session = require('express-session');

const sequelize = require('./database');
const authRoutes = require('./routes/authRoutes');
const dashRoutes = require('./routes/dashRoutes');
const donationRoutes = require('./routes/donationRoutes');
const { seedDatabase } = require('./utils/seeder');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
app.use(donationRoutes);

// Global Error Handler (must be registered after routes)
app.use(errorMiddleware);

sequelize.sync({ alter: true })
    .then(() => seedDatabase())
    .then(() => app.listen(
        process.env.PORT,
        () => console.log('Servidor rodando')
    ));
