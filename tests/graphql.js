'use strict'
/* global before, after, describe, it */

const co = require('co')
const expect = require('chai').expect
const axios = require('axios')
const URL = process.env.TEST_ROOT

const { getUsers, getOrders, writeBatchToDynamodb, deleteBatchFromDynamodb } = require('./init/helpers')

const url = `${URL}/graphql`

const query = (email) => `{
  user(email:"${email}") {
    email,
    name,
    lastName,
    id,
    orders {
      id,
      comment,
      createdAt
    }
  }
}`

let users = []
let user = {}
let orders = []
let numberOfOrders = Math.floor(Math.random() * 10) + 1

describe('when we hit the graphql POST / endpoint', (co.wrap(function * () {
  before(co.wrap(function * () {
    try {
      users = getUsers()
      user = users[0]
      orders = getOrders(user.email, numberOfOrders)
      yield writeBatchToDynamodb({data: users, db: 'users'})
      yield writeBatchToDynamodb({data: orders, db: 'orders'})
    } catch (e) {
      console.log(e.message)
    }
  }))

  after(co.wrap(function * () {
    try {
      yield deleteBatchFromDynamodb({data: users, db: 'users', key: 'email'})
      yield deleteBatchFromDynamodb({data: orders, db: 'orders', key: 'id'})
    } catch (e) {
      console.log(e.message)
    }
  }))

  it('should return a proper payload', co.wrap(function * () {
    // Always mandatory
    const { data: { data }, status, headers } = yield axios.post(url, { query: query(user.email) })

    expect(status).to.equal(200)
    expect(headers['content-type']).to.equal('application/json')
    expect(data).to.not.be.null // eslint-disable-line no-unused-expressions
  }))

  it(`should return all the high level properties defined given a valid user`, co.wrap(function * () {
    const { data: { data } } = yield axios.post(url, { query: query(user.email) })

    const { name, lastName, id, orders, email } = data.user
    expect(name).to.not.be.undefined // eslint-disable-line no-unused-expressions
    expect(lastName).to.not.be.undefined // eslint-disable-line no-unused-expressions
    expect(id).to.not.be.undefined// eslint-disable-line no-unused-expressions
    expect(email).to.not.be.undefined// eslint-disable-line no-unused-expressions
    expect(orders).to.not.be.undefined// eslint-disable-line no-unused-expressions
  }))

  it(`should return ${numberOfOrders} orders`, (co.wrap(function * () {
    const { data: { data } } = yield axios.post(url, { query: query(user.email) })
    const { orders } = data.user

    expect(orders.length).to.equal(numberOfOrders)
  })))
})))
