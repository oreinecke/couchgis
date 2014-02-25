// Exports FeatureCollection in combination with views/geojson.js.

function(head, req) {
  var filename=req.query.filename || "export";
  start({'headers':{
    'Content-Type':'application/json;charset=utf-8',
    'Content-Disposition':'attachment;filename="'+filename+'.geojson"'
  }});
  var features=[];
  var row=getRow();
  while (row) {
    while (row.key[1]!==0.0) row=getRow();
    var geometry=row.value.GeoJSON;
    delete geometry.error;
    delete geometry.crs;
    while (!row.value.doc) row=getRow();
    while (row && row.value.doc) {
      features.push({
        type:"Feature",
        geometry:geometry,
        properties:row.value.doc
      });
      row=getRow();
    }
  }
  return JSON.stringify({
    crs:{type:"name", properties:{name:"urn:ogc:def:crs:OGC:1.3:CRS84"}},
    name:filename, type:"FeatureCollection", features:features
  });
}
