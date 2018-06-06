'use strict'

const {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString
} = require('graphql')

const { saveOrder } = require('./helpers')

// `
// mutation ($order: OrderInputType!) {
//   createOrder(order: $order) {
//     id
//   }
// }
// `

const OrderInputType = new GraphQLInputObjectType({
  name: 'OrderInputType',
  fields: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    comment: { type: new GraphQLNonNull(GraphQLString) }
  }
})

const OrderType = new GraphQLObjectType({
  name: 'OrderType',
  fields: {
    id: { type: GraphQLString }
  }
})

const createOrder = {
  type: OrderType,
  args: {
    order: {
      type: new GraphQLNonNull(OrderInputType)
    }
  },
  resolve: (obj, { order }) => {
    return saveOrder(order)
  }
}

const RootMutationType = new GraphQLObjectType({
  name: 'RootMutationType',
  fields: () => ({
    createOrder: createOrder
  })
})

module.exports = {
  RootMutationType
}
