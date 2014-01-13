#!/usr/bin/env node

var express = require('express');
var _ = require('lodash');
var commander = require('commander');
var fs = require('fs');

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

var file;
try {
  file = JSON.parse(fs.readFileSync(conf.file, {encoding: 'utf8'}));
} catch (err) {
  console.error('Cannot read expected results file', err);
  process.exit(1);
}
console.log('Expected results', file);

/* Rest services */

var app = express();
var names = {};

app.get('/', function (req, res) {

});

app.get('/status', function (req, res) {
  var result = {};
  var now = new Date().getTime();
  var expNames = _.keys(file);
  _.forEach(expNames, function (expName) {
    var expCount = file[expName];
    result[expName] = 'DOWN;0/' + expCount + 'UP';
    if (names[expName]) {
      var upCount = 0;
      _.forOwn(names[expName], function (date) {
        if (now - date < timeout) upCount++;
      });
      result[expName] = (upCount === expCount) ? 'UP' : ('DOWN;' + upCount + '/' + expCount + 'UP');
    }
  });
  if (conf.debug) console.log('\n', new Date(), 'status asked', names, result);
  res.json(result);
});

app.get('/ping/:id/:name', function (req, res) {
  res.send(200);
  var id = req.params.id;
  var name = req.params.name;
  if (conf.debug) console.log('\n', new Date(), 'ping from id: ' + id + '; name: ' + name);
  if (!names[name]) names[name] = {};
  names[name][id] = new Date().getTime();
});

app.listen(conf.port);
console.log('App running at http://*:' + conf.port);
