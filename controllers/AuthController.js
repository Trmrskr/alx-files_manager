import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization') || '';
    if (!auth) return res.status(401).send({ error: 'Unauthorized' });

    const credentials = auth.split(' ')[1];

    const decodedCredentials = Buffer.from(credentials, 'base64').toString('utf-8');
    const [email, password] = decodedCredentials.split(':');

    if (!email || !password) return res.status(401).send({ error: 'Unauthorized' });

    const hashedPassword = sha1(password);
    const users = dbClient.usersCollection;
    const user = await users.findOne({ email, password: hashedPassword });
    if (!user) res.status(401).json({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    const duration = 24 * 3600;

    await redisClient.set(key, user._id.toString(), duration);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const sessionExists = await redisClient.get(key);

    if (!sessionExists) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(key);
    return res.status(204).json({});
  }
}
