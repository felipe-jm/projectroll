const Database = use('Database');
const User = use('App/Models/User');

class UserController {
  async store({ request }) {
    const data = request.only(['username', 'email', 'password']);
    const addresses = request.input('addresses');

    const transaction = await Database.beginTransaction();

    const user = await User.create(data, transaction);
    await user.addresses().createMany(addresses, transaction);

    await transaction.commit();

    return user;
  }
}

module.exports = UserController;
