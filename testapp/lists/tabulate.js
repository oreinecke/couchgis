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
  var content_matches=pass;
  if ('cuts' in options) {
    var keywords=[];
    var fields=[];
    var values=[];
    var cuts=options.cuts;
    for (var c=0;c<cuts.length;c++)
      if (cuts[c].field) {
        fields.push(cuts[c].field.split('.'));
        values.push(cuts[c].value);
      } else keywords.push(cuts[c].value);
    content_matches=function(doc) {
      for (var f=0;f<fields.length;f++) {
        var field=fields[f];
        var value=doc;
        for (var g=0;g<field.length && value!=null;g++)
          value=value[field[f]];
        if (value!=values[f]) return false;
      }
      if (!keywords.length) return true;
      var content="";
      for (var prop in doc)
        if (prop!=="time" && prop!=="type") content+=doc[prop]+'\n';
      for (var k=0;k<keywords.length;k++)
        if (content.search(keywords[k])===-1) return false;
      return true;
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
    if (!content_matches(doc)) continue;
    send_separator();
    send_fields();
  }
  return ']\n';
}
