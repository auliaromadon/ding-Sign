const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const session = require('express-session')
const jwt = require('jsonwebtoken')

const app = express()

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

const port = 100;

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: 'ding-sign'
})

const isAuthorized = (request, result, next) => {
    // cek apakah user sudah mengirim header 'x-api-key'
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    // get token dari header
    let token = request.headers['x-api-key']

    // melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    // lanjut ke next request
    next()
}

app.post('/login', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
        db.query('SELECT * FROM customer WHERE username = ? AND password = ?', 
        [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
        response.send('Yuk Daftar di ding-Sign');
		response.end();
	}
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
        response.send('Selamat Datang Customer, ' + request.session.username 
        + '!');
	} else {
		response.send('Mohon login terlebih dahulu!');
	}
	response.end();
});

app.post('/register', (req, res) => {
        let data = req.body
        let sql = `
            insert into customer (nama_lengkap, tanggal_lahir, jenis_kelamin, usia, alamat,email,username,password)
            values ('`+data.nama_lengkap+`','`+data.tanggal_lahir+`','`+data.jenis_kelamin+`',
            '`+data.usia+`','`+data.alamat+`', '`+data.email+`','`+data.username+`','`+data.password+`')`
    
        db.query(sql, (err, result)=>{
            if (err) throw err
            res.json({
                message: 'data customer created',
                data: result
            })
        })
    })


/********** Run Application **********/
app.listen(port, () => {
    console.log('App running on port ' + port)
})