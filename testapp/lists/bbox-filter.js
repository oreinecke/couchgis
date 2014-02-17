// Yields docs that have an associated GeoJSON bbox
// intersecting with the one specified in req.query.

function(head, req) {
  start({'headers':{'Content-Type':'application/json;charset=utf-8'}});
  var options=JSON.parse(req.query.options);
  // initialize to false if none provided
  var bbox=false;
  if ('bbox' in options) bbox=options.bbox;
  // we need to limit output and server load
  var limit=Infinity;
  if ('limit' in options) limit=options.limit;
  if (!limit) return '{}\n';
  // allow reduced polygons to deviate up to this amount
  var error=0.0;
  function pass() {return true;}
  // Use function variables to work around useless repetition:
  // i) Check if we have to read more items.
  var proceed=pass;
  if (limit!=Infinity) proceed=function() {
    return (--limit);
  };
  // ii) This is a crude optionial check for similar geometry.
  var similarity=Infinity;
  if ('similarity' in options) similarity=options.similarity;
  var bbox_is_similar=pass;
  if (similarity!=Infinity) {
    similarity*=similarity;
    bbox_is_similar=function(bbox2) {
      var d0=bbox[0]-bbox2[0], d1=bbox[1]-bbox2[1],
          d2=bbox[2]-bbox2[2], d3=bbox[3]-bbox2[3];
      return d0*d0+d1*d1<=similarity && d2*d2+d3*d3<=similarity;
    };
  }
  if ('error' in options) error=options.error;
  var row=getRow(), GeoJSON;
  // iii) Check if bboxes intersect.
  var inside_bbox=function() {
    if ('bbox' in GeoJSON && bbox) inside_bbox=function(bbox2) {
      return (bbox[0]<=bbox2[2]&&bbox2[0]<=bbox[2]&&
              bbox[1]<=bbox2[3]&&bbox2[1]<=bbox[3]);
    }; else inside_bbox=pass;
    return inside_bbox(GeoJSON.bbox);
  };
  // iv) Send comma and newline as we reach the 2nd item.
  var send_separator=function() {
    send_separator=function() {send(',\n');};
  };
  send('{');
  while (row) {
    GeoJSON=row.value.GeoJSON;
    if (inside_bbox(GeoJSON.bbox) && bbox_is_similar(GeoJSON.bbox)) {
      // scan rows for matching detail level
      var last_GeoJSON=row.value.GeoJSON;
      var last_key=row.key;
      row=getRow();
      while (row && row.key==last_key) {
        GeoJSON=row.value.GeoJSON;
        if (last_GeoJSON.error<GeoJSON.error && GeoJSON.error<error)
          last_GeoJSON=GeoJSON;
        row=getRow();
      }
      send_separator();
      send('"'+last_key+'":{"GeoJSON":'+JSON.stringify(last_GeoJSON)+'}');
      if (!proceed()) break;
    } else {
      // skip to next key if outside bbox
      var last_key=row.key;
      do row=getRow();
      while (row && row.key==last_key);
    }
  }
  return '}\n';
  // Uncomment this next line as soon as any(more) trouble arises: for some
  // reason, the list crashes if rows are left after the function returned.
  // This happens only if keys are specified in the request body.
  // if (/"keys"/.test(req.body)) while (getRow());
}

