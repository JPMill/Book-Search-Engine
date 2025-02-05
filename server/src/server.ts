import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import typeDefs from './schemas/typeDefs';
import resolvers from './schemas/resolvers';
import authMiddleware from './services/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => authMiddleware({ req }),
});

const startServer = async () => {
  await server.start();
  server.applyMiddleware({ app });

  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost/googlebooks', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('📚 Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}${server.graphqlPath}`);
      });
    })
    .catch((err) => console.error('Database connection error:', err));
};

startServer();
