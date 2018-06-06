'use strict'
const co = require('co')
const AWS = require('aws-sdk')
AWS.config.region = 'us-east-1'
const dynamoDB = new AWS.DynamoDB.DocumentClient()
const tableOrders = process.env.tableOrders
const tableUsers = process.env.tableUsers
const chance = require('chance').Chance()

const getUsersPerOder = co.wrap(function * (email) {
  try {
    let ordersParams = {
      TableName: tableOrders,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }
    let userParams = {
      TableName: tableUsers,
      Key: {
        email
      }
    }
    // SCAN is the least ideal... you should try to avoid it
    const [user, orders] = yield [
      dynamoDB.get(userParams).promise(),
      dynamoDB.scan(ordersParams).promise()
    ]

    const userBySchema = Object.assign({}, user.Item, {
      orders: orders.Items
    })

    console.log(userBySchema)
    return userBySchema
  } catch (e) {
    console.log(e.message)
  }
})

const saveOrder = co.wrap(function * ({ email, comment }) {
  try {
    const id = chance.guid()
    const params = {
      TableName: tableOrders,
      Item: {
        email,
        comment,
        id,
        createdAt: Date.now()
      }
    }
    yield dynamoDB.put(params).promise()

    return new Promise(resolve => {
      resolve({ id })
    })
  } catch (e) {
    console.log(e.message)
  }
})

module.exports = {
  getUsersPerOder,
  saveOrder
}
