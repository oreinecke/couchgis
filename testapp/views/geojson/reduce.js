// Collects GeoJSON and associated properties.

function (keys, values, rereduce) {
  var result={docs:[]};
  for (k=1;k<keys.length;k++)
    if (keys[k-1][0]!=keys[k][0])
      return "No result for group_level=0";
  for (i=0;i<values.length;i++) {
    if ("GeoJSON" in values[i]) 
      result.GeoJSON=values[i].GeoJSON;
    if ("doc" in values[i])
      result.docs.push(values[i].doc);
  }
  return result;
}
