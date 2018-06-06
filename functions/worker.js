'use strict'

const region = process.env.region
const queueUrl = process.env.sqs_url
const tableOrders = process.env.table_orders

const co = require('co')
const AWS = require('aws-sdk')
AWS.config.region = region
const SQS = new AWS.SQS({
  apiVersion: '2012-11-05'
})
const dynamodb = new AWS.DynamoDB.DocumentClient()
const { pipe, isNil } = require('ramda')

const createSQSParams = (QueueUrl, MaxNumberOfMessages = 10) => ({
  QueueUrl,
  MaxNumberOfMessages
})

const getMessageFromQueue = (data) => SQS.receiveMessage(data).promise()

const getMessageFromOrdersQueue = pipe(
  createSQSParams,
  getMessageFromQueue
)

module.exports.handler = co.wrap(function * (event, context, callback) {
  try {
    console.log(`start polling from ${queueUrl}`)

    const queue = yield getMessageFromOrdersQueue(queueUrl)
    let orders = []
    if (isNil(queue.Messages)) {
      console.log(`no messages to process at ${Date.now()}`)
      return
    }

    for (let message of queue.Messages) {
      let order = JSON.parse(message.Body)
      let ReceiptHandle = message.ReceiptHandle
      order.completedAt = Date.now()
      order.updatedAt = Date.now()
      order.status = 'completed'
      orders = orders.concat([{order, ReceiptHandle}])
    }

    for (let {order, ReceiptHandle} of orders) {
      console.log(`updating db records`)
      const params = {
        TableName: tableOrders,
        Item: Object.assign({}, order)
      }
      yield dynamodb.put(params).promise()

      console.log(`deleting order ${order.id} from the orders queue`)

      yield SQS.deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: ReceiptHandle
      })
        .promise()
        .then(data => console.log('data', data))
        .catch(e => console.log('e', e))

      console.log(`order ${order.id} updated successfully`)
    }
  } catch (e) {
    callback(e)
  }
})
