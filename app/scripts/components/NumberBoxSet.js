var NumberBoxSet = React.createClass({
  render: function() {
    return (
      <div>
        <NumberBox field="timestamp" observable={this.props.observable} />
        <NumberBox field="value.accelerometer.x" observable={this.props.observable} />
        <NumberBox field="value.accelerometer.y" observable={this.props.observable} />
        <NumberBox field="value.accelerometer.z" observable={this.props.observable} />
      </div>
    );
  }
});
