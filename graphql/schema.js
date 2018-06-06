'use strict'

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString
} = require('graphql')

const { getUsersPerOder } = require('./helpers')
const { User } = require('./types')
const { RootMutationType } = require('./mutations')

const Root = new GraphQLObjectType({
  name: 'Root',
  fields: {
    user: {
      type: User,
      args: {
        email: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: (_, { email }, __) => {
        return getUsersPerOder(email)
      }
    }
  }
})

const schema = new GraphQLSchema({
  query: Root,
  mutation: RootMutationType
})

module.exports = {
  schema
}
