// Convert nested-propery array into flat hierarchy and vice versa.

// "' OBJ.' . objects's field" -> [" OBJ.","object's field"]

exports.decode=function(path) {
  var result=path.match(/\s*'[^']+'\s*|[^.]+/g);
  for (var r=0;r<result.length;r++)
    result[r]=result[r].replace(/^\s+|\s+$/g,"").replace(/^'|'$/g,"");
  return result;
};

// [" OBJ.","object's field"] -> "' OBJ.' . objects's field"

exports.encode=function(fields) {
  for (var f=0;f<fields.length;f++)
    if (/\.|^\s|\s$/.test(fields[f])) fields[f]="'"+fields[f]+"'";
  return fields.join('.');
};
