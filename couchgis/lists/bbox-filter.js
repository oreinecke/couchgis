// Yields docs that have an associated GeoJSON bbox
// intersecting with the one specified in req.query.

function(head, req) {
  start({'headers':{'Content-Type':'application/json;charset=utf-8'}});
  var options=(req.query.options?JSON.parse(req.query.options):{});
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
  if (limit!==Infinity) proceed=function() {
    return (--limit);
  };
  // ii) This is a crude optionial check for similar geometry.
  var similarity=Infinity;
  if ('similarity' in options) similarity=options.similarity;
  var bbox_is_similar=pass;
  if (similarity!==Infinity) {
    similarity*=similarity;
    var bbox_0=bbox[0], bbox_1=bbox[1],
        bbox_2=bbox[2], bbox_3=bbox[3];
    bbox_is_similar=function(bbox2) {
      var d0=bbox_0-bbox2[0], d1=bbox_1-bbox2[1],
          d2=bbox_2-bbox2[2], d3=bbox_3-bbox2[3];
      return d0*d0+d1*d1<=similarity && d2*d2+d3*d3<=similarity;
    };
  }
  if ('error' in options) error=options.error;
  // iii) Check if bboxes intersect.
  var inside_bbox=function(bbox2) {
    if (bbox && bbox2) {
      var bbox_0=bbox[0], bbox_1=bbox[1],
          bbox_2=bbox[2], bbox_3=bbox[3];
      inside_bbox=function(bbox2) {
        return (bbox_0<=bbox2[2]&&bbox2[0]<=bbox_2&&
                bbox_1<=bbox2[3]&&bbox2[1]<=bbox_3);
      };
    } else inside_bbox=pass;
    return inside_bbox(bbox2);
  };
  // iv) Check spatial relation with req.body.GeoJSON.
  var relates=pass;
  // v) Send comma and newline as we reach the 2nd item.
  var send_separator=function() {
    send_separator=function() {send(',\n');};
  };
  send('{');
  var row;
  while (row=getRow()) {
    var GeoJSON=row.value.GeoJSON;
    var bbox2=GeoJSON.bbox;
    if (!inside_bbox(bbox2) || !bbox_is_similar(bbox2) || !relates(GeoJSON))
      continue;
    var errors=GeoJSON.errors || [GeoJSON.error];
    delete GeoJSON.errors;
    for (var e=(error?0:errors.length-1); e<errors.length; e++) {
      if (errors[e]<=error) {
        GeoJSON.error=errors[e];
        break;
      }
    }
    send_separator();
    send('"'+row.id+'":{"GeoJSON":'+JSON.stringify(GeoJSON)+'}');
    if (!proceed()) break;
  }
  return '}\n';
  // Uncomment this next line as soon as any(more) trouble arises: for some
  // reason, the list crashes if rows are left after the function returned.
  // This happens only if keys are specified in the request body.
  // if (/"keys"/.test(req.body)) while (getRow());
}

