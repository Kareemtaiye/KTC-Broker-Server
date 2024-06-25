const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

const {
  EMAIL_FROM,
  NODE_ENV,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  EMAIL_HOST,
  EMAIL_PORT,
  APP_EMAIL,
  APP_PASSWORD,
} = process.env;

console.log(APP_EMAIL, APP_PASSWORD);

module.exports = class SendMail {
  constructor(user, url) {
    this.username = user.username;
    this.url = url;
    this.to = user.email;
    this.from = `KTC Broker <${EMAIL_FROM}>`;
  }

  mailTransport() {
    if (NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
          user: APP_EMAIL,
          pass: APP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      auth: {
        user: EMAIL_USERNAME,
        pass: EMAIL_PASSWORD,
      },
      //   debug: true,
      //   logger: true,
    });
  }

  async send(template, subject) {
    try {
      const html = await pug.renderFile(`views/emails/${template}.pug`, {
        username: this.username,
        url: this.url,
        subject,
      });

      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.convert(`${html}`),
      };

      await this.mailTransport().sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log('err', err);
        } else {
          console.log('Sent', info);
        }
      });
    } catch (err) {
      console.log('Sending Error', err);
    }
  }

  verifyEmail() {
    this.send('verifyEmail', 'Email Verification');
  }

  resetPasswordMail() {
    this.send('passwordReset', 'Password Reset');
  }
};
