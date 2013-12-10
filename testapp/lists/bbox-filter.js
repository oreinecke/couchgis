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
  var types=false;
  if ('types' in options) types=options.types;
  // expect and return shifted coordinates
  var offset=false;
  if ('offset' in options) {
    offset=options.offset;
    // because bbox also has wrong coordinates
    for (var i=0;i<4;i++) bbox[i]-=offset[i%2];
  }
  var row={}, GeoJSON, last_GeoJSON, last_key, docs=[];
  // Use function variables to work around useless repetition:
  // i) Check if we have to read more items.
  var proceed=function() {
    if (limit!=Infinity) proceed=function() {
      return (--limit);
    }; else proceed=function() { return true; };
    return proceed();
  };
  // ii) Check if document type matches selection.
  var type_matches=function() {
    if (types) type_matches=function() {
      return (types.indexOf(row.value.doc.type)!==-1);
    }; else type_matches=function() { return true; };
    return type_matches();
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
  // v) shift viewport and coordinates by offset
  var shift_geometry=function() {
    if (offset && last_GeoJSON.type) {
      var utils=require('views/lib/utils');
      shift_geometry=function() {
        utils.eachPoint(last_GeoJSON, function(coord) {
          coord[0]+=offset[0];
          coord[1]+=offset[1];
        });
      };
    } else shift_geometry=function() {};
    shift_geometry();
  };
  send('{');
  while (row) {
    if (row) row=getRow();
    if (last_key && (row==null || last_key!=row.key)) {
      if (last_GeoJSON && docs.length) {
        shift_geometry();
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
  return '}\n';
  // Uncomment this next line as soon as any(more) trouble arises: for some
  // reason, the list crashes if rows are left after the function returned.
  // This happens only if keys are specified in the request body.
  // if (req.body.indexOf(/"keys"/)!=-1) while (getRow());
}

