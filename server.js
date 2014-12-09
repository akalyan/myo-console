// Module Dependencies
var express = require('express'),
  app = express();
  http = require('http'),
  path = require('path'),
  fs = require("fs"),
  _ = require('lodash'),
  dir  = require('node-dir');

module.exports = function(conf){

  var conf = _.extend({
    dir : path.join(__dirname, 'app'),
    output: path.join(__dirname, 'output'),
    port : 8080
  },conf);

  app.use(require('connect-livereload')());
  app.use(express.static(conf.dir));
  app.use('/output', express.static(conf.output));
  app.set("views", conf.dir)
  app.engine('jade', require('jade').__express);

  app.get("/", function(req, res, next) {
    res.render("index.jade");
  });

  app.get("/calibration", function(req, res, next) {
    res.render("calibration.jade");
  });

  app.get("/playground", function(req, res, next) {
    res.render("playground.jade");
  });

  app.get("/three-d", function(req, res, next) {
    res.render("three-d.jade");
  });

  var relative_dirs = function(curr) {
    return path.relative(conf.dir, curr);
  };

  var excluded_folders = function(val) {
    return !val.match("bower_components");
  };

  app.listen(conf.port);
  console.log("Server started in http://localhost:" + conf.port);
}
