$(document).ready(function() {

  /*
   * Set up the scene.
   */
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
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

  function render() {
  	requestAnimationFrame( render );
  	renderer.render( scene, camera );
  }
  render();

  var arrowOrientation = {
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
    arrowOrientation = {
      x: null,
      y: null,
      z: null
    };

    var orient = data.orientation;
    var xOrientation = new THREE.Vector3( 1, 0, 0 );
    var yOrientation = new THREE.Vector3( 0, 1, 0 );
    var zOrientation = new THREE.Vector3( 0, 0, 1 );

    var quat = new THREE.Quaternion( orient.x, orient.y, orient.z, orient.w );
    var origin = new THREE.Vector3( 0, 0, 0 );

    xOrientation.applyQuaternion( quat );
    yOrientation.applyQuaternion( quat );
    zOrientation.applyQuaternion( quat );

    arrowOrientation.x = new THREE.ArrowHelper(xOrientation, origin, 1, 0xff0000);
    arrowOrientation.y = new THREE.ArrowHelper(yOrientation, origin, 1, 0x00ff00);
    arrowOrientation.z = new THREE.ArrowHelper(zOrientation, origin, 1, 0x0000ff);

    scene.add( arrowOrientation.x );
    scene.add( arrowOrientation.y );
    scene.add( arrowOrientation.z );
  });

  /*
   * Set up the controls.
   */
  var Controls = function() {
    this.zeroOrientation = function() {
      myMyo.zeroOrientation();
    };
  };

  window.onload = function() {
    var c = new Controls();
    var gui = new dat.GUI();
    gui.add(c, 'zeroOrientation');
  };

});
