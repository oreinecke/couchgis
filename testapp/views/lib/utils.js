// Apply action to every GeoJSON coordinate.

exports.eachCoord=function(GeoJSON, action) {
  ;function apply_action(obj) {
    if (typeof(obj)!="object") return;
    if (typeof(obj[0])=="number")
      action(obj);
    else for (var field in obj) {
      if (["geometries", "coordinates", "features", "geometry"].indexOf(field)!=-1)
        inspect(obj[field]);
      if (field.search(/^[0-9]+$/)>=0)
        inspect(obj[field]);
    }
  }
  apply_action(GeoJSON);
};

// Calculate a bounding box.

exports.bbox=function(GeoJSON) {
  var bbox=[Infinity,Infinity,-Infinity,-Infinity];
  exports.eachCoord(GeoJSON, function(coord) {
    bbox[0]=(bbox[0]<coord[0])?bbox[0]:coord[0];
    bbox[1]=(bbox[1]<coord[1])?bbox[1]:coord[1];
    bbox[2]=(bbox[2]>coord[0])?bbox[2]:coord[0];
    bbox[3]=(bbox[3]>coord[1])?bbox[3]:coord[1];
  });
  return bbox;
};

// Also define some kind of 'importance' here to choose
// what items to draw first. We use the bbox circumfence
// and we'll see how this goes.

exports.size=function(GeoJSON) {
  return (GeoJSON.bbox[2]-GeoJSON.bbox[0])+(GeoJSON.bbox[3]-GeoJSON.bbox[1]);
};
