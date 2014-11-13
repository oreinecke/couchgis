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
      return (types.indexOf(type)!==-1);
    };
  }
  var time_matches=pass;
  if ('time' in options) {
    var ranges=require('views/lib/ranges');
    var time=ranges.toRanges(options.time);
    time_matches=function(doc_time) {
      return ranges.intersects(time, doc_time);
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
    var path=require('views/lib/path');
    // sort cuts into these handy arrays:
    while (options.cuts.length) {
      var cut=options.cuts.shift();
      // eval()'d expression must be true
      if (cut.field==="_expression") {
        // concat RegExp /ab/ and /c/ into /(ab|c)/
        function join() {
          var result="";
          for (var a=0;a<arguments.length;a++)
            result+=(a?'|':'')+(arguments[a].source||arguments[a]);
          return '('+result+')';
        }
        // match        unquoted or 'quoted fields' 
        var f=join( /[\wäöüÄÖÜß]+/, /'(\\'|[^'])+'/ );
        // match "string constant" or field.'opt. nested field' or anything else                               
        var g=join( /"(\\"|[^"])*"/, f+join(/\s*\.\s*/.source+f)+'*', /\W/ );
        var parts=cut.value.match(g,'g');
        var expression="";
        for (var part; part=parts.shift(); expression+=part ) {
          // This is equivalent to 'anything else'.
          if (/^\W$/.test(part)) continue;
          // Do not process keywords and accumulator functions.
          if (!/^['A-ZÄÖÜ_]/.test(part)) continue;
          //     (a)              (b)          (c)     (d)              (e)
          part=('doc["'+part.match(f,'g').join('"]["')+'"]').replace(/'"|"'/g,'"');
          // a) All fields are fetched from doc.
          // b) I might encounter a dot inside a field name and therefore
          //    cannot use a simple part.split('.').
          // c) Done accessing this field, re-opening the next one.
          // d) This closes the last field access.
          // e) Here I remove quotes from quoted field names.
        }
        expressions.push(expression);
      } else {
        cut.value=cut.value && new RegExp(cut.value, 'i');
        cut.field=path.decode(cut.field);
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
      var content=JSON.stringify(doc).match(/"(\\"|[^"])+"|[\d.e+-]+|true|false/g);
      for (var c=0, cc; cc=content[c]; c++)
        if (cc[0]==='"') content[c]=JSON.parse(cc);
      content=content.join('\n');
      for (var k=0;k<keywords.length;k++)
        if (!keywords[k].test(content)) return false;
      return true;
    };
    if (expressions.length) matches_expression=function(doc) {
      // Provide these useful property accumulators:
      function sum(obj, result) {
        result = result || 0;
        if (obj && typeof obj==="object")
          for (var p in obj) result+=obj[p];
        return result;
      }
      function count(obj, result) {
        result = result || 0;
        if (obj && typeof obj==="object")
          for (var p in obj) result++;
        return result;
      }
      function min(obj) {
        var result={value:+Infinity};
        if (obj && typeof obj==="object")
          for (var p in obj)
            if (obj[p]<result.value)
              result={field:p,value:obj[p]};
        return result;
      }
      function max(obj) {
        var result={value:-Infinity};
        if (obj && typeof obj==="object")
          for (var p in obj)
            if (obj[p]>result.value)
              result={field:p,value:obj[p]};
        return result;
      }
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
  var send_fields=pass;
  if (req.path.pop()==="geojson") send_fields=function() {
    send('"'+row.id+'"');
  }; else send_fields=function() {
    send(JSON.stringify(row.key));
  };
  send('[');
  while (row=getRow()) {
    var doc=row.value.doc;
    if (!doc) continue;
    if (!type_matches(doc.type)) continue;
    if (!time_matches(doc.ranges)) continue;
    if (!defines_field(doc)) continue;
    if (!matches_value(doc)) continue;
    if (!contains_keyword(doc)) continue;
    if (!matches_expression(doc)) continue;
    send_separator();
    send_fields();
  }
  return ']\n';
}
