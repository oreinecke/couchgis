// Convert nested-propery array into flat hierarchy and vice versa.

// "' OBJ.' . objects's field" -> [" OBJ.","object's field"]

exports.decode=function(path) {
  var result=path.match(/\s*'[^']+'\s*|[^.]+/g);
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
  return path.match(/\s*'[^']+'\s*|[^.]+/g).join('.'+extra);
}
