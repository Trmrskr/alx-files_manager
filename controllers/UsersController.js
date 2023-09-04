import sha1 from 'sha1';
import dbClient from '../utils/db';

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });
    const user = await dbClient.usersCollection.findOne({ email });
    if (user) {
      return res.status(400).send({ error: 'Already exist' });
    }
    const hashedPassword = sha1(password);
    const newUser = await dbClient.usersCollection.insertOne({ email, password: hashedPassword });

    const userId = newUser.insertedId.toString();

    return res.status(201).json({ email, id: userId });
  }
}

export default UserController;
