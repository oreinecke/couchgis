// Emits bbox, size and associated document ids.

function(doc) {
  var utils=require('views/lib/utils');
  if ("GeoJSON" in doc) {
    var GeoJSON=utils.clone(doc.GeoJSON);
    utils.toWGS84(GeoJSON);
    utils.bbox(GeoJSON);
    var errors=[];
    // Provide list of reduced geometry errors as in _view/geojson.
    for (var error=Infinity;error>0;error=error*0.5) {
      error*=(error>=5e-6);
      var simplified_GeoJSON=utils.stripLastCoord(utils.simplify(utils.clone(GeoJSON),error));
      if (error<Infinity || simplified_GeoJSON.error==0)
        errors.push(simplified_GeoJSON.error);
      error=simplified_GeoJSON.error;
    }
    emit(doc._id, {GeoJSON:{bbox:GeoJSON.bbox, errors:errors}});
  }
  var ranges=require('views/lib/ranges');
}
