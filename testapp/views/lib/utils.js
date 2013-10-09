// Dive into GeoJSON recursively and calculate a bounding box.

exports.bbox=function(GeoJSON) {
  var bbox=[Infinity,Infinity,-Infinity,-Infinity];
  ;function update_bbox(obj) {
    if (typeof(obj)!="object") return;
    if (typeof(obj[0])=="number") {
      bbox[0]=(bbox[0]<obj[0])?bbox[0]:obj[0];
      bbox[1]=(bbox[1]<obj[1])?bbox[1]:obj[1];
      bbox[2]=(bbox[2]>obj[0])?bbox[2]:obj[0];
      bbox[3]=(bbox[3]>obj[1])?bbox[3]:obj[1];
    } else for (var field in obj) {
      if (["geometries", "coordinates", "features", "geometry"].indexOf(field)!=-1)
        update_bbox(obj[field]);
      if (field.search(/^[0-9]+$/)>=0)
        update_bbox(obj[field]);
    }
  }
  update_bbox(GeoJSON);
  return bbox;
}

// Also define some kind of 'importance' here to choose
// what items to draw first. We use the bbox circumfence
// and we'll see how this goes.

exports.size=function(bbox) {
  return (bbox[2]-bbox[0])+(bbox[3]-bbox[1]);
}
