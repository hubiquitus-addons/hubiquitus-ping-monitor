#!/usr/bin/env node

var express = require('express');
var _ = require('lodash');
var commander = require('commander');
var fs = require('fs');
var moment = require('moment');

const timeout = 60000;

/* Configuration */

commander
  .version('0.0.1')
  .option('-p, --port [n]', 'HTTP port', parseInt)
  .option('-d, --debug', 'Debug')
  .option('-f, --file <p>', 'File containing expected results')
  .parse(process.argv);

var conf = {
  port: commander.port || 1337,
  debug: commander.debug || false,
  file: commander.file
};
console.log('Using configuration', conf);

var expectedContainerTypes;
try {
  expectedContainerTypes = JSON.parse(fs.readFileSync(conf.file, {encoding: 'utf8'}));
} catch (err) {
  console.error('Cannot read expected results file', err);
  process.exit(1);
}
console.log('Expected results', expectedContainerTypes);

var containerTypes = {};
for (var name in expectedContainerTypes) {
  registerName(name);
}

/* Rest services */

var app = express();
app.engine('html', require('ejs').__express);
app.use('/static', express.static(__dirname + '/static'));
app.set('views', __dirname);

app.get('/', function (req, res) {
  computeResults();
  var data = {};
  if (conf.debug) console.log('\n', new Date(), 'rendering', data);
  res.render('index.html', {
    containerTypes: containerTypes,
    now: Date.now(),
    timeout: timeout,
    _: _,
    moment: moment
  });
});

app.get('/statusfull', function (req, res) {
  computeResults();
  var json = {};
  var status = 200;
  _.forEach(containerTypes, function (containerType, name) {
    var up = (containerType.upCount >= containerType.expectedUpCount);
    json[name] = up
      ? 'UP;' + containerType.upCount + '/' + containerType.expectedUpCount
      : 'DOWN;' + containerType.upCount + '/' + containerType.expectedUpCount;
    if (!up) status = 500;
  });
  if (conf.debug) console.log('\n', new Date(), 'full status asked', containerTypes, json);
  res.json(status, json);
});

app.get('/status', function (req, res) {
  computeResults();
  var json = {};
  var status = 200;
  _.forEach(containerTypes, function (containerType, name) {
    var up = (containerType.upCount >= 1);
    json[name] = up
      ? 'UP;' + containerType.upCount + '/' + containerType.expectedUpCount
      : 'DOWN;' + containerType.upCount + '/' + containerType.expectedUpCount;
    if (!up) status = 500;
  });
  if (conf.debug) console.log('\n', new Date(), 'status asked', containerTypes, json);
  res.json(status, json);
});

app.get('/ping/:id/:name', function (req, res) {
  res.send(200);
  var id = req.params.id;
  var name = req.params.name;
  if (conf.debug) console.log('\n', new Date(), 'ping from id: ' + id + '; name: ' + name);
  registerName(name);
  containerTypes[name].containers[id] = {
    date: Date.now(),
    ip: req.ip,
    up: true
  };
});

app.listen(conf.port);
console.log('App running at http://*:' + conf.port);

/* Functions */

function computeResults() {
  var now = Date.now();
  _.forEach(containerTypes, function (containerType) {
    containerType.upCount = 0;
    _.forEach(containerType.containers, function (container) {
      if (now - container.date < timeout) {
        container.up = true;
        containerType.upCount++;
      } else {
        container.up = false;
      }
    });
  });
}

function registerName(name) {
  if (!containerTypes[name]) {
    containerTypes[name] = {
      expectedUpCount: expectedContainerTypes[name] || 0,
      containers: {},
      upCount: 0
    }
  }
}
