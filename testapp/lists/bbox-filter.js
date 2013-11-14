// Yields docs that have an associated GeoJSON bbox
// intersecting with the one specified in req.body.

function(head, req) {
  start({'headers':{'Content-Type':'application/json;charset=utf-8'}});
  var body=(req.body=="undefined"?{}:JSON.parse(req.body));
  var bbox=body.bbox;
  // initialize to false if none provided
  if (bbox==null || typeof(bbox)!="object") bbox=false;
  // we need to limit output and server load
  var limit=body.limit;
  if (typeof(limit)!="number") limit=Infinity;
  if (!limit) {
    send('{}\n');
    return;
  }
  var error=body.error;
  // allow reduced polygons to deviate up to this amount
  if (typeof(error)!="number") error=0.0;
  // and allow to filter types
  var types=body.types;
  if (typeof(types)!="object" || typeof(types.indexOf)!="function")
    types=null;
  var row={}, GeoJSON, last_GeoJSON, last_key, docs=[];
  var items={};
  // Use function variables to work around useless repetition:
  // i) Check if we have to read more items.
  var proceed=function() {
    if (limit!=Infinity) proceed=function() {
      return (--limit);
    }; else proceed=function() { return true; };
    return proceed();
  };
  // i) Check if document type matches selection.
  var type_matches=function() {
    if (types) type_matches=function() {
      return (types.indexOf(row.value.doc.type!==-1));
    }; else type_matches=function() { return true; };
    return type_matches();
  };
  // ii) Check if geometry bbox is outside bbox.
  var outside_bbox=function() {
    if ('bbox' in GeoJSON && bbox) outside_bbox=function() {
      return (bbox[0]>GeoJSON.bbox[2]||GeoJSON.bbox[0]>bbox[2]|| 
              bbox[1]>GeoJSON.bbox[3]||GeoJSON.bbox[1]>bbox[3]);
    }; else outside_bbox=function() { return false; };
    return outside_bbox();
  };
  // iii) Send comma and newline as we reach the 2nd item.
  var send_separator=function() {
    send_separator=function() {send(',\n');};
  };
  send('{');
  while (row) {
    if (row) row=getRow();
    if (last_key && (row==null || last_key!=row.key)) {
      if (last_GeoJSON && docs.length) {
        items[last_key]={GeoJSON:last_GeoJSON,docs:docs};
        send_separator();
        send('"'+last_key+'":{"GeoJSON":'+JSON.stringify(last_GeoJSON)
                             +',"docs":'+JSON.stringify(docs)+'}');
        if (!proceed()) break;
      }
      docs=[];
      last_GeoJSON=null;
    }
    if (!row) continue;
    last_key=row.key;
    var doc=row.value.doc;
    if (row.value.doc && type_matches()) docs.push(row.value.doc);
    GeoJSON=row.value.GeoJSON;
    // evaluation of geomeric properties follows:
    if (GeoJSON==null) continue;
    // skip if outside bbox
    if (outside_bbox()) continue;
    // skip if geometry has too few details
    if (GeoJSON.error>error) continue;
    // skip if we already have a more detailed version
    if (last_GeoJSON && last_GeoJSON.error>=GeoJSON.error) continue;
    last_GeoJSON=GeoJSON;
  }
  send('}\n');
  // Uncomment this next line as soon as any(more) trouble arises: for some
  // reason, the list crashes if rows are left after the function returned.
  // This happens only if keys are specified in the request body.
  // if (body.keys) while (getRow());
}

