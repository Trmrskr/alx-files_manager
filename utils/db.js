import mongodb from 'mongodb';
/**
 * MongoDB client module
 */
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const dbUrl = `mongodb://${host}:${port}/${database}`;

class DBClient {
  constructor() {
    this.client = new mongodb.MongoClient(dbUrl, { useUnifiedTopology: true });
    this.client.connect();
    this.usersCollection = this.client.db().collection('users');
    this.filesCollection = this.client.db().collection('files');
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.usersCollection.countDocuments();
  }
 
  async nbFiles() {
    return this.filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
