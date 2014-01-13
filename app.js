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

var expectedResults;
try {
  expectedResults = JSON.parse(fs.readFileSync(conf.file, {encoding: 'utf8'}));
} catch (err) {
  console.error('Cannot read expected results file', err);
  process.exit(1);
}
console.log('Expected results', expectedResults);

/* Rest services */

var app = express();
app.engine('html', require('ejs').__express);
app.use('/static', express.static(__dirname + '/static'));
app.set('views', './');
var names = {};

app.get('/', function (req, res) {
  var results = computeResults();
  var data = {};
  _.forEach(names, function (containers, name) {
    data[name] = {
      expectedUpCount: expectedResults[name],
      upCount: results[name],
      containers: containers
    }
  });
  if (conf.debug) console.log('\n', new Date(), 'rendering', data);
  res.render('index.html', {
    containers: data,
    now: new Date().getTime(),
    timeout: timeout,
    _: _,
    moment: moment
  });
});

app.get('/statusfull', function (req, res) {
  var results = computeResults();
  var json = {};
  var status = 200;
  _.forEach(_.keys(results), function (name) {
    var up = (results[name] === expectedResults[name]);
    json[name] = up ? 'UP' : 'DOWN;' + results[name] + '/' + expectedResults[name];
    if (!up) status = 500;
  });
  if (conf.debug) console.log('\n', new Date(), 'full status asked', names, json);
  res.json(status, json);
});

app.get('/status', function (req, res) {
  var results = computeResults();
  var json = {};
  var status = 200;
  _.forEach(_.keys(results), function (name) {
    var up = (results[name] >= 1);
    json[name] = up
      ? 'UP;' + results[name] + '/' + expectedResults[name]
      : 'DOWN;' + results[name] + '/' + expectedResults[name];
    if (!up) status = 500;
  });
  if (conf.debug) console.log('\n', new Date(), 'status asked', names, json);
  res.json(status, json);
});

function computeResults() {
  var results = {};
  var now = new Date().getTime();
  _.forEach(_.keys(expectedResults), function (name) {
    results[name] = 0;
    if (names[name]) {
      _.forOwn(names[name], function (data) {
        if (now - data.date < timeout) results[name]++;
      });
    }
  });
  return results;
}

app.get('/ping/:id/:name', function (req, res) {
  res.send(200);
  var id = req.params.id;
  var name = req.params.name;
  if (conf.debug) console.log('\n', new Date(), 'ping from id: ' + id + '; name: ' + name);
  if (!names[name]) names[name] = {};
  names[name][id] = {
    date: new Date().getTime(),
    ip: req.ip
  };
});

app.listen(conf.port);
console.log('App running at http://*:' + conf.port);
