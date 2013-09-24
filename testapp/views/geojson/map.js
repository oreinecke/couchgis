// Emits GeoJSON w/bbox and associated properties.

function(doc) {
  if (!doc.type) return;
  if ("GeoJSON" in doc) {
//  I need a copy that can be modified
    var GeoJSON=JSON.parse(JSON.stringify(doc.GeoJSON));
    GeoJSON.bbox=null;
    ;function update_bbox(obj) {
      if (typeof(obj)!="object") return;
      if (typeof(obj[0])=="number") {
        if (!GeoJSON.bbox) GeoJSON.bbox=obj.slice(0,1).concat(obj);
        var bbox=GeoJSON.bbox;
        bbox[0]=(bbox[0]<obj[0])?bbox[0]:obj[0];
        bbox[1]=(bbox[1]<obj[1])?bbox[1]:obj[1];
        bbox[2]=(bbox[2]>obj[0])?bbox[2]:obj[0];
        bbox[3]=(bbox[3]>obj[1])?bbox[3]:obj[1];
      } else for (field in obj) {
        if (["geometries", "coordinates", "features", "geometry"].indexOf(field)!=-1)
          update_bbox(obj[field]);
        if (field.match(/^[0-9]+$/))
          update_bbox(obj[field]);
      }
    }
    update_bbox(GeoJSON);
    emit(doc._id, {GeoJSON: GeoJSON});
  }
  var id=doc["GeoJSON_clone" in doc?"GeoJSON_clone":"_id"];
  var properties={_id:doc._id, type:doc.type};
  for (field in doc) {
    // fields with lowecase letters are english and kind of 'internal'
    if (!field.match(/^[A-Z]/)) continue;
    if (field.match("GeoJSON")) continue;
    properties[field]=doc[field];
  }
  emit(id, {doc:properties});
}
