// Exports FeatureCollection in combination with views/geojson.js.

function(head, req) {
  var filename=req.query.filename || "export";
  var download='download' in req.query;
  var indexes=req.query.compressed_keys;
  if (indexes)
    indexes=require('views/lib/indexes').decompress(indexes);
  var range=require('views/lib/range');
  var include_revision='include_revision' in req.query;
  var fields=req.query.fields;
  var include_geojson_id='include_geojson_id' in req.query;
  var index=0;
  start({'headers':{
    'Content-Type':'application/json;charset=utf-8',
    'Content-Disposition':download?'attachment;filename="'+filename+'.geojson"':undefined
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
        var doc=row.value.doc;
        doc.time=range.toString(doc.time) || undefined;
        if (!include_revision) {
          delete doc._rev;
          delete doc._id;
        }
        for (var field in doc) {
          if (fields==null) break;
          if (field[0].search(/[A-ZÄÖÜ]/)!=0) continue;
          if (field.search(/^GeoJSON/)==0) continue;
          if (fields.search('(^|:)'+field+'(:|$)')!==-1) continue;
          delete doc[field];
        }
        if (include_geojson_id)
          doc.GeoJSON_clone=row.key[0];
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
