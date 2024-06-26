const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


const maxAge =3 * 60 * 60;
const createToken = ( email ) => {
    return jwt.sign({ email }, 'secret', {
        expiresIn: maxAge
    } );
}


const register = (db) => async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if email is already in use
        const emailCheckResults = await new Promise((resolve, reject) => {
            db.query("SELECT email FROM users WHERE email = ?", [email], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if (emailCheckResults.length > 0) {
            return res.status(200).json('Email already in use');
        }

        // Hash the password
        const hashedPassword = bcrypt.hashSync(password, 8);

        // Insert new user into the database
        const insertUserResults = await new Promise((resolve, reject) => {
            db.query("INSERT INTO users SET ?", { username: username, email: email, password: hashedPassword }, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        // Generate a token
        const token = createToken(email);

        // Set the JWT cookie and send success response
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000,secure: true, sameSite: 'none' });
        res.status(201).json('Registered successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).json('Internal Server Error');
    }
};

const login = (db) => async (req, res) => {
    const {email, password} = req.body;
    db.query('SELECT password FROM users WHERE users.email = ?',[email], async (err, results) => {
        if(err) {
            console.error(err);
        }
        else if(results.length == 0){
            return res.send('Failed to log in');
        }
        else{
            bcrypt.compare(password, results[0].password, function(error, response) {
                if(response){
                    const token = createToken(email);
                    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000,secure: true, sameSite: 'none' });
                    res.status(201).json('Logged in');
                }
                else{
                    return res.send('Failed to log in :(');
                }
            });
        }
    })
}

const logout = (req, res) => { 
    res.cookie('jwt', '', { maxAge: 1, httpOnly: true,secure: true, sameSite: 'none' });
    res.status(200).json('Logged out');
}

const getUser = (db) => async (req, res) => {
   const email = res.locals.user;
    db.query('SELECT username FROM users WHERE users.email = ?',[email], async (err, results) => {
         if(err) {
              console.error(err);
         }
         else if(results.length == 0){
              return res.send('');
         }
         else{
              res.status(200).json(results[0].username);
         }
    })
}

const getUserId = (db) => async (req, res) => {
    const email = res.locals.user;
     db.query('SELECT id FROM users WHERE users.email = ?',[email], async (err, results) => {
          if(err) {
               console.error(err);
          }
          else if(results.length == 0){
               return res.send('');
          }
          else{
               res.status(200).json(results[0].id);
          }
     })
 }

const getUserDetails = (db) => async (req, res) => {
    const email = res.locals.user;
     db.query('SELECT username, email, name, surname FROM users WHERE users.email = ?',[email], async (err, results) => {
          if(err) {
               console.error(err);
          }
          else if(results.length == 0){
               return res.send('');            
          }
          else{
               res.status(200).json(results[0]);
          }
     })
 }

module.exports = { register, login, logout, getUser, getUserDetails,getUserId }