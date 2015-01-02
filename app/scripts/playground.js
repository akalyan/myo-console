$(document).ready(function() {

  // subject to listen to pause/unpause clicks
  var pauser = new Rx.Subject();
  var myo = null;

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

  // create an empty Rx observable from myo.on('imu') triggers
  var raw = Rx.Observable.empty();

  // populate raw based on querystring
  if ($.QueryString["file"]) {
    console.log('reading from file: ' + $.QueryString["file"]);
    raw = MyoRx.createImuObservableFromFile($.QueryString["file"], pauser);
  } else {
    myo = Myo.create(0);
    raw = MyoRx.createImuObservableFromMyo(myo, pauser);
  }

  var position = MyoRx.getPositionFromImuObservable(raw);

  // utility function for creating the title/accessor fields array
  var create_fields = function(field, subfields) {
    return subfields.map(function(x) {
      return { 'title': x.toUpperCase(), 'accessor': ['value',field,x].join('.') }
    });
  };

  // more refactoring possible here to create an app component...later
  React.render(<LineGraphSet observables={[raw]} title='Accelerometer' fields={create_fields('accelerometer', ['x','y','z'])} />, document.getElementById('accel_content'));
  React.render(<LineGraphSet observables={[position]} title='Adjusted for G' fields={create_fields('accelerometer', ['x','y','z'])} />, document.getElementById('adjust_content'));
  React.render(<LineGraphSet observables={[position]} title='Velocity' fields={create_fields('velocity', ['x','y','z'])} />, document.getElementById('velo_content'));
  React.render(<LineGraphSet observables={[position]} title='Position' fields={create_fields('position', ['x','y','z'])} />, document.getElementById('position_content'));

});
