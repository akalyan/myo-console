var Myo = require('./lib/myo.js');
var stream = require('stream');
var util = require('util');
var fs = require('fs');

util.inherits(ImuStream, stream.Readable);
function ImuStream(options) {
  stream.Readable.call(this, options);
  this._readableState.objectMode = false;

  this._myo = Myo.create();
  var self = this;
  this._paused = true;

  this._myo.on('imu', function(data) {
    if (!self._paused) {
      var to_push = "";
      to_push += Date.now() + ',';
      to_push += data.accelerometer.x + ',';
      to_push += data.accelerometer.y + ',';
      to_push += data.accelerometer.z + ',';
      to_push += data.gyroscope.x + ',';
      to_push += data.gyroscope.y + ',';
      to_push += data.gyroscope.z + ',';
      to_push += data.orientation.w + ',';
      to_push += data.orientation.x + ',';
      to_push += data.orientation.y + ',';
      to_push += data.orientation.z;
      if (!self.push(to_push + "\n"))
        self._paused = true;
    }
  });
};
ImuStream.prototype._read = function(obj, encoding, cb){
  this._paused = false;
};

var imuStream = new ImuStream();
imuStream.pipe(fs.createWriteStream('./output-' + Date.now() + '.csv'));
