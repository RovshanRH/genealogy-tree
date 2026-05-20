export const resolvers = {
    Query: {
        users: async (_parent:unknown, args: unknown, context: any) => {
            return context.db.findUsers();
        },
        user: async (_parent: unknown, args: { id: number }, context: any) => {
            return context.db.findUserByID(args.id);
        }
    },
    Mutation: {
        createUser: async (_parent: unknown, args: { username: String, email: String, password: String, role: Number, is_blocked: Boolean }, context: any) => {
            context.db.createUser(args.username, args.email, args.password, args.role, args.is_blocked);
        }
    }
}