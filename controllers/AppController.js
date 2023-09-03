import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * AppController class
   */

  static getStatus(_, res) {
    /**
     * getStatus function
     */
    const states = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).send(states);
  }

  static async getStats(_, res) {
    /**
     * getStats function
     */
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    res.status(200).send(stats);
  }
}

export default AppController;
