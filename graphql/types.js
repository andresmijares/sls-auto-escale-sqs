'use strict'

const {
  GraphQLObjectType,
  GraphQLList,
  GraphQLID,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt
} = require('graphql')

const Order = new GraphQLObjectType({
  name: 'Order',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    createdAt: { type: GraphQLInt },
    comment: { type: GraphQLString }
  }
})

const User = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLID },
    email: { type: GraphQLString },
    name: { type: GraphQLString },
    lastName: { type: GraphQLString },
    orders: { type: new GraphQLList(Order) }
  }
})

module.exports = {
  User
}
