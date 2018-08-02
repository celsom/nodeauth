# nodeauth
a login and registration system

intructions

npm install
start your mongo db

in nodeauth/routes/user.js change the details

function(token, user, done) {
      var smtpTransport = nodemailer.createTransport( {
        service: 'Gmail',
        auth: {
          user: 'xxxxxxxx@gmail.com',
          pass: '!!!put your password here!!!'    
        // password is not correct put your own details

        }


