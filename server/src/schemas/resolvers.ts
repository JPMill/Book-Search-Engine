import { AuthenticationError } from 'apollo-server-express';
import { Request } from 'express'; 
import User from '../models/User';
import { signToken } from '../services/auth';

const resolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: { req: Request }) => {
      if (context.req.user) {
        return await User.findById(context.req.user._id).populate('savedBooks');
      }
      throw new AuthenticationError('Not authenticated');
    },
  },
  Mutation: {
    login: async (_parent: unknown, { email, password }: { email: string; password: string }) => {
      const user = await User.findOne({ email });
      if (!user || !(await user.isCorrectPassword(password))) {
        throw new AuthenticationError('Incorrect credentials');
      }
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    addUser: async (
      _parent: unknown,
      { username, email, password }: { username: string; email: string; password: string }
    ) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user.username, user.email, user._id); 
      return { token, user };
    },
    saveBook: async (_parent: unknown, bookData: any, context: { req: Request }) => {
      if (!context.req.user) throw new AuthenticationError('Not authenticated');
      return await User.findByIdAndUpdate(
        context.req.user._id,
        { $push: { savedBooks: bookData } },
        { new: true }
      );
    },
    removeBook: async (_parent: unknown, { bookId }: { bookId: string }, context: { req: Request }) => {
      if (!context.req.user) throw new AuthenticationError('Not authenticated');
      return await User.findByIdAndUpdate(
        context.req.user._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
    },
  },
};

export default resolvers;