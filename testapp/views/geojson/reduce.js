// Collects GeoJSON and associated properties.

function (keys, values, rereduce) {
  var result={docs:[]};
  for (i=0;i<values.length;i++) {
    if ("GeoJSON" in values[i]) 
      result.GeoJSON=values[i].GeoJSON;
    if ("doc" in values[i])
      result.docs.push(values[i].doc);
  }
  return result;
}
