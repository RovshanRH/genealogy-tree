export const typeDefs = `#graphql
    type User {
        id: ID!
        username: String!
        email: String!
        password: String!
        role: Number!
        is_blocked: Boolean!
    },
    type Person {
        id: ID!
        surname: String!
        maiden_surname: String
        first_name: String!


    }
    type Query {
        users: [User!]!
        user(id: ID!): User
    }
    type Mutation {
        createUser(username: String!, email: String!, password: String!, role: String!, is_blocked: Boolean!): User!
    }

`;
