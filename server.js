var bGround = require('fcc-express-bground');
var myApp = require('./myApp');
var express = require('express');
var app = express();

var port = process.env.PORT || 3000;
bGround.setupBackgroundApp(app, myApp, __dirname).listen(port, function(){
  bGround.log('Node is listening on port '+ port + '...')
});