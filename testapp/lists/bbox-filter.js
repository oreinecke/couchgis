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
  var time=false;
  if ('time' in options) time=options.time;
  var row={}, GeoJSON, last_GeoJSON, last_key, docs={};
  // Use function variables to work around useless repetition:
  // i) Check if we have to read more items.
  var proceed=function() {
    if (limit!=Infinity) proceed=function() {
      return (--limit);
    }; else proceed=function() { return true; };
    return proceed();
  };
  // ii) Check if document type matches selection.
  var type_matches=function(doc) {
    if (types) type_matches=function(doc) {
      return (types.indexOf(doc.type)!==-1);
    }; else type_matches=function() { return true; };
    return type_matches(doc);
  };
  // iib) Check if document time intersects with range
  var time_matches=function(doc) {
    if (time) {
      var range=require('views/lib/range');
      time=range.toRange(time);
      var intersects=range.intersects;
      time_matches=function() { return intersects(time, doc.time); };
    } else time_matches=function() { return true; };
    return time_matches(doc);
  }
  // iii) Check if geometry bbox is outside bbox.
  var outside_bbox=function(bbox2) {
    if ('bbox' in GeoJSON && bbox) outside_bbox=function(bbox2) {
      return (bbox[0]>bbox2[2]||bbox2[0]>bbox[2]||
              bbox[1]>bbox2[3]||bbox2[1]>bbox[3]);
    }; else outside_bbox=function() { return false; };
    return outside_bbox(bbox2);
  };
  // iv) Send comma and newline as we reach the 2nd item.
  var send_separator=function() {
    send_separator=function() {send(',\n');};
  };
  // v) shift viewport and coordinates by offset
  var shift_geometry=function() {
    if (offset && last_GeoJSON.type) {
      var utils=require('views/lib/utils');
      var eachPoint=utils.eachPoint;
      shift_geometry=function() {
        eachPoint(last_GeoJSON, function(coord) {
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
      docs=JSON.stringify(docs);
      if (last_GeoJSON && docs!="{}") {
        shift_geometry();
        send_separator();
        send('"'+last_key+'":{"GeoJSON":'+JSON.stringify(last_GeoJSON)
                              +',"docs":'+docs+'}');
        if (!proceed()) break;
      }
      docs={};
      last_GeoJSON=null;
    }
    if (!row) continue;
    last_key=row.key;
    var doc=row.value.doc;
    if (doc && type_matches(doc) && time_matches(doc)) {
      docs[doc._id]=doc;
      delete doc._id;
    }
    GeoJSON=row.value.GeoJSON;
    // evaluation of geomeric properties follows:
    if (GeoJSON==null) continue;
    // skip if outside bbox
    if (outside_bbox(GeoJSON.bbox)) continue;
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

