import express, { Request, Response } from 'express';
import { ApolloServer } from '@apollo/server';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import typeDefs from './schemas/typeDefs';
import resolvers from './schemas/resolvers';
import { expressMiddleware } from '@apollo/server/express4';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// MongoDB connection
const db = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string, {});
    console.log('MongoDB connected!');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
};

// Apollo Server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start Apollo Server
const startApolloServer = async () => {
  await server.start();
  await db();

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }: { req: Request }) => {
      const user = req.user || { _id: 'user_id', username: 'user_name' }; 
      return { req, user };
    },
  }));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();
