// Exports FeatureCollection in combination with views/geojson.js.

function(head, req) {
  var filename=req.query.filename || "export";
  var compressed_keys=req.query.compressed_keys;
  var print=Infinity, skip=0;
  if (compressed_keys) {
    compressed_keys=compressed_keys.split('-');
    print=parseInt(compressed_keys.shift());
    skip=parseInt(compressed_keys.shift());
  }
//   Re-enable Content-Disposition as soon as debugging is finished!!!
//start({'headers':{
//  'Content-Type':'application/json;charset=utf-8',
//  'Content-Disposition':'attachment;filename="'+filename+'.geojson"'
//}});
  start({'headers':{'Content-Type':'application/json;charset=utf-8'}});
  var features=[];
  var row=getRow();
  while (row) {
    while (row && row.value.GeoJSON && row.value.GeoJSON.error!==0.0)
      row=getRow();
    var geometry=row.value.GeoJSON || {};
    delete geometry.error;
    delete geometry.crs;
    while (row && !row.value.doc) row=getRow();
    while (row && row.value.doc) {
      if (print) {
        features.push({
          type:"Feature",
          geometry:geometry,
          properties:row.value.doc
        });
        print--;
      } else skip--;
      if (!print && !skip) {
        print=parseInt(compressed_keys.shift());
        skip=parseInt(compressed_keys.shift());
      }
      row=getRow();
    }
  }
  return JSON.stringify({
    crs:{type:"name", properties:{name:"urn:ogc:def:crs:OGC:1.3:CRS84"}},
    name:filename, type:"FeatureCollection", features:features
  });
}
