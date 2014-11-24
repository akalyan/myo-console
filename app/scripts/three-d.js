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
  document.body.appendChild( renderer.domElement );

  var controls = new THREE.OrbitControls( camera );

  var arrowX = new THREE.ArrowHelper(new THREE.Vector3( 1, 0, 0 ), new THREE.Vector3( 0, 0, 0 ), 1, 0xff0000);
  var arrowY = new THREE.ArrowHelper(new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( 0, 0, 0 ), 1, 0x00ff00);
  var arrowZ = new THREE.ArrowHelper(new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 0, 0 ), 1, 0x0000ff);
  scene.add( arrowX );
  scene.add( arrowY );
  scene.add( arrowZ );

  function render() {
  	requestAnimationFrame( render );
  	renderer.render( scene, camera );
  }
  render();

  var arrowOrientation = null;

  /*
   * Set up the myo event handler.
   */
  var myMyo = Myo.create();
  myMyo.on('imu', function(data) {
    scene.remove( arrowOrientation );
    arrowOrientation = null;

    var orient = data.orientation;
    var vectorOrientation = new THREE.Vector3( 1, 0, 0 );

    vectorOrientation.applyQuaternion(
      new THREE.Quaternion( orient.x, orient.y, orient.z, orient.w )
    );
    arrowOrientation = new THREE.ArrowHelper(vectorOrientation, new THREE.Vector3( 0, 0, 0 ), 1, 0xffff00);
    scene.add( arrowOrientation );
  });

});
