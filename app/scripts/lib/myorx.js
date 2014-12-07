(function(Myo, Rx, $) {

	MyoRx = {

		createImuObservable : function(pauser){
			return Rx.Observable.create(
					function (observer) {
						Myo.create().on('imu', observer.onNext.bind(observer));
						return Rx.Disposable.create();
					}
				)
				.sample(100) // sampling every 100ms (FIXME)
				.timestamp() // add a timestamp to each element of the sequence
				.pausable(pauser) // attach it to the pauser Subject
				.share()
				;
		},

		createImuObservableFromFile : function(filepath, pauser) {

			// get data from file (synchronous!)
			var rows = $.getDataFromFile(filepath);

			// map it in to the IMU/Observable structure
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

			// return the Observable (FIXME: static 20ms delayEach)
			return Rx.Observable.delayEach(data, 20)
				.pausable(pauser)
				.share()
				;
		},

		getPositionFromImuObservable : function(imuObservable) {

			// first adjust for gravity
			var adjusted = imuObservable
				.map(function(d) {
					var current_o = d.value.orientation;
					var current_q = (new THREE.Quaternion(current_o.x, current_o.y, current_o.z, current_o.w)).normalize();

					var current_accel = d.value.accelerometer;
					var current_v = (new THREE.Vector3(current_accel.x, current_accel.y, current_accel.z));

					var gravity = new THREE.Vector3(0,0,1.0576);
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
					};
				});

			// integrate the velocity
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
						// console.log('resetting velocity');
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
				});

			// integrate the position
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
				.share() // shared so that you can have multiple subscribers
				;

			return position;
		}

	};

	if(typeof module !== 'undefined') module.exports = MyoRx;

})(Myo, Rx, jQuery);
