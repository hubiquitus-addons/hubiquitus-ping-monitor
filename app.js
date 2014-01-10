#!/usr/bin/env node

var express = require('express');
var _ = require('lodash');
var commander = require('commander');

commander
  .version('0.0.1')
  .option('-p, --port [n]', 'HTTP port', parseInt)
  .option('-d, --debug', 'Debug')
  .parse(process.argv);

var conf = {
  port: commander.port || 1337,
  debug: commander.debug || false
};
var app = express();
var names = {};

app.get('/', function (req, res) {

});

app.get('/ping/:id/:name', function (req, res) {
  res.send(200);
  var id = req.params.id;
  var name = req.params.name;
  if (conf.debug) console.log(new Date(), 'ping from id: ' + id + '; name: ' + name);
  if (!names[name]) names[name] = [];
  names[name][id] = new Date();
});

app.listen(conf.port);
console.log('App running at http://*:' + conf.port);
