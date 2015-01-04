var LineGraphBox = require('./LineGraphBox');
var Rx = require('rx');
require('../lib/rx.dom');
var React = require('react');

module.exports = React.createClass({
  getDefaultProps: function() {
    return {
      height: '150px',
      max_records: 200
    };
  },

  componentWillMount: function() {
    var i = 0;
    var renderers = {};
    var children = this.props.fields;

    children.forEach(function(field) {
      renderers[field.accessor] = new Rx.Subject();
    });

    this.setState({ renderers: renderers });

    Rx.Scheduler.requestAnimationFrame.schedule(function redraw() {
      var to_render = children[i % children.length];
      // console.log("rendering " + to_render.accessor);
      renderers[to_render.accessor].onNext(1);
      i++;
      requestAnimationFrame(redraw);
    });
  },

  render: function() {
    var obs = this.props.observables;
    var height = this.props.height;
    var self = this;
    var graphs = this.props.fields.map(function (field) {
      return (
        <LineGraphBox key={field.title} height={height} field={field.accessor} observables={obs} renderer={self.state.renderers[field.accessor]} title={field.title} />
      );
    });

    return (
      <div className="container">
        <div className="row"><h2>{this.props.title}</h2></div>
        <div className="row">
          {graphs}
        </div>
      </div>
    );
  }
});
