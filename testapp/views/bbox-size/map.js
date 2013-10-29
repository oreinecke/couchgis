// Emits bbox, size and associated document ids.

function(doc) {
  var utils=require('views/lib/utils');
  var id=doc["GeoJSON" in doc?"_id":"GeoJSON_clone"];
  if (id==null) return;
  if (id===doc._id) {
    var GeoJSON=utils.clone(doc.GeoJSON);
    utils.toWGS84(GeoJSON);
    utils.bbox(GeoJSON);
    utils.size(GeoJSON);
    // Provide list of reduced geometry errors as in _view/geojson.
    for (var error=Infinity;error>0;error=error*0.5) {
      error*=(error>=5e-6);
      var simplified_GeoJSON=utils.simplify(utils.clone(GeoJSON),error);
      if (error<Infinity || simplified_GeoJSON.error==0)
        emit(id, {GeoJSON:{bbox:GeoJSON.bbox, size:GeoJSON.size, error:simplified_GeoJSON.error}});
      error=simplified_GeoJSON.error;
    }
  };
  emit(id, {doc:{_id:doc._id, type:doc.type}});
}
