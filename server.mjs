import express from "express";
import mysql from "mysql";
import session from 'express-session';
import crypto from "crypto";
import ejsLayouts from 'express-ejs-layouts';
import config from "./config.mjs";

const app = express();

app.set('view engine', 'ejs');
app.use(ejsLayouts);

app.use(express.urlencoded({extended: true}));
app.use(express.json());


app.use(session({
    secret: config.sessionSecret, resave: false, saveUninitialized: true
}));

const connection = mysql.createConnection(config.database);

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
        title: 'Login', user: null
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
    const query = `
        SELECT tbl_reservations.reservation_id, tbl_users.first_name, tbl_users.user_id, tbl_users.last_name, tbl_rooms.room_number, tbl_rooms.room_id, tbl_rooms.room_type, tbl_reservations.check_in_date, tbl_reservations.check_out_date, tbl_reservations.total_amount, tbl_reservations.reservation_date
        FROM tbl_reservations
        INNER JOIN tbl_users ON tbl_reservations.user_id = tbl_users.user_id
        INNER JOIN tbl_rooms ON tbl_reservations.room_id = tbl_rooms.room_id ORDER BY tbl_reservations.reservation_id DESC`;

    connection.query(query, (error, results, fields) => {
        if (error) throw error;
        res.render('reservations', {items: results, title: 'Reservations', user: req.session.user, active: '/'});
    });
});

app.get('/reservations/add', requireAuth, async (req, res) => {
    const rooms = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_rooms ORDER BY room_id DESC', (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });
    const services = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_services ORDER BY service_id DESC', (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });
    const items = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_users ORDER BY user_id DESC', (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });
    res.render('reservations_add', {
        items: items, services: services, rooms: rooms, title: 'Add Reservation', user: req.session.user, active: '/'
    });
});

app.post('/reservations/add', requireAuth, async (req, res) => {
    const {user_id, room_id, check_in_date, check_out_date} = req.body;

    const roomPrice = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_rooms WHERE room_id = ?', [room_id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0].price);
        });
    });

    const date1 = new Date(check_in_date);
    const date2 = new Date(check_out_date);
    const diffTime = Math.abs(date2 - date1);

    const total_amount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) * roomPrice;

    connection.query('INSERT INTO tbl_reservations (user_id, room_id, check_in_date, check_out_date, total_amount) VALUES (?, ?, ?, ?, ?)', [user_id, room_id, check_in_date, check_out_date, total_amount], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/');
    });
});

app.get('/reservations/:id', requireAuth, async (req, res) => {
    const items = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_users ORDER BY user_id DESC', (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    const rooms = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_rooms ORDER BY room_id DESC', (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    const item = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_reservations WHERE reservation_id = ?', [req.params.id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    res.render('reservations_edit', {
        items: items, rooms: rooms, item: item, title: 'Edit Reservation', user: req.session.user, active: '/'
    });
});

app.get('/reservations/:id/view', requireAuth, async (req, res) => {

    const item = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_reservations WHERE reservation_id = ?', [req.params.id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    const room = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_rooms WHERE room_id = ?', [item.room_id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    const services = await new Promise((resolve, reject) => {
        const query = `
        SELECT tbl_reservation_services.reservation_id, tbl_reservation_services.service_id, tbl_reservation_services.total_amount, tbl_reservation_services.hours_used, tbl_services.service_name, tbl_services.price
        FROM tbl_reservation_services
        INNER JOIN tbl_services ON tbl_reservation_services.service_id = tbl_services.service_id WHERE tbl_reservation_services.reservation_id = ${req.params.id} ORDER BY tbl_reservation_services.reservation_id DESC`;

        connection.query(query, (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    const payments = await new Promise((resolve, reject) => {
        const query = `
        SELECT tbl_payments.payment_id, tbl_payments.reservation_id, tbl_payments.amount, tbl_payments.payment_date
        FROM tbl_payments
        INNER JOIN tbl_reservations ON tbl_payments.reservation_id = tbl_reservations.reservation_id WHERE tbl_reservations.reservation_id = ${req.params.id} ORDER BY tbl_payments.payment_id DESC`;

        connection.query(query, (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    const days = await new Promise((resolve, reject) => {
        const date1 = new Date(item.check_in_date);
        const date2 = new Date(item.check_out_date);
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        resolve(diffDays);
    });

    const amount = (room.price * days) + services.reduce((a, b) => a + (b.price * b.hours_used), 0);

    res.render('reservations_view', {
        item: item,
        payments,
        amount,
        days,
        services,
        room,
        title: 'View Reservation',
        user: req.session.user,
        active: '/'
    });
});

app.get('/reservations/:id/services', requireAuth, async (req, res) => {
    const {id} = req.params;

    const item = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_reservations WHERE reservation_id = ?', [id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    const services = await new Promise((resolve, reject) => {
        const query = `
        SELECT tbl_reservation_services.reservation_id, tbl_reservation_services.service_id, tbl_reservation_services.total_amount, tbl_reservation_services.hours_used, tbl_services.service_name, tbl_services.price
        FROM tbl_reservation_services
        INNER JOIN tbl_services ON tbl_reservation_services.service_id = tbl_services.service_id WHERE tbl_reservation_services.reservation_id = ${id} ORDER BY tbl_reservation_services.reservation_id DESC`;

        connection.query(query, (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });
    console.log(services)
    res.render('reservations_services', {
        item, services: services, title: 'Reservation Services', user: req.session.user, active: '/'
    });
});

app.get('/reservations/:id/services/add', requireAuth, async (req, res) => {
    const {id} = req.params;
    const item = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_reservations WHERE reservation_id = ?', [id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    const services = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_services ORDER BY service_id DESC', (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    res.render('reservations_services_add', {
        item, services: services, title: 'Add Reservation Service', user: req.session.user, active: '/'
    });
});

app.get('/reservations/:id/services/:service_id', requireAuth, async (req, res) => {
    const {id, service_id} = req.params;


    const services = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_services ORDER BY service_id DESC', (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    const service = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_reservation_services WHERE reservation_id = ? AND service_id = ?', [id, service_id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    const item = {
        reservation_id: id
    }

    res.render('reservations_services_edit', {
        item: item,
        service: service,
        services: services,
        title: 'Edit Reservation Service',
        user: req.session.user,
        active: '/'
    });
});

app.post('/reservations/:id/services/add', requireAuth, async (req, res) => {
    const {id} = req.params;
    const {service_id, hours_used} = req.body;

    const service = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_services WHERE service_id = ?', [service_id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    const total_amount = service.price * hours_used;

    connection.query('INSERT INTO tbl_reservation_services (reservation_id, service_id, total_amount, hours_used) VALUES (?, ?, ?, ?)', [id, service_id, total_amount, hours_used], (error, results, fields) => {
        if (error) throw error;
        res.redirect(`/reservations/${id}/view`);
    });
});

app.post('/reservations/:id/services/:service_id', requireAuth, async (req, res) => {
    const {id, service_id} = req.params;
    const {hours_used} = req.body;

    const service = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_services WHERE service_id = ?', [service_id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    const total_amount = service.price * hours_used;

    connection.query('UPDATE tbl_reservation_services SET hours_used = ?, total_amount = ? WHERE reservation_id = ? AND service_id = ?', [hours_used, total_amount, id, service_id], (error, results, fields) => {
        if (error) throw error;
        res.redirect(`/reservations/${id}/view`);
    });
});

app.post('/reservations/:id/services/:service_id/delete', requireAuth, async (req, res) => {
    const {id, service_id} = req.params;
    connection.query('DELETE FROM tbl_reservation_services WHERE reservation_id = ? AND service_id = ?', [id, service_id], (error, results, fields) => {
        if (error) throw error;
        res.redirect(`/reservations/${id}/view`);
    });
});

app.post('/reservations/:id', requireAuth, async (req, res) => {
    const {user_id, room_id, check_in_date, check_out_date} = req.body;

    const roomPrice = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_rooms WHERE room_id = ?', [room_id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0].price);
        });
    });

    const date1 = new Date(check_in_date);
    const date2 = new Date(check_out_date);
    const diffTime = Math.abs(date2 - date1);

    const total_amount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) * roomPrice;


    connection.query('UPDATE tbl_reservations SET user_id = ?, room_id = ?, check_in_date = ?, check_out_date = ?, total_amount = ? WHERE reservation_id = ?', [user_id, room_id, check_in_date, check_out_date, total_amount, req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/');
    });
});

app.post('/reservations/:id/delete', requireAuth, (req, res) => {
    connection.query('DELETE FROM tbl_reservations WHERE reservation_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/');
    });
});

app.get('/payments', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_payments ORDER BY payment_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('payments', {items: results, title: 'Payments', user: req.session.user, active: '/payments'});
    });
});

app.get('/payments/add', requireAuth, (req, res) => {
    const reservation_id = req.query.reservation_id;
    connection.query('SELECT * FROM tbl_reservations ORDER BY reservation_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('payments_add', {
            items: results,
            reservation_id: reservation_id,
            title: 'Add Payment',
            user: req.session.user,
            active: '/payments'
        });
    });
});

app.post('/payments/add', requireAuth, (req, res) => {
    const {reservation_id, amount} = req.body;
    connection.query('INSERT INTO tbl_payments (reservation_id, amount) VALUES (?, ?)', [reservation_id, amount], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/payments');
    });
});

app.get('/payments/:id', requireAuth, async (req, res) => {
    const items = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_reservations ORDER BY reservation_id DESC', (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });
    connection.query('SELECT * FROM tbl_payments WHERE payment_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.render('payments_edit', {
            items: items, item: results[0], title: 'Edit Payment', user: req.session.user, active: '/payments'
        });
    });
});

app.post('/payments/:id', requireAuth, (req, res) => {
    const {reservation_id, amount} = req.body;
    connection.query('UPDATE tbl_payments SET reservation_id = ?, amount = ? WHERE payment_id = ?', [reservation_id, amount, req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/payments');
    });
});

app.post('/payments/:id/delete', requireAuth, (req, res) => {
    connection.query('DELETE FROM tbl_payments WHERE payment_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/payments');
    });
});

app.get('/rooms', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_rooms ORDER BY room_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('rooms', {items: results, title: 'Rooms', user: req.session.user, active: '/rooms'});
    });
});

app.get('/rooms/add', requireAuth, (req, res) => {
    res.render('rooms_add', {title: 'Add Room', user: req.session.user, active: '/rooms'});
});

app.post('/rooms/add', requireAuth, (req, res) => {
    const {room_number, room_type, price} = req.body;
    connection.query('INSERT INTO tbl_rooms (room_number, room_type, price) VALUES (?, ?, ?)', [room_number, room_type, price], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/rooms');
    });
})

app.get('/rooms/:id', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_rooms WHERE room_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.render('rooms_edit', {
            item: results[0], title: 'Edit Room', user: req.session.user, active: '/rooms'
        });
    });
})

app.post('/rooms/:id', requireAuth, (req, res) => {
    const {room_number, room_type, price} = req.body;
    connection.query('UPDATE tbl_rooms SET room_number = ?, room_type = ?, price = ? WHERE room_id = ?', [room_number, room_type, price, req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/rooms');
    });
});

app.post('/rooms/:id/delete', requireAuth, (req, res) => {
    connection.query('DELETE FROM tbl_rooms WHERE room_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/rooms');
    });
});

app.get('/staff', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_staff ORDER BY staff_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('staff', {items: results, title: 'Staff', user: req.session.user, active: '/staff'});
    });
});

app.get('/staff/add', requireAuth, (req, res) => {
    res.render('staff_add', {title: 'Add Staff', user: req.session.user, active: '/staff'});
});

app.post('/staff/add', requireAuth, (req, res) => {
    const {first_name, last_name, email, role, password} = req.body;

    const hash = crypto.createHash('md5').update(password).digest('hex');

    connection.query('INSERT INTO tbl_staff (first_name, last_name, email, role, password) VALUES (?, ?, ?, ?, ?)', [first_name, last_name, email, role, hash], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/staff');
    });
});

app.get('/staff/:id', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_staff WHERE staff_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.render('staff_edit', {
            item: results[0], title: 'Edit Staff', user: req.session.user, active: '/staff'
        });
    });
})

app.post('/staff/:id', requireAuth, (req, res) => {
    const {first_name, last_name, email, role, phone} = req.body;
    connection.query('UPDATE tbl_staff SET first_name = ?, last_name = ?, email = ?, role = ?, phone = ? WHERE staff_id = ?', [first_name, last_name, email, role, phone, req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/staff');
    });
});

app.post('/staff/:id/delete', requireAuth, (req, res) => {
    connection.query('DELETE FROM tbl_staff WHERE staff_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/staff');
    });
});


app.get('/clients', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_users ORDER BY user_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('clients', {items: results, title: 'Clients', user: req.session.user, active: '/clients'});
    });
});

app.get('/clients/add', requireAuth, (req, res) => {
    res.render('clients_add', {title: 'Add Client', user: req.session.user, active: '/clients'});
});

app.post('/clients/add', requireAuth, (req, res) => {
    const {first_name, last_name, email} = req.body;
    connection.query('INSERT INTO tbl_users (first_name, last_name, email) VALUES (?, ?, ?)', [first_name, last_name, email], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/clients');
    });
});

app.get('/clients/:id', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_users WHERE user_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.render('clients_edit', {
            item: results[0], title: 'Edit Client', user: req.session.user, active: '/clients'
        });
    });
});

app.get('/clients/:id/view', requireAuth, async (req, res) => {
    const item = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tbl_users WHERE user_id = ?', [req.params.id], (error, results, fields) => {
            if (error) reject(error);
            resolve(results[0]);
        });
    });

    const reservations = await new Promise((resolve, reject) => {
        const query = `
        SELECT tbl_reservations.reservation_id, tbl_users.first_name, tbl_users.user_id, tbl_users.last_name, tbl_rooms.room_number, tbl_rooms.room_id, tbl_rooms.room_type, tbl_reservations.check_in_date, tbl_reservations.check_out_date, tbl_reservations.total_amount, tbl_reservations.reservation_date
        FROM tbl_reservations
        INNER JOIN tbl_users ON tbl_reservations.user_id = tbl_users.user_id
        INNER JOIN tbl_rooms ON tbl_reservations.room_id = tbl_rooms.room_id WHERE tbl_users.user_id = ${req.params.id} ORDER BY tbl_reservations.reservation_id DESC`;

        connection.query(query, (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    const payments = await new Promise((resolve, reject) => {
        const query = `
        SELECT tbl_payments.payment_id, tbl_payments.reservation_id, tbl_payments.amount, tbl_payments.payment_date
        FROM tbl_payments
        INNER JOIN tbl_reservations ON tbl_payments.reservation_id = tbl_reservations.reservation_id WHERE tbl_reservations.user_id = ${req.params.id} ORDER BY tbl_payments.payment_id DESC`;

        connection.query(query, (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    const services = await new Promise((resolve, reject) => {
        const query = `
        SELECT tbl_reservation_services.reservation_id, tbl_reservation_services.service_id, tbl_reservation_services.total_amount, tbl_reservation_services.hours_used, tbl_services.service_name, tbl_services.price
        FROM tbl_reservation_services
        INNER JOIN tbl_services ON tbl_reservation_services.service_id = tbl_services.service_id WHERE tbl_reservation_services.reservation_id = ${req.params.id} ORDER BY tbl_reservation_services.reservation_id DESC`;

        connection.query(query, (error, results, fields) => {
            if (error) reject(error);
            resolve(results);
        });
    });

    res.render('clients_view', {
        item: item,
        payments: payments,
        services: services,
        reservations: reservations,
        title: 'View Client',
        user: req.session.user,
        active: '/clients'
    });
});

app.post('/clients/:id', requireAuth, (req, res) => {
    const {first_name, last_name, email} = req.body;
    connection.query('UPDATE tbl_users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?', [first_name, last_name, email, req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/clients');
    });
});

app.post('/clients/:id/delete', requireAuth, (req, res) => {
    connection.query('DELETE FROM tbl_users WHERE user_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/clients');
    });
});

app.get('/services', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_services ORDER BY service_id DESC', (error, results, fields) => {
        if (error) throw error;
        res.render('services', {items: results, title: 'Services', user: req.session.user, active: '/services'});
    });
});

app.get('/services/add', requireAuth, (req, res) => {
    res.render('services_add', {title: 'Add Service', user: req.session.user, active: '/services'});
});

app.post('/services/add', requireAuth, (req, res) => {
    const {service_name, description, price} = req.body;
    connection.query('INSERT INTO tbl_services (service_name, description, price) VALUES (?, ?, ?)', [service_name, description, price], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/services');
    });
});

app.get('/services/:id', requireAuth, (req, res) => {
    connection.query('SELECT * FROM tbl_services WHERE service_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.render('services_edit', {
            item: results[0], title: 'Edit Service', user: req.session.user, active: '/services'
        });
    });
});

app.post('/services/:id', requireAuth, (req, res) => {
    const {service_name, description, price} = req.body;
    connection.query('UPDATE tbl_services SET service_name = ?, description = ?, price = ? WHERE service_id = ?', [service_name, description, price, req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/services');
    });
});

app.post('/services/:id/delete', requireAuth, (req, res) => {
    connection.query('DELETE FROM tbl_services WHERE service_id = ?', [req.params.id], (error, results, fields) => {
        if (error) throw error;
        res.redirect('/services');
    });
});

app.get('/logout', requireAuth, (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('*', (req, res) => {
    res.render('404', {title: '404', user: req.session.user, active: '/'});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
