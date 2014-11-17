var myMyo = null;
var raw = {
  accel: {
    x: { data: [], max: 0, min: 0 },
    y: { data: [], max: 0, min: 0 },
    z: { data: [], max: 0, min: 0 }
  },
  gyro: {
    x: { data: [], max: 0, min: 0 },
    y: { data: [], max: 0, min: 0 },
    z: { data: [], max: 0, min: 0 }
  },
  orient: {
    w: { data: [], max: 0, min: 0 },
    x: { data: [], max: 0, min: 0 },
    y: { data: [], max: 0, min: 0 },
    z: { data: [], max: 0, min: 0 }
  }
};

var NUM_RECORDS = 500;
var paused = true;
var global_timer = 0;

$(document).ready(function() {
    myMyo = Myo.create();
    myMyo.lock();
    console.log("Created Myo at " + Date.now());

    myMyo.on('fingers_spread', function(edge){
      if(!edge || myMyo.isLocked) return;
      console.log('Hello Myo at ' + Date.now());
      myMyo.vibrate();
    });

    myMyo.on('thumb_to_pinky', function(edge){
      myMyo.timer(edge, 500, function(){
        myMyo.unlock(5000);
      })
    });

    myMyo.on('unlock', function(){
      myMyo.vibrate('short');
    });

    myMyo.on('imu', function(data){
      if (!paused) {
        if (raw.accel.x.data.length > NUM_RECORDS) { raw.accel.x.data.shift(); }
        if (raw.accel.y.data.length > NUM_RECORDS) { raw.accel.y.data.shift(); }
        if (raw.accel.z.data.length > NUM_RECORDS) { raw.accel.z.data.shift(); }

        if (raw.gyro.x.data.length > NUM_RECORDS) { raw.gyro.x.data.shift(); }
        if (raw.gyro.y.data.length > NUM_RECORDS) { raw.gyro.y.data.shift(); }
        if (raw.gyro.z.data.length > NUM_RECORDS) { raw.gyro.z.data.shift(); }

        if (raw.orient.w.data.length > NUM_RECORDS) { raw.orient.w.data.shift(); }
        if (raw.orient.x.data.length > NUM_RECORDS) { raw.orient.x.data.shift(); }
        if (raw.orient.y.data.length > NUM_RECORDS) { raw.orient.y.data.shift(); }
        if (raw.orient.z.data.length > NUM_RECORDS) { raw.orient.z.data.shift(); }

        raw.accel.x.data.push({ 'key': global_timer, 'value': data.accelerometer.x });
        raw.accel.y.data.push({ 'key': global_timer, 'value': data.accelerometer.y });
        raw.accel.z.data.push({ 'key': global_timer, 'value': data.accelerometer.z });

        raw.gyro.x.data.push({ 'key': global_timer, 'value': data.gyroscope.x });
        raw.gyro.y.data.push({ 'key': global_timer, 'value': data.gyroscope.y });
        raw.gyro.z.data.push({ 'key': global_timer, 'value': data.gyroscope.z });

        raw.orient.w.data.push({ 'key': global_timer, 'value': data.orientation.w });
        raw.orient.x.data.push({ 'key': global_timer, 'value': data.orientation.x });
        raw.orient.y.data.push({ 'key': global_timer, 'value': data.orientation.y });
        raw.orient.z.data.push({ 'key': global_timer, 'value': data.orientation.z });

        global_timer++;
      }
    });

    $('#pause').click(function() {
      paused = !paused;
      if (!paused)
        requestAnimationFrame(refreshGraphs);
    });

    var refreshGraphs = function() {
      if (paused) return;

      requestAnimationFrame(refreshGraphs);

      refreshGraph('#accel_x_graph', raw.accel.x);
      refreshGraph('#accel_y_graph', raw.accel.y);
      refreshGraph('#accel_z_graph', raw.accel.z);

      refreshGraph('#gyro_x_graph', raw.gyro.x);
      refreshGraph('#gyro_y_graph', raw.gyro.y);
      refreshGraph('#gyro_z_graph', raw.gyro.z);

      refreshGraph('#orient_w_graph', raw.orient.w);
      refreshGraph('#orient_x_graph', raw.orient.x);
      refreshGraph('#orient_y_graph', raw.orient.y);
      refreshGraph('#orient_z_graph', raw.orient.z);

    };

    var refreshGraph = function(el, data) {
      var MARGINS = {
        left: 50,
        top: 10,
        right: 10,
        bottom: 10
      };

      var svg = d3.select(el);

      var xRange = d3.scale.linear()
        .range([MARGINS.left, $(el).width() - MARGINS.right])
        .domain([
          d3.min(data.data, function(d) { return d.key; }),
          d3.max([
            d3.max(data.data, function(d) { return d.key; }),
            NUM_RECORDS
          ])
        ]);

      data.min = d3.min([
        data.min,
        d3.min(data.data, function(d) { return d.value; })
      ]);

      data.max = d3.max([
        data.max,
        d3.max(data.data, function(d) { return d.value; })
      ]);

      var yRange = d3.scale.linear()
        .range([$(el).height() - MARGINS.bottom, MARGINS.top])
        .domain([
          data.min,
          data.max
        ]);

      var yAxis = d3.svg.axis()
        .scale(yRange)
        .tickSize(5)
        .orient("left")
        .tickSubdivide(true);

      svg.selectAll('g').remove();
      svg.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + MARGINS.left + ',0)')
        .call(yAxis);

      var lineFunc = d3.svg.line()
        .x(function(d) { return xRange(d.key); })
        .y(function(d) { return yRange(d.value); })
        .interpolate('linear');

      svg.selectAll('path').remove();
      svg.append('svg:path')
        .attr('d', lineFunc(data.data))
        .attr('stroke-width', 1)
        .attr('fill', 'none');
    };

  });
