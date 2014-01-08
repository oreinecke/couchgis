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
  if ('error' in options) error=options.error;
  var row=getRow(), GeoJSON, last_GeoJSON, last_key;
  // Use function variables to work around useless repetition:
  // i) Check if we have to read more items.
  var proceed=function() {
    if (limit!=Infinity) proceed=function() {
      return (--limit);
    }; else proceed=function() { return true; };
    return proceed();
  };
  // iii) Check if geometry bbox is outside bbox.
  var outside_bbox=function() {
    if ('bbox' in GeoJSON && bbox) outside_bbox=function() {
      return (bbox[0]>GeoJSON.bbox[2]||GeoJSON.bbox[0]>bbox[2]||
              bbox[1]>GeoJSON.bbox[3]||GeoJSON.bbox[1]>bbox[3]);
    }; else outside_bbox=function() { return false; };
    return outside_bbox();
  };
  // iv) Send comma and newline as we reach the 2nd item.
  var send_separator=function() {
    send_separator=function() {send(',\n');};
  };
  send('{');
  while (row) {
    GeoJSON=row.value.GeoJSON;
    if (outside_bbox()) {
      // skip to next key if outside bbox
      last_key=row.key;
      do row=getRow();
      while (row && row.key==last_key);
    } else {
      // scan rows for matching detail level
      last_GeoJSON=row.value.GeoJSON;
      last_key=row.key;
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
    }
  }
  return '}\n';
  // Uncomment this next line as soon as any(more) trouble arises: for some
  // reason, the list crashes if rows are left after the function returned.
  // This happens only if keys are specified in the request body.
  // if (req.body.indexOf(/"keys"/)!=-1) while (getRow());
}

