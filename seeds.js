'use strict'

const AWS = require('aws-sdk')
AWS.config.region = 'us-east-1'
const dynamodb = new AWS.DynamoDB.DocumentClient()
const chance = require('chance').Chance()

const emails = [
  { 'email': 'andy@mediocre.af', 'name': 'andres', 'lastName': 'mijares' },
  { 'email': 'lele@gmail.com', 'name': 'eleonora', 'lastName': 'lester' }
]

const orders = Array.apply(null, { length: 10 }).map(n => ({
  id: chance.guid(),
  email: emails[Math.random() > 0.5 ? 0 : 1].email,
  comment: chance.sentence(),
  createdAt: chance.timestamp()
}))

let putReqs = orders.map(o => ({
  PutRequest: {
    Item: o
  }
}))

let req = {
  RequestItems: {
    'dev_orders': putReqs
  }
}

let putReqsUsers = emails
  .map(u => {
    u.id = chance.guid()
    return u
  })
  .map(user => ({
    PutRequest: {
      Item: user
    }
  }))

let reqUsers = {
  RequestItems: {
    'dev_users': putReqsUsers
  }
}
dynamodb.batchWrite(req).promise().then(() => console.log('saved orders!')).catch(e => console.log(e.message))
dynamodb.batchWrite(reqUsers).promise().then(() => console.log('saved users!')).catch(e => console.log(e.message))
