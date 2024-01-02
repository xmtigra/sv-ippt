import express from "express";
import mysql from "mysql";
import session from 'express-session';
import crypto from "crypto";
import ejsLayouts from 'express-ejs-layouts';

const app = express();

app.set('view engine', 'ejs');
app.use(ejsLayouts);

app.use(session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: true
}));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'ippt',
    password: 'ippt',
    database: 'ippt'
});

app.use(express.urlencoded({extended: true}));
app.use(express.json());

connection.connect(err => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }

    console.log('Connect to DB with id ID ' + connection.threadId);
});

app.use(express.static('public'));

function requireAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login',
        user: null
    });
});

app.post('/login', (req, res) => {
    const {email, password} = req.body;
    const hash = crypto.createHash('md5').update(password).digest('hex');

    connection.query('SELECT * FROM tbl_staff WHERE email = ?', [email], (error, results, fields) => {
        if (error) {
            res.send('Error');
            return;
        }

        if (results.length > 0) {
            if (results[0].password === hash) {
                req.session.user = results[0];
                res.redirect('/');
            } else {
                res.send('Invalid email or password');
            }
        } else {
            res.send('User not found');
        }
    });
});


app.get('/', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_reservations ORDER BY reservation_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('reservations', {items: results, title: 'Reservations', user: req.session.user, active: '/'});
    });
});

app.get('/payments', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_payments ORDER BY payment_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('payments', {items: results, title: 'Payments', user: req.session.user, active: '/payments'});
    });
});

app.get('/rooms', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_rooms ORDER BY room_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('rooms', {items: results, title: 'Rooms', user: req.session.user, active: '/rooms'});
    });
});

app.get('/staff', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_staff ORDER BY staff_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('staff', {items: results, title: 'Staff', user: req.session.user, active: '/staff'});
    });
});

app.get('/users', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_users ORDER BY user_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('users', {items: results, title: 'Users', user: req.session.user, active: '/users'});
    });
});

app.get('/services', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_services ORDER BY service_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('services', {items: results, title: 'Services', user: req.session.user, active: '/services'});
    });
});

app.get('/logout', requireAuth, (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
