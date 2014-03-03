// Exports FeatureCollection in combination with views/geojson.js.

function(head, req) {
  var filename=req.query.filename || "export";
  var indexes=req.query.compressed_keys;
  if (indexes)
    indexes=require('views/lib/indexes').decompress(indexes);
  var range=require('views/lib/range');
  var index=0;
  start({'headers':{
    'Content-Type':'application/json;charset=utf-8',
    'Content-Disposition':'attachment;filename="'+filename+'.geojson"'
  }});
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
      if (!indexes || index===indexes[0]) {
        row.value.doc.time=range.toString(row.value.doc.time) || undefined;
        features.push({
          type:"Feature",
          geometry:geometry,
          properties:row.value.doc
        });
        if (indexes) indexes.shift();
      }
      row=getRow();
      index++;
    }
  }
  return JSON.stringify({
    crs:{type:"name", properties:{name:"urn:ogc:def:crs:OGC:1.3:CRS84"}},
    name:filename, type:"FeatureCollection", features:features
  });
}
