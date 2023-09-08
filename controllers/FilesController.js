import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

   if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const idUser = new ObjectID(userId);
    const users = dbClient.usersCollection;
    const user = await users.findOne({ _id: idUser });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, data } = req.body;

    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type) return res.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    const files = dbClient.filesCollection;

    if (parentId) {
      const idParent = new ObjectID(parentId);
      const file = await files.findOne({ _id: idParent, userId: user._id });
      if (!file) return res.status(400).json({error: 'Parent not found'});
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      files.insertOne(
       {
         userId: user._id,
	 name,
	 type,
	 parentId,
	 isPublic,
       },
      ).then((result) => res.status(201).json({
        id: result.insertedId,
	userId: user._id,
	name,
	type,
	isPublic,
	parentId,
      })).catch((error) => {
        console.log(error);
      });
    } else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');
      
      try {
        await fs.mkdir(filePath);
	await fs.writeFile(fileName, buff, 'utf-8');
      } catch(error) {
        console.log(error);
      }
      files.insertOne(
        {
	  userId: user._id,
          name,
	  type,
	  isPublic,
	  parentId,
	  localPath: fileName,
	},
      ).then((result) => {
        res.status(201).json(
	  {
	    id: result.insertedId,
	    userId: user._id,
	    name,
	    type,
	    isPublic,
	    parentId,
	  }
	);
	if (type === 'image') {
	  fileQueue.add(
	    {
	      userId: user._id,
	      fileId: result.insertedId,
            },
	  );
	}
      }).catch((error) => console.log(error));
    }
    return null;
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) return res.status(401).json({ error: 'Unauthorized'});

    const idUser = new ObjectID(userId);
    const users = dbClient.userCollection;
    const user = await users.findOne({ _id: IdUser});

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const files = dbClient.filesCollection;
    const idFile = new ObjectID(fileId);

    const file = await files.findOne({ _id: fileId, userId: user._id });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const users = dbClient.usersCollection;
    const user = users.findOne({ _id: userId });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { parentId, page } = req.query;
    const pageNum = page || 0;
    const files = dbClient.filesCollection;
    let query;
    if (!parentId) {
      query = { userId: user._id };
    } else {
      query = {  userId: user._id, parentId: ObjectID(parentId) };
    }
    files.aggregate(
      [
        { $match: query},
	{ $sort: { _id: -1 } },
	{
          $facet: {
            metadata: [{ $count: 'total' }, { $addFields: { page: parseInt(pageNum, 10) } }],
            data: [{ $skip: 20 * parseInt(pageNum, 10) }, { $limit: 20 }],
          },
        },
      ]
    ).toArray((err, result) => {
      if (result) {
        const output = result[0].data.map((file) => {
	  const tmpFile = {
	    ...file,
	    id: file._id,
	  };
	  delete tmpFile._id;
	  delete tmpFile.localPath;
	  return tmpFile;
	});
	return res.status(200).json(output);
      }
//      console.log('Error occurred');
      return res.status(404).json({ error: 'Not found' });
    });
    return null;
  }
}
