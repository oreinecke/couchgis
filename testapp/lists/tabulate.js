// Similar to _list/tabulate from toolkit but more JSON-ish.

function(head, req) {
  start({'headers':{'Content-Type':'application/json;charset=utf-8'}});
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
    // sort cuts into these handy arrays:
    while (options.cuts.length) {
      var cut=options.cuts.shift();
      // eval()'d expression must be true
      if (cut.field==="_expression") {
        // Transform Field_Näme . 'nested .field' into doc["Field_Näme"]
        // ["nested field"]: the first match employs greediness to split
        // expression into the following substrings:
        //
        //                       "string expression"    Field_Näme . 'nested .field'            anything else
        //                             v.....v v.....................................................v v..v
        var parts=cut.value.match(/"[^"]*"|([\wäöüÄÖÜß]+|'[^']+')(\s*\.\s*([\wäöüÄÖÜß]+|'[^']+'))*|\W/g);
        var expression="";
        for (var part; (part=parts.shift())!=null; expression+=part ) {
          // Double-quoted parts are attached as-is to expression.
          if (/^"[^"]*"$/.test(part)) continue;
          // This is equivalent to 'anything else'.
          if (/^\W$/.test(part)) continue;
          // (Unquoted) field names start with a capital by convention.
          if (!/['A-ZÄÖÜ]/.test(part[0])) continue;
          // See explanation below for parts as tagged here:
          //     (a)                     (b)                (c)            (d)      (e)
          part='doc["'+part.match(/'[^']+'|[^\s.]+/g).join('"]["').replace(/'/g,"")+'"]';
          // a) All fields are fetched from doc.
          // b) I might encounter a dot inside a field name and therefore
          //    cannot use a simple part.split('.'). Again, the greediest
          //    pattern is the left one, which fetches the variable string. It
          //    takes precedende over a second pattern fetcheing unquoted field
          //    names (white-spaces are ignored).
          // c) Done accessing this field, re-opening the next one.
          // d) Here I remove quotes from quoted field names. There is no
          //    look-behind RegExp support, so I have to resort to kind a hack.
          // e) This closes the last field access.
        }
        expressions.push(expression);
      } else {
        cut.value=cut.value && new RegExp(cut.value, 'im');
        // extract object path (identical to (b))
        cut.field=cut.field.match(/'[^']+'|[^.]+/g);
        // remove quotes (identical to (d))
        for (var f=0;f<cut.field.length;f++)
          cut.field[f].replace(/'/g,"");
        // value should be somewhere in the document
        if (cut.field[0]==="_keyword") keywords.push(cut.value);
        // value must match
        else if (cut.value) {
          fields.push(cut.field);
          values.push(cut.value);
        // ignore value but require field to be non-null
        } else non_nulls.push(cut.field);
      }
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
        if (prop!=="time" && prop!=="_id")
          content+=JSON.stringify(doc[prop])+'\n';
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
          fields, values, options, send_separator, expressions, send_fields,
          row, start, send, getRow, head, req, require;
          try { return eval(expression); }
          catch(err) { return false; }
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
