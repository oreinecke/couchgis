// Loads CommonJS libraries nested in CouchDB design docs with an identical
// syntax e.g. var utils=require("views/lib/utils");
// No dependencies are checked and the use of eval is highly critical.

var require;

$(document).ready(function() {
  require=function() {
    var ddoc;
    // get design document and save an abreviated copy
    $.getJSON("./", function(data) {
      ddoc={views:data.views};
    });
    return function(lib) {
      // hide temp variables in here
      (function() {
        var parts=lib.split('/');
        lib=ddoc;
        for (var p=0;p<parts.length;p++) {
          console.log(parts[p]);
          lib=lib[parts[p]];
        }
      }());
      var exports={};
      eval(lib);
      return exports;
    };
  }();
});
