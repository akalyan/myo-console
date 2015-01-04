var LineGraphBox = React.createClass({
  getDefaultProps: function() {
    return {
      width: '100%',
      height: '150px',
      max_records: 200,
      margins: {
        left: 50,
        top: 10,
        right: 10,
        bottom: 10
      }
    };
  },

  getInitialState: function() {
    return {data: []};
  },

  componentDidMount: function() {
    // subscribe to the myo observable with a function sets
    // the datum for the property identified in field
    var field = this.props.field;
    var self = this;

    R.forEach.idx(function(val, idx) {
      Rx.Observable.repeat(0, self.props.max_records-1)
      .concat(val)
      .bufferWithCount(self.props.max_records,1)
      .subscribe(function(array) {
        var plucked = R.map(function(obj) {
          var acc = obj;
          field.split('.').forEach(function(part) {
            acc = R.prop(part, acc) || 0;
          });
          return acc;
        }, array);
        self.setDataElement(idx, plucked);
      });
    }, this.props.observables);

    // create the chart
    var el = this.refs.chart.getDOMNode();
    this.setState({ chart: new d3Chart() });
    this.state.chart.init(el, this.props, this.getChartData());

    this.props.renderer.subscribe(function(val) {
      self.forceUpdate();
    });

  },

  shouldComponentUpdate: function() {
    return false;
  },

  componentDidUpdate: function() {
    var el = this.refs.chart.getDOMNode();
    this.state.chart.update(el, this.props, this.getChartData());
  },

  componentWillUnmount: function() {
    var el = this.refs.chart.getDOMNode();
    this.state.chart.destroy(el);
  },

  setData: function(d) {
    this.setState({ data: d });
  },

  setDataElement: function(index, d) {
    var temp = this.state.data;
    temp[index] = d;
    this.setState({ data: temp });
  },

  getChartData: function() {
    return this.state.data;
  },

  render: function() {
    var cx = React.addons.classSet;
    var classes = cx({
      'col-md-4': true
    });
    return (
      <div className={classes}>
        <h4>{this.props.title}</h4>
        <div ref="chart" className="Chart"></div>
      </div>

    );
  }
});
