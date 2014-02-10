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
  var defines_field=pass;
  var matches_value=pass;
  var contains_keyword=pass;
  var matches_expression=pass;
  if ('cuts' in options) {
    var keywords=[];
    var non_nulls=[];
    var fields=[];
    var values=[];
    var expressions=[];
    var cuts=options.cuts;
    // sort cuts into these handy arrays:
    for (var c=0;c<cuts.length;c++)
      // eval()'d expression must be true
      if (cuts[c].field==="_expression") {
        var parts=cuts[c].value.match(/"[^"]*"|([\wäöüÄÖÜß]+|'[^']+')(\s*\.\s*([\wäöüÄÖÜß]+|'[^']+'))*|\W/g);
        log({parts:parts});
        var expression="";
        for (var part; (part=parts.shift())!=null; expression+=part ) {
          if (/^"[^"]*"$/.test(part)) continue;
          if (/^\W*$/.test(part)) continue;
          if (!/[A-ZÄÖÜ]/.test(part[0])) continue;
          part='doc["'+part.match(/'[^']+'|[^\s.]+/g).join('"]["').replace(/'/g,'')+'"]';
        }
        log({expression:expression});
        expressions.push(expression);
      // value should be somewhere in the document
      } else if (cuts[c].field==="_keyword")
        keywords.push(new RegExp(cuts[c].value, 'im'));
      // ignore value but require field to be non-null
      else if (cuts[c].field && !cuts[c].value)
        non_nulls.push(cuts[c].field.split('.'));
      // value must match
      else {
        fields.push(cuts[c].field.split('.'));
        values.push(new RegExp(cuts[c].value, 'im'));
      }
    if (non_nulls.length) defines_field=function(doc) {
      for (var f=0;f<non_nulls.length;f++) {
        var field=non_nulls[f];
        var value=doc;
        for (var g=0;g<field.length;g++) {
          value=value[field[g]];
          if (value==null) return false;
        }
      }
      return true;
    };
    if (fields.length) matches_value=function(doc) {
      for (var f=0;f<fields.length;f++) {
        var field=fields[f];
        var value=doc;
        for (var g=0;g<field.length && value!=null;g++)
          value=value[field[g]];
        if (value==null) return false;
        if (typeof(value)==="number") value=String(value);
        if (!values[f].test(value)) return false;
      }
      return true;
    };
    if (keywords.length) contains_keyword=function(doc) {
      var content="";
      for (var prop in doc)
        if (prop!=="time" && prop!=="type") content+=doc[prop]+'\n';
      for (var k=0;k<keywords.length;k++)
        if (!keywords[k].test(content)) return false;
      return true;
    };
    if (expressions.length) matches_expression=function(doc) {
      for (var e=0;e<expressions.length;e++) {
        // YES THIS IS SUPER SAFE!!!!
        if (!function(expression) {
          // Provide these useful variable names for the user!!!
          var e, time_matches, type_matches, defines_field, matches_value,
          contains_keyword, matches_expression, pass, keywords, non_nulls,
          fields, values, cuts, options, send_separator, expressions,
          send_fields, row, start, send, getRow, head, req, require;
          try { return eval(expression); }
          catch(e) { return false; }
        }(expressions[e])) return false;
      }
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
    if (!defines_field(doc)) continue;
    if (!matches_value(doc)) continue;
    if (!contains_keyword(doc)) continue;
    if (!matches_expression(doc)) continue;
    send_separator();
    send_fields();
  }
  return ']\n';
}
