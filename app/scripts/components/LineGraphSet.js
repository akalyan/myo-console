var LineGraphSet = React.createClass({
  getDefaultProps: function() {
    return {
      height: '150px',
      max_records: 200
    };
  },

  render: function() {
    var obs = this.props.observable;
    var height = this.props.height;
    var graphs = this.props.fields.map(function (field) {
      return (
        <LineGraphBox height={height} field={field.accessor} observable={obs} title={field.title} />
      );
    });

    return (
      <div class="container">
        <div className="row"><h2>{this.props.title}</h2></div>
        <div className="row">
          {graphs}
        </div>
      </div>
    );
  }
});
