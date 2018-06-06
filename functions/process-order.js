'use strict'

const region = process.env.region
const queueUrl = process.env.sqs_url

const co = require('co')
const AWS = require('aws-sdk')
const { pipe } = require('ramda')
AWS.config.region = region
const dynamodb = new AWS.DynamoDB.DocumentClient()

const SQS = new AWS.SQS({
  apiVersion: '2012-11-05'
})

const dynamodbTranslator = dynamodb.getTranslator()

const format = dynamodb.service.api.operations.getItem.output.members.Item

const createSQSMessage = data => ({
  MessageBody: JSON.stringify(data),
  QueueUrl: queueUrl
})
const sendSQSMessage = (params) => SQS.sendMessage(params).promise()

const sendMessageToSQS = pipe(
  createSQSMessage,
  sendSQSMessage
)

module.exports.handler = co.wrap(function * (event, context, callback) {
  try {
    const records = event.Records

    for (let record of records) {
      if (record.eventName === 'INSERT') {
        record.dynamodb.NewImage = dynamodbTranslator.translateOutput(record.dynamodb.NewImage, format)
        const order = record.dynamodb.NewImage
        console.log(`putting order ${order.id} into the orders queue`)
        yield sendMessageToSQS(order)
      }
    }
  } catch (e) {
    callback(e)
  }
})
