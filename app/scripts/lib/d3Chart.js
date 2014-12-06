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

    var xRange = d3.scale.linear()
      .range([props.margins.left, $(el).width() - props.margins.right])
      .domain([0, data.length]);

    if (this.min != null) {
      this.min = d3.min([
        this.min,
        d3.min(data, function(d) { return d; })
      ]);
    } else {
      this.min = d3.min(data, function(d) { return d; });
    }

    if (this.max != null) {
      this.max = d3.max([
        this.max,
        d3.max(data, function(d) { return d; })
      ]);
    } else {
      this.max = d3.max(data, function(d) { return d; });
    }

    var yRange = d3.scale.linear()
      .range([$(el).height() - props.margins.bottom, props.margins.top])
      .domain([this.min,this.max]);

    return {
      x: xRange,
      y: yRange
    };

  };

  this._drawLine = function(el, props, scales, data) {

    var g = d3.select(el).selectAll('.d3-points');

    // draw the y-axis
    var yAxis = d3.svg.axis()
      .scale(scales.y)
      .tickSize(5)
      .orient("left")
      .tickSubdivide(true);

    g.selectAll('g').remove();
    g.append('svg:g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + props.margins.left + ',0)')
      .call(yAxis);

    var lineFunc = d3.svg.line()
      .x(function(d, i) { return scales.x(i); })
      .y(function(d) { return scales.y(d); })  // should be d.value
      .interpolate('linear');

    g.selectAll('path').remove();
    g.append('svg:path')
      .attr('d', lineFunc(data))
      .attr('stroke-width', 1)
      .attr('fill', 'none');
  };

};
