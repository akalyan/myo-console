var NumberBox = React.createClass({
  getInitialState: function() {
    return {datum: null};
  },
  componentDidMount: function() {
    // subscribe to the myo observable with a function sets
    // the datum for the property identified in field
    this.props.observable.subscribe(
      R.reduceRight(
        R.compose, this.setDatum, R.map(R.prop, this.props.field.split('.'))
      )
    );
  },
  setDatum: function(d) {
    this.setState({ datum: d });
  },
  render: function() {
    return (
      <div className="numberBox">
        {this.state.datum}
      </div>
    );
  }
});
