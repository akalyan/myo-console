(function(Myo, Rx, $) {

	MyoRx = {

		createImuObservableFromMyo : function(myo, pauser){
			var to_return = Rx.Observable.create(
					function (observer) {
						myo.on('imu', function(data) {
							var tr = data;
							tr.orientationOffset = myo.orientationOffset;
							observer.onNext(tr);
						});
						return Rx.Disposable.create();
					}
				)
				.sample(100) // sampling every 100ms (FIXME)
				.timestamp() // add a timestamp to each element of the sequence
				.share();

			if (pauser) {
				return to_return.pausable(pauser); // attach it to the pauser Subject
			} else {
				return to_return;
			}
		},

		createImuObservableFromFile : function(filepath, pauser) {

			// get data from file (synchronous!)
			var rows = $.getDataFromFile(filepath);

			// map it in to the IMU/Observable structure
			var data = rows.map(function(row) {
				var tr = {
					'timestamp': +row[0],
					'value': {
						'accelerometer': { 'x': +row[1], 'y': +row[2], 'z': +row[3] },
						'gyroscope':     { 'x': +row[4], 'y': +row[5], 'z': +row[6] },
						'orientation':   { 'w': +row[7], 'x': +row[8], 'y': +row[9], 'z': +row[10] }
					}
				};

				if (row.length > 11) {
					tr.value.orientationOffset = {
						'w': +row[11],
						'x': +row[12],
						'y': +row[13],
						'z': +row[14]
					};
				} else {
					tr.value.orientationOffset = { 'w': 0, 'x': 0, 'y': 0, 'z': 0 };
				}

				return tr;
			});

			// return the Observable (FIXME: static 20ms delayEach)
			var to_return = Rx.Observable.delayEach(data, 20)
				.share();

			if (pauser) {
				return to_return.pausable(pauser);
			} else {
				return to_return;
			}
		},

		getPositionFromImuObservable : function(imuObservable, gravityTrim) {

			// first adjust for gravity
			var adjusted = imuObservable
				.map(function(d) {
					var current_o = d.value.orientation;
					var current_q = (new THREE.Quaternion(current_o.x, current_o.y, current_o.z, current_o.w)).normalize();

					// var offset_o = d.value.orientationOffset;
					// var offset_q = (new THREE.Quaternion(offset_o.x, offset_o.y, offset_o.z, offset_o.w)).normalize();

					var current_accel = d.value.accelerometer;
					var current_v = (new THREE.Vector3(current_accel.x, current_accel.y, current_accel.z));

					gravityTrim = gravityTrim || 1;
					var gravity = new THREE.Vector3(0,0,gravityTrim);
					current_v.applyQuaternion( current_q ); // .applyQuaternion( offset_q.conjugate() );
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
							'orientation': d.value.orientation,
							'orientationOffset': d.value.orientationOffset
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
							'orientation': d.current.value.orientation,
							'orientationOffset': d.current.value.orientationOffset
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
								'orientation': d.value.orientation,
								'orientationOffset': d.value.orientationOffset
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
							'orientation': d.value.orientation,
							'orientationOffset': d.value.orientationOffset
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
							'orientation': d.current.value.orientation,
							'orientationOffset': d.current.value.orientationOffset
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
							'orientation': d.value.orientation,
							'orientationOffset': d.value.orientationOffset
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
