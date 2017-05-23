/* eslint-env mocha */

'use strict'

const assert = require('assert')
const spawn = require('child_process').spawn
const path = require('path')

const parallel = require('async/parallel')
const Base = require('grenache-nodejs-base')
const Peer = require('./../lib/PeerRPCClient')

let rpc, grape
describe('RPC integration', () => {
  before(function (done) {
    this.timeout(5000)
    grape = spawn(path.join(__dirname, 'boot-grape.sh'))
    setTimeout(() => {
      rpc = spawn(path.join(__dirname, 'boot-rpc-server.sh'))
      done()
    }, 2000)
  })

  after((done) => {
    rpc.on('exit', done)

    grape.on('exit', () => {
      rpc.kill()
    })
    grape.kill()
  })

  it('should be an instance of Events', (done) => {
    const link = new Base.Link({
      grape: 'ws://127.0.0.1:30001'
    })
    link.start()

    const peer = new Peer(link, {})
    peer.init()

    const reqs = 5
    const tasks = []

    function createTask () {
      return function task (cb) {
        peer.map('rpc_test', 'hello', { timeout: 10000 }, (err, data) => {
          cb(err, data)
        })
      }
    }

    for (let i = 0; i < reqs; i++) {
      tasks.push(createTask())
    }

    setTimeout(() => {
      parallel(tasks, (err, data) => {
        if (err) throw err
        assert.equal(data[0][0], 'world')
        assert.equal(data.length, 5)
        done()
      })
    }, 2000)
  }).timeout(15000)
})
