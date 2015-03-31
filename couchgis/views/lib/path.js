// Convert nested-propery array into flat hierarchy and vice versa.

// "' OBJ.' . objects's field" -> [" OBJ.","object's field"]

var match_parts=/\s*'[^']+'\s*|[^.]+/g;

exports.decode=function(path) {
  var result=path.match(match_parts);
  for (var r=0;r<result.length;r++)
    result[r]=result[r].replace(/^\s+|\s+$/g,"").replace(/^'|'$/g,"");
  return result;
};

// [" OBJ.","object's field"] -> "' OBJ.'. objects's field"

exports.encode=function(fields) {
  var result=fields[0];
  var r=/\.|^\s|\s$/;
  if (r.test(result)) result="'"+result+"'";
  for ( var f=1, field; field=fields[f++]; result+="."+field )
    if (r.test(field)) field="'"+field+"'";
  return result;
};

// Pretty-print path with extra characters after the dot.
exports.pretty=function(path, extra) {
  return path.match(match_parts).join('.'+extra);
}
