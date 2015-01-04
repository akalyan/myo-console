function d3Chart() {

  this.init = function(el, props) {

    var svg = d3.select(el).append('svg')
        .attr('class', 'd3')
        .attr('width', props.width)
        .attr('height', props.height);

    svg.append('g')
        .attr('class', 'd3-points');

    this.min = null;
    this.max = null;
    this.scalesChanged = false;

    // FIXME:
    // statically capturing the width and height when the chart is initialized
    // to avoid layout thrashing when if I read it on every frame.
    // the downside of this approach is that the display will be screwed up
    // if the window is resized.
    this.width = $(el).width();
    this.height = $(el).height();

    this.update(el, props, []);
  };

  this.update = function(el, props, data) {
    // Re-compute the scales, and render the data points
    if (data) {
      var scales = this._scales(el, props, data);
      this._drawLine(el, props, scales, data);
    }
  };

  this.destroy = function(el) {
    // Any clean-up would go here
    // in this example there is nothing to do
  };

  this._scales = function(el, props, data) {

    // expecting data to be an array of datasets (arrays)
    var D = [];
    if (!( data[0] instanceof Array) ) {
      D.push(data);
    } else {
      D = data;
    }
    var old_min = ( (this.min == null) ? D[0][0] : this.min );
    var old_max = ( (this.max == null) ? D[0][0] : this.max );

    var xRange = d3.scale.linear()
      .range([props.margins.left, this.width - props.margins.right])
      .domain([0, R.reduce(function(acc, val) { return d3.max([acc, val.length]); }, 0, D)]);

    this.min = R
      .reduce(
        function(acc, val) { return d3.min([acc, d3.min(val, function(d) { return d; })]); },
        old_min,
        D
      );

    this.max = R
      .reduce(
        function(acc, val) { return d3.max([acc, d3.max(val, function(d) { return d; })]); },
        old_max,
        D
      );

    var yRange = d3.scale.linear()
      .range([this.height - props.margins.bottom, props.margins.top])
      .domain([this.min,this.max]);

    if (old_min != this.min || old_max != this.max) {
      this.scalesChanged = true;
    } else {
      this.scalesChanged = false;
    }

    return {
      x: xRange,
      y: yRange
    };

  };

  this._drawLine = function(el, props, scales, data) {

    // expecting data to be an array of datasets (arrays)
    var D = [];
    if (!( data[0] instanceof Array) ) {
      D.push(data);
    } else {
      D = data;
    }

    var g = d3.select(el).selectAll('.d3-points');

    if (this.scalesChanged) {
      // create the y-axis
      var yAxis = d3.svg.axis()
        .scale(scales.y)
        .tickSize(5)
        .orient("left")
        .tickSubdivide(true);

      // remove old one
      g.selectAll('g').remove();

      // append new one
      g.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + props.margins.left + ',0)')
        .call(yAxis);
    }

    var c10 = d3.scale.category10();

    g.selectAll('path').remove();
    R.forEach(function(val) {
      var lineFunc = d3.svg.line()
        .x(function(d, i) { return scales.x(i); })
        .y(function(d) { return scales.y(d); })  // should be d.value
        .interpolate('linear');

      var p = lineFunc(val);

      g.append('svg:path')
        .attr('d', p)
        .attr('stroke', c10)
        .attr('stroke-width', 1)
        .attr('fill', 'none');
    }, D);

  };

};
