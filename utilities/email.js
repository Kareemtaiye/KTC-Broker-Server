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
  EMAIL_PASSWORD_PROD,
  EMAIL_USERNAME_PROD,
} = process.env;
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
        host: 'SendGrid',
        auth: {
          user: EMAIL_USERNAME_PROD,
          pass: EMAIL_PASSWORD_PROD,
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

      await this.mailTransport().sendMail(mailOptions);
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
