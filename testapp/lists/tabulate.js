// Similar to _list/tabulate from toolkit but more JSON-ish.

function(head, req) {
  start({'headers':{'Content-Type':'text/plain;charset=utf-8'}});
  var options=JSON.parse(req.query.options);
  function pass() {return true;}
  var row;
  var type_matches=pass;
  if ('types' in options) {
    var types=options.types;
    type_matches=function(type) {
      return (types.indexOf(type)>=0);
    };
  }
  var time_matches=pass;
  if ('time' in options) {
    var range=require('views/lib/range');
    var time=range.toRange(options.time);
    time_matches=function(doc_time) {
      return range.intersects(time, doc_time);
    };
  }
  var send_separator=function() {
    send_separator=function() {send(',\n');};
  };
  var send_fields=function() {
    send('"'+row.id+'"');
  };
  send('[');
  while (row=getRow()) {
    var doc=row.value.doc
    if (!doc) continue;
    if (!type_matches(doc.type)) continue;
    if (!time_matches(doc.time)) continue;
    send_separator();
    send_fields();
  }
  return ']\n';
}
