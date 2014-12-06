$(document).ready(function() {

  // subject to listen to pause/unpause clicks
  var pauser = new Rx.Subject();

  // Set up the controls.
  var Controls = function() {
    var paused = true;
    this.pauseDisplay = function() {
      console.log('pausing');
      pauser.onNext(paused);
      paused = !paused;
    };
  };
  var c = new Controls();
  var gui = new dat.GUI();
  gui.add(c, 'pauseDisplay');

  // create an Rx observable from myo.on('imu') triggers
  var raw = Rx.Observable.empty();
  var scheduler = null;

  if ($.QueryString["file"]) {
    console.log('reading from file: ' + $.QueryString["file"]);

    var rows = $.getDataFromFile($.QueryString["file"]);
    var data = rows.map(function(row) {
      return {
        'timestamp': +row[0],
        'value': {
          'accelerometer': { 'x': +row[1], 'y': +row[2], 'z': +row[3] },
          'gyroscope':     { 'x': +row[4], 'y': +row[5], 'z': +row[6] },
          'orientation':   { 'w': +row[7], 'x': +row[8], 'y': +row[9], 'z': +row[10] }
        }
      };
    });

    raw = Rx.Observable.delayEach(data, 20)
      .pausable(pauser)
      // .do(function(x) { console.log('raw: ' + x.timestamp + ' ' + x.value.accelerometer.x); })
      .share();

  } else {

    raw = Rx.Observable.create(function (observer) {
      Myo.create().on('imu', observer.onNext.bind(observer));
      return Rx.Disposable.create();
    })
    .sample(100)
    .timestamp() // add a timestamp to each element of the sequence
    .pausable(pauser) // attach it to the pauser Subject
    .share()
    ;
  }

  var adjusted = raw
    .map(function(d) {
      var current_o = d.value.orientation;
      var current_q = (new THREE.Quaternion(current_o.x, current_o.y, current_o.z, current_o.w)).normalize();

      var current_accel = d.value.accelerometer;
      var current_v = (new THREE.Vector3(current_accel.x, current_accel.y, current_accel.z));

      var gravity = new THREE.Vector3(0,0,1.05);
      current_v.applyQuaternion( current_q );
      current_v.sub( gravity );

      return {
        'timestamp': d.timestamp,
        'value': {
          'accelerometer': {
            'x': current_v.x,
            'y': current_v.y,
            'z': current_v.z
          },
          'gyroscope': d.value.gyroscope,
          'orientation': d.value.orientation
        }
      }
    })
    // .do(function(x) { console.log('adjusted: ' + x.timestamp + ' ' + x.value.accelerometer.x); })
    .share()
    ;

  var velo = adjusted.zip(adjusted.skip(1), function(s1, s2) {
      return { previous: s1, current: s2 };
    })
    .map(function(d) {
      return {
        'timestamp': d.current.timestamp,
        'value': {
          'velocity': {
            'x': (d.current.timestamp - d.previous.timestamp) / 1000 * (d.current.value.accelerometer.x * 9.81),
            'y': (d.current.timestamp - d.previous.timestamp) / 1000 * (d.current.value.accelerometer.y * 9.81),
            'z': (d.current.timestamp - d.previous.timestamp) / 1000 * (d.current.value.accelerometer.z * 9.81)
          },
          'accelerometer': d.current.value.accelerometer,
          'gyroscope': d.current.value.gyroscope,
          'orientation': d.current.value.orientation
        }
      }
    })
    .scan(function(acc, d) {
      if (d.value.gyroscope.x === 0 &&
          d.value.gyroscope.y === 0 &&
          d.value.gyroscope.z === 0) {
        console.log('resetting velocity');
        return {
          'timestamp': d.timestamp,
          'value': {
            'velocity': {
              'x': 0,
              'y': 0,
              'z': 0
            },
            'accelerometer': d.value.accelerometer,
            'gyroscope': d.value.gyroscope,
            'orientation': d.value.orientation
          }
        };
      }
      // else
      return {
        'timestamp': d.timestamp,
        'value': {
          'velocity': {
            'x': acc.value.velocity.x + d.value.velocity.x,
            'y': acc.value.velocity.y + d.value.velocity.y,
            'z': acc.value.velocity.z + d.value.velocity.z
          },
          'accelerometer': d.value.accelerometer,
          'gyroscope': d.value.gyroscope,
          'orientation': d.value.orientation
        }
      };
    })
    // .do(function(x) { console.log('velocity: ' + x.timestamp + ' ' + x.value.velocity.x); })
    .share()
    ;

  var position = velo.zip(velo.skip(1), function(s1, s2) {
      return { previous: s1, current: s2 };
    })
    .map(function(d) {
      return {
        'timestamp': d.current.timestamp,
        'value': {
          'position': {
            'x': (d.current.timestamp - d.previous.timestamp) / 1000 * (d.current.value.velocity.x),
            'y': (d.current.timestamp - d.previous.timestamp) / 1000 * (d.current.value.velocity.y),
            'z': (d.current.timestamp - d.previous.timestamp) / 1000 * (d.current.value.velocity.z)
          },
          'velocity': d.current.value.velocity,
          'accelerometer': d.current.value.accelerometer,
          'gyroscope': d.current.value.gyroscope,
          'orientation': d.current.value.orientation
        }
      }
    })
    .scan(function(acc, d) {
      return {
        'timestamp': d.timestamp,
        'value': {
          'position': {
            'x': acc.value.position.x + d.value.position.x,
            'y': acc.value.position.y + d.value.position.y,
            'z': acc.value.position.z + d.value.position.z
          },
          'velocity': d.value.velocity,
          'accelerometer': d.value.accelerometer,
          'gyroscope': d.value.gyroscope,
          'orientation': d.value.orientation
        }
      };
    })
    // .do(function(x) { console.log('position: ' + x.timestamp + ' ' + x.value.position.x); })
    .share()
    ;

  var accel_fields = [
    { title: 'X', accessor: 'value.accelerometer.x' },
    { title: 'Y', accessor: 'value.accelerometer.y' },
    { title: 'Z', accessor: 'value.accelerometer.z' }
  ];

  var velo_fields = [
    { title: 'X', accessor: 'value.velocity.x' },
    { title: 'Y', accessor: 'value.velocity.y' },
    { title: 'Z', accessor: 'value.velocity.z' },
  ];

  var position_fields = [
    { title: 'X', accessor: 'value.position.x' },
    { title: 'Y', accessor: 'value.position.y' },
    { title: 'Z', accessor: 'value.position.z' },
  ];

  var gyro_fields = [
    { title: 'X', accessor: 'value.gyroscope.x' },
    { title: 'Y', accessor: 'value.gyroscope.y' },
    { title: 'Z', accessor: 'value.gyroscope.z' },
  ];

  React.render(<LineGraphSet observable={raw} title='Accelerometer' fields={accel_fields} />, document.getElementById('accel_content'));
  React.render(<LineGraphSet observable={adjusted} title='Adjusted for G' fields={accel_fields} />, document.getElementById('adjust_content'));
  React.render(<LineGraphSet observable={smoothed} title='Gyroscope' fields={gyro_fields} />, document.getElementById('gyro_content'));
  React.render(<LineGraphSet observable={velo} title='Velocity' fields={velo_fields} />, document.getElementById('velo_content'));
  React.render(<LineGraphSet observable={position} title='Position' fields={position_fields} />, document.getElementById('position_content'));

});


// === smoothing ===
//
// var smoothed = adjusted
//   .windowWithCount(5, 1)
//   .selectMany(function(x) { return x.toArray(); })
//   .select(function(d) {
//     return {
//       'timestamp': d[d.length-1].timestamp,
//       'value': {
//         'accelerometer': {
//           'x': R.sum(R.pluck('x', R.pluck('accelerometer', R.pluck('value', d)))) / d.length,
//           'y': R.sum(R.pluck('y', R.pluck('accelerometer', R.pluck('value', d)))) / d.length,
//           'z': R.sum(R.pluck('z', R.pluck('accelerometer', R.pluck('value', d)))) / d.length
//         },
//         'gyroscope': {
//           'x': R.sum(R.pluck('x', R.pluck('gyroscope', R.pluck('value', d)))) / d.length,
//           'y': R.sum(R.pluck('y', R.pluck('gyroscope', R.pluck('value', d)))) / d.length,
//           'z': R.sum(R.pluck('z', R.pluck('gyroscope', R.pluck('value', d)))) / d.length
//         },
//         'orientation': {
//           'w': R.sum(R.pluck('w', R.pluck('orientation', R.pluck('value', d)))) / d.length,
//           'x': R.sum(R.pluck('x', R.pluck('orientation', R.pluck('value', d)))) / d.length,
//           'y': R.sum(R.pluck('y', R.pluck('orientation', R.pluck('value', d)))) / d.length,
//           'z': R.sum(R.pluck('z', R.pluck('orientation', R.pluck('value', d)))) / d.length
//         }
//       }
//     };
//   })
//   // .do(function(x) { console.log('smoothed: ' + x.timestamp + ' ' + x.value.accelerometer.x); })
//   .share()
//   ;
// React.render(<LineGraphSet observable={smoothed} title='Smoothed' fields={accel_fields} />, document.getElementById('smooth_content'));


// === schedule messages in "real" time ===
//
// scheduler = new Rx.HistoricalScheduler(new Date(data[0].timestamp));
// raw = Rx.Observable.create(function(observer) {
//   data.forEach(function(row) {
//     scheduler.scheduleAbsolute(row.timestamp, observer.onNext.bind(observer));
//   });
//   return Rx.Disposable.create();
// })
// .do(function(x) { console.log(x); })
// .pausable(pauser);
//
// scheduler.start();
