// Yields docs that have an associated GeoJSON bbox
// intersecting with the one specified in req.body.

function(head, req) {
  start({'headers':{'Content-Type':'application/json;charset=utf-8'}});
  var body=(req.body=="undefined"?{}:JSON.parse(req.body));
  var bbox=body.bbox;
  // initialize to infinite bbox if none provided
  if (bbox==null || typeof(bbox)!="object")
    bbox=[-Infinity,-Infinity,Infinity,Infinity];
  // we need to limit output and server load
  var limit=body.limit;
  if (typeof(limit)!="number") limit=Infinity;
  var error=body.error;
  // allow reduced polygons to deviate up to this amount
  if (typeof(error)!="number") error=0.0;
  // and allow to filter types
  var types=body.types;
  if (typeof(types)!="object" || typeof(types.indexOf)!="function")
    types=null;
  var row={}, last_key, last_GeoJSON, docs=[];
  send('{');
  if (!limit) {
    send('}');
    return;
  }
  while (row) {
    if (row) row=getRow();
    if (last_key && (row==null || last_key!=row.key)) {
      if (last_GeoJSON && docs.length) {
        send('"'+last_key+'":'+JSON.stringify({GeoJSON:last_GeoJSON,docs:docs}));
        limit--;
        // don't look further if list is complete
        if (!limit) break;
        else if (row!=null) send(',\n');
      }
      docs=[];
      last_GeoJSON=null;
    }
    if (!row) continue;
    last_key=row.key;
    if ('doc' in row.value && (!types||types.indexOf(row.value.doc.type)!==-1))
      docs.push(row.value.doc);
    var GeoJSON=row.value.GeoJSON;
    // evaluation of geomeric properties follows:
    if (GeoJSON==null) continue;
    // skip if outside bbox
    if ('bbox' in GeoJSON && (bbox[0]>GeoJSON.bbox[2]||GeoJSON.bbox[0]>bbox[2]|| 
                              bbox[1]>GeoJSON.bbox[3]||GeoJSON.bbox[1]>bbox[3]))
      continue;
    if ('error' in GeoJSON) {
      // skip if geometry has too few details
      if (GeoJSON.error>error) continue;
      // skip if we already have a more detailed version
      if (last_GeoJSON && last_GeoJSON.error>=GeoJSON.error) continue;
    }
    last_GeoJSON=GeoJSON;
  }
  send('}');
  // Uncomment this next line as soon as any(more) trouble arises: for some
  // reason, the list crashes if rows are left after the function returned.
  // This happens only if keys are specified in the request body.
  // if (body.keys) while (getRow());
}

