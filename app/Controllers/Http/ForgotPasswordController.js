const crypto = require('crypto');

const User = use('App/Models/User');
const Mail = use('Mail');
const { subDays, isAfter, parseISO } = use('date-fns');

class ForgotPasswordController {
  async store({ request, response }) {
    try {
      const email = request.input('email');
      const user = await User.findByOrFail('email', email);

      user.token = crypto.randomBytes(10).toString('hex');
      user.token_created_at = new Date();

      await user.save();

      await Mail.send(
        ['emails.forgot_password'],
        {
          email,
          token: user.token,
          link: `${request.input('redirect_url')}?token=${user.token}`,
        },
        message => {
          message
            .to(user.email)
            .from('felipemattoseu@gmail.com', 'Felipe Jung')
            .subject('Password Recovering');
        }
      );

      return user;
    } catch (err) {
      return response.status(err.status).send({
        error: { message: 'Something went wrong. This email is valid?' },
      });
    }
  }

  async update({ request, response }) {
    try {
      const { token, password } = request.all();

      const user = await User.findByOrFail('token', token);

      const tokenExpired = isAfter(
        subDays(new Date(), 2),
        parseISO(user.token_created_at)
      );

      if (tokenExpired) {
        return response.status(401).send({
          error: { message: 'Token expired.' },
        });
      }

      user.token = null;
      user.token_created_at = null;
      user.password = password;

      await user.save();

      return user;
    } catch (err) {
      return response.status(err.status).send({
        error: { message: 'Something went wrong.' },
      });
    }
  }
}

module.exports = ForgotPasswordController;
