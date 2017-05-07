var filewatcher = require('filewatcher');
var touch = require('touch');
var throttle = require( 'method-throttle' );

var RELAY_SIGNATURE = 'Relay.QL';

function WebpackPluginGraphqlJSONHot(options) {
  this.options = options;
  this.log = msg => {
    // if (this.verbose) {
    console.log('[relay-touch-dependents]', msg);
    // }
  };

  this.err = msg => {
    // if (!this.hideErrors) {
    console.error('[ERROR][relay-touch-dependents]', msg);
    // }
  };
}

WebpackPluginGraphqlJSONHot.prototype.apply = function(compiler) {
  var jsonPath = this.options.jsonPath;
  var wait = this.options.wait;
  var watcher = filewatcher();
  // var token;
  var dependents = {};
  var count = 0;
  var scanned = 0;
  var that = this;
  var logUpdate = throttle(function (scanned, count){
    if (scanned) {
      that.log("Flagged " + count + "/" + scanned + " modules during compilation as schema dependents." );
    }
  }, 5000 );
  logUpdate();
  that.log('Version: 0.0.33 (c) MIT Jeffrey Hicks');
  compiler.plugin("compilation", function(compilation) {
    compilation.plugin('succeed-module', function(module){
      if (!dependents[module.resource]) {
        scanned = scanned + 1;
        if (module.loaders && module.loaders.length > 0 && module._source._value.includes(RELAY_SIGNATURE)) {
          dependents[module.resource] = true;
          count = count + 1;
        }
        logUpdate(scanned, count);
      }
    });
  });

  watcher.add(jsonPath);
  that.log('Watching ' + jsonPath);
  watcher.on('change', function() {
    that.log('Schema changed.  Touching dependents in: ' + wait + 'ms');
    setTimeout(
      function() {
        that.log('Touching ' + Object.keys(dependents).length + ' dependent(s).');
        Object.keys(dependents).forEach(function(f) {
          touch(f, { nocreate: true });
        });
        // that.log('Done ' + Object.keys(dependents).length + ' dependent(s).');
      }, wait);
    }); // end watcher on
};

module.exports = WebpackPluginGraphqlJSONHot;
