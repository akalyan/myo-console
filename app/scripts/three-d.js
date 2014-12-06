$(document).ready(function() {

  /*
   * Set up the scene.
   */
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 1000 );
  camera.position.z = 5;
  scene.add( camera );

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColorHex( 0xffffff, 1 );
  document.body.appendChild( renderer.domElement );

  var controls = new THREE.OrbitControls( camera );

  var arrowX = new THREE.ArrowHelper(new THREE.Vector3( 1, 0, 0 ), new THREE.Vector3( 0, 0, 0 ), 2, 0x880000);
  var arrowY = new THREE.ArrowHelper(new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( 0, 0, 0 ), 2, 0x008800);
  var arrowZ = new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 0, 0 ), 2, 0x000088);
  scene.add( arrowX );
  scene.add( arrowY );
  scene.add( arrowZ );

  var globalQuat = null;

  function render() {
  	requestAnimationFrame( render );
  	renderer.render( scene, camera );
  }
  render();

  var arrowOrientation = {
    x: null,
    y: null,
    z: null,
    all: null,
    gravity: null,
    fixed: null
  };

  var arrowOrientPrime = {
    x: null,
    y: null,
    z: null
  };

  /*
   * Set up the myo event handler.
   */
  var myMyo = Myo.create();
  myMyo.on('imu', function(data) {
    scene.remove( arrowOrientation.x );
    scene.remove( arrowOrientation.y );
    scene.remove( arrowOrientation.z );
    scene.remove( arrowOrientation.all );
    scene.remove( arrowOrientation.fixed );
    scene.remove( arrowOrientation.gravity );
    arrowOrientation = {
      x: null,
      y: null,
      z: null,
      all: null,
      gravity: null,
      fixed: null
    };

    var orient = data.orientation;
    var xOrientation = new THREE.Vector3( 1, 0, 0 );
    var yOrientation = new THREE.Vector3( 0, 1, 0 );
    var zOrientation = new THREE.Vector3( 0, 0, 1 );
    var all = new THREE.Vector3( data.accelerometer.x, data.accelerometer.y, data.accelerometer.z );
    var fixed = new THREE.Vector3( data.accelerometer.x, data.accelerometer.y, data.accelerometer.z );
    var gravity = new THREE.Vector3 ( 0, 0, 1 );

    var quat = new THREE.Quaternion( orient.x, orient.y, orient.z, orient.w );
    globalQuat = quat;
    var origin = new THREE.Vector3( 0, 0, 0 );

    xOrientation.applyQuaternion( quat );
    yOrientation.applyQuaternion( quat );
    zOrientation.applyQuaternion( quat );
    // all.applyQuaternion( quat );
    fixed.applyQuaternion( quat );
    fixed.sub(gravity);

    arrowOrientation.x = new THREE.ArrowHelper(xOrientation, origin, data.accelerometer.x, 0xff0000);
    arrowOrientation.y = new THREE.ArrowHelper(yOrientation, origin, data.accelerometer.y, 0x00ff00);
    arrowOrientation.z = new THREE.ArrowHelper(zOrientation, origin, data.accelerometer.z, 0x0000ff);
    arrowOrientation.all = new THREE.ArrowHelper( all, origin, all.length(), 0x777777 );
    arrowOrientation.gravity = new THREE.ArrowHelper( gravity, origin, 0.1, 0x000000 );
    arrowOrientation.fixed = new THREE.ArrowHelper( fixed, origin, fixed.length(), 0xff0000 );

    //scene.add( arrowOrientation.x );
    //scene.add( arrowOrientation.y );
    //scene.add( arrowOrientation.z );
    scene.add( arrowOrientation.all );
    scene.add( arrowOrientation.fixed );
    scene.add( arrowOrientation.gravity );

    // remove all this stuff later

    var xOrientPrime = xOrientation;
    var yOrientPrime = yOrientation;
    var zOrientPrime = zOrientation;

    var quatPrime = quat.conjugate();

    xOrientPrime.applyQuaternion( quatPrime );
    yOrientPrime.applyQuaternion( quatPrime );
    zOrientPrime.applyQuaternion( quatPrime );

    scene.remove( arrowOrientPrime.x );
    scene.remove( arrowOrientPrime.y );
    scene.remove( arrowOrientPrime.z );
    arrowOrientPrime = {
      x: null,
      y: null,
      z: null
    };

    arrowOrientPrime.x = new THREE.ArrowHelper(xOrientPrime, origin, 0.5, 0xff0000);
    arrowOrientPrime.y = new THREE.ArrowHelper(yOrientPrime, origin, 0.5, 0x00ff00);
    arrowOrientPrime.z = new THREE.ArrowHelper(zOrientPrime, origin, 0.5, 0x0000ff);

    //scene.add( arrowOrientPrime.x );
    //scene.add( arrowOrientPrime.y );
    //scene.add( arrowOrientPrime.z );

  });

  /*
   * Set up the controls.
   */
  var Controls = function() {
    this.zeroOrientation = function() {
      myMyo.zeroOrientation();
    };
    this.printQuaternion = function() {
      console.log("quat: " + globalQuat.w + ", " + globalQuat.x + ", " + globalQuat.y + ", " + globalQuat.z);
      var quatP = globalQuat.conjugate();
      console.log("quat': " + quatP.w + ", " + quatP.x + ", " + quatP.y + ", " + quatP.z);
    };
  };

  window.onload = function() {
    var c = new Controls();
    var gui = new dat.GUI();
    gui.add(c, 'zeroOrientation');
    gui.add(c, 'printQuaternion');
  };

});
