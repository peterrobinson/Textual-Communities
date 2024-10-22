var nodemailer = require('nodemailer');

/*
let transporter = nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
});
*/

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "7e39dc001@smtp-brevo.com",
    pass: "0KEdmZM1RnQxyOU4",
  },
});

let mailer={};
mailer.localmailer = transporter;
mailer.addresses = {
	from: 'peter@sd-editions.com',
	replyto: 'peter@sd-editions.com'
};

module.exports = mailer;


 
