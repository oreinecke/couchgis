// Loads CommonJS libraries nested in CouchDB design docs using an identical
// syntax. Requires inside libraries are evaluated and relative paths are
// supported. Critical variables have been shadowed but the library would still
// be able to manipulate other globals i.e. window, document, $ etc.

var require=function() {
  var ddoc;
  // get design document and save an abreviated copy
  $.getJSON("./", function(data) {
    ddoc={views:{lib:data.views.lib}};
  });
  var result=function(lib, root) {
    var parts=lib.split('/');
    if (parts[0]==".") lib=root;
    else lib=ddoc;
    for (var p=0;p<parts.length;p++) {
      // save location for nested requires
      if (p==parts.length-1) root=lib;
      lib=lib[parts[p]];
    }
    // provide exports
    var exports={};
    // hide require and provide last location
    var require=function(lib) {
      result(lib, root);
    };
    // hide vars from lib compilation
    (function() {
      var ddoc, root, parts, result;
      eval(lib);
    }());
    return exports;
  };
  return function(lib) {
    return result(lib, ddoc);
  };
}();
