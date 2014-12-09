$(document).ready(function() {

  /*
   * Set up the scene.
   */
  var init = function() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 1000 );
    camera.position.z = 5;
    camera.position.y = 5;
    camera.position.x = 5;
    scene.add( camera );

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColorHex( 0xffffff, 1 );
    document.body.appendChild( renderer.domElement );

    var controls = new THREE.OrbitControls( camera );

    // initialize the coordinate system
    var arrowX = new THREE.ArrowHelper(new THREE.Vector3( 1, 0, 0 ), new THREE.Vector3( 0, 0, 0 ), 2, 0x880000);
    var arrowY = new THREE.ArrowHelper(new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( 0, 0, 0 ), 2, 0x008800);
    var arrowZ = new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 0, 0 ), 2, 0x000088);
    scene.add( arrowX );
    scene.add( arrowY );
    scene.add( arrowZ );

    function render() {
      requestAnimationFrame( render );
      renderer.render( scene, camera );
    }
    render();

    return scene;
  };

  var scene = init();

  // subject to listen to pause/unpause clicks
  var pauser = new Rx.Subject();

  // global myo for orientation manipulation
  var myo = null;

  // Set up the controls
  var gui = new dat.GUI();
  var Controls = function() {
    var paused = true;
    this.pauseDisplay = function() {
      console.log('pausing');
      pauser.onNext(paused);
      paused = !paused;
    };
    this.zeroOrientation = function() {
      if (myo) {
        console.log('zeroing orientation');
        console.log('-- lastQuant: ' +
                      myo.orientationOffset.x + ',' +
                      myo.orientationOffset.y + ',' +
                      myo.orientationOffset.z + ',' +
                      myo.orientationOffset.w);
        myo.zeroOrientation();
        console.log('-- lastQuant: ' +
                      myo.orientationOffset.x + ',' +
                      myo.orientationOffset.y + ',' +
                      myo.orientationOffset.z + ',' +
                      myo.orientationOffset.w);
      }
    };
    this.gravity = 1000.0;
    this.gravityTrim = function() {
      var self = this;
      if (raw) {
        console.log('gonna set the gravity');
        raw
          .map(function(d) {
            var current_accel = d.value.accelerometer;
            var current_v = (new THREE.Vector3(current_accel.x, current_accel.y, current_accel.z));
            return { 'len': current_v.length() };
          })
          // .do(function(x) { console.log('length: ' + x.len); })
          .take(100)
          .pluck('len')
          .average()
          .do(function(x) { console.log('average: ' + x); })
          .subscribe(function(x) {
            self.gravity = x * 1000.0;
            // Iterate over all controllers
            for (var i in gui.__controllers) {
              gui.__controllers[i].updateDisplay();
            }
          });
      }
    };
    this.printQuaternion = function() {
      console.log('-- global quat: ' +
                    globalQuat.x + ',' +
                    globalQuat.y + ',' +
                    globalQuat.z + ',' +
                    globalQuat.w);
    };
  };
  var c = new Controls();
  gui.add(c, 'pauseDisplay');
  gui.add(c, 'zeroOrientation');
  gui.add(c, 'gravity').min(900).max(1100).step(5); //.onFinishChange(function(v) { alert(v); });
  gui.add(c, 'gravityTrim');
  gui.add(c, 'printQuaternion');

  // create an empty Rx observable from myo.on('imu') triggers
  var raw = Rx.Observable.empty();

  // populate raw based on querystring
  if ($.QueryString["file"]) {
    console.log('reading from file: ' + $.QueryString["file"]);
    raw = MyoRx.createImuObservableFromFile($.QueryString["file"], pauser);
  } else {
    myo = Myo.create();
    raw = MyoRx.createImuObservableFromMyo(myo, pauser);
  }

  var position = MyoRx.getPositionFromImuObservable(raw, c.gravity / 1000.0);

  var device = {
    x: null,
    y: null,
    z: null
  };

  var globalQuat = { 'x': -1, 'y': -1, 'z': -1, 'w': -1 };

  position.subscribe(
    function(data) {

      globalQuat = data.value.orientation;

      // remove the device from the scene
      scene.remove(device.x);
      scene.remove(device.y);
      scene.remove(device.z);

      // formulate non-rotated three-axis representation of device
      var xOrientation = new THREE.Vector3( 1, 0, 0 );
      var yOrientation = new THREE.Vector3( 0, 1, 0 );
      var zOrientation = new THREE.Vector3( 0, 0, 1 );

      var orient = data.value.orientation;
      var quat = new THREE.Quaternion( orient.x, orient.y, orient.z, orient.w );

      // rotate the three-axis representation of the device
      xOrientation.applyQuaternion( quat );
      yOrientation.applyQuaternion( quat );
      zOrientation.applyQuaternion( quat );

      // get position
      var pos = data.value.position;
      var p = new THREE.Vector3( 0, 0, 0 ); //pos.x, pos.y, pos.z );

      // create arrows for three-axis representation of device
      device.x = new THREE.ArrowHelper(xOrientation, p, 1, 0xff0000);
      device.y = new THREE.ArrowHelper(yOrientation, p, 1, 0x00ff00);
      device.z = new THREE.ArrowHelper(zOrientation, p, 1, 0x0000ff);

      // add to scene
      scene.add(device.x);
      scene.add(device.y);
      scene.add(device.z);

    },
    function(error) {
      console.log('Error: %s', error);
    },
    function() {
      console.log('Observable completed.');
    }

  );

});
