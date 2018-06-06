'use strict'

const region = process.env.region
const worker = process.env.worker
const queueUrl = process.env.sqs_url
const eventBrokerTrigger = process.env.event_broker_trigger
const jobs = process.env.jobs
const co = require('co')
const AWS = require('aws-sdk')
AWS.config.region = region
const lambda = new AWS.Lambda()
const SQS = new AWS.SQS({ apiVersion: '2012-11-05' })
const cloudwatch = new AWS.CloudWatchEvents()

const moment = require('moment')

const time = moment()
const before = moment('09:59:00', 'hh:mm:ss')
const after = moment('13:00:00', 'hh:mm:ss')

module.exports.handler = co.wrap(function * (event, context, callback) {
  try {
    console.log(`Polling message from ${queueUrl}`)
    let newRule = {
      Name: `${eventBrokerTrigger}`
    }

    // Auto scaling is going to change between 10am and 13pm
    console.log(`check for event rules`)
    if (time.isBetween(before, after)) {
      newRule['ScheduleExpression'] = 'rate(5 minutes)'
      yield cloudwatch.putRule(newRule).promise()
    } else {
      newRule['ScheduleExpression'] = 'rate(1 hour)'
      yield cloudwatch.putRule(newRule).promise()
    }
    console.log(`apply rule`)

    const checkParams = {
      QueueUrl: queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages']
    }
    console.log(`rules changed`)

    const { Attributes } = yield SQS.getQueueAttributes(checkParams).promise()

    const { ApproximateNumberOfMessages } = Attributes

    console.log(`messages in queue ${ApproximateNumberOfMessages}`)

    if (parseInt(ApproximateNumberOfMessages) === 0) return

    let workersRunning = 0
    const workersNeeded = (ApproximateNumberOfMessages <= 2)
      ? 1
      : Math.round(ApproximateNumberOfMessages / jobs)

    console.log(`workers needed aprox [${workersNeeded}]`)

    for (let i = 1; i <= workersNeeded; i++) {
      console.log(`starting ${++workersRunning} worker(s)`)
      yield lambda.invoke({
        FunctionName: worker,
        Payload: JSON.stringify(null)
      }).promise()
    }
  } catch (e) {
    callback(e)
  }
})
