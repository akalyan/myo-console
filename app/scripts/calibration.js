$(document).ready(function() {


  // Set up the controls
  var gui = new dat.GUI();
  var Controls = function() {
    this.running = false;
    this.collectSample = function() {
      if (!this.running) {
        this.running = true;
        var self = this;

        // create the Rx observable from myo.on('imu') triggers
        MyoRx.createImuObservableFromMyo(Myo.create())
          .do(function(x) { console.log(x); })
          .windowWithTime(4000)
          .take(1)
          .subscribe(function(child) {
            child.toArray().subscribe(function(d) {
              var datum = {
                'accelerometer': {
                  'x': R.sum(R.pluck('x', R.pluck('accelerometer', R.pluck('value', d)))) / d.length,
                  'y': R.sum(R.pluck('y', R.pluck('accelerometer', R.pluck('value', d)))) / d.length,
                  'z': R.sum(R.pluck('z', R.pluck('accelerometer', R.pluck('value', d)))) / d.length
                },
                'gyroscope': {
                  'x': R.sum(R.pluck('x', R.pluck('gyroscope', R.pluck('value', d)))) / d.length,
                  'y': R.sum(R.pluck('y', R.pluck('gyroscope', R.pluck('value', d)))) / d.length,
                  'z': R.sum(R.pluck('z', R.pluck('gyroscope', R.pluck('value', d)))) / d.length
                },
                'orientation': {
                  'w': R.sum(R.pluck('w', R.pluck('orientation', R.pluck('value', d)))) / d.length,
                  'x': R.sum(R.pluck('x', R.pluck('orientation', R.pluck('value', d)))) / d.length,
                  'y': R.sum(R.pluck('y', R.pluck('orientation', R.pluck('value', d)))) / d.length,
                  'z': R.sum(R.pluck('z', R.pluck('orientation', R.pluck('value', d)))) / d.length
                }
              };
              $('#content').html( $('#content').html() +
                datum.accelerometer.x + ',' +
                datum.accelerometer.y + ',' +
                datum.accelerometer.z +
                // ' | ' +
                // datum.gyroscope.x + ',' +
                // datum.gyroscope.y + ',' +
                // datum.gyroscope.z +
                // ' | ' +
                // datum.orientation.w + ',' +
                // datum.orientation.x + ',' +
                // datum.orientation.y + ',' +
                // datum.orientation.z +
                "\n" );
              self.running = false;
            })
          });

      }
    };
  };
  var c = new Controls();
  gui.add(c, 'collectSample');

});
