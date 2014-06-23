// Yields docs that have an associated GeoJSON bbox
// intersecting with the one specified in req.query.

function(head, req) {
  start({'headers':{'Content-Type':'application/json;charset=utf-8'}});
  var options=JSON.parse(req.query.options || '{}');
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
  function fail() {return false;}
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
    if (!bbox || !bbox2) return (inside_bbox=pass)();
    var bbox_0=bbox[0], bbox_1=bbox[1],
        bbox_2=bbox[2], bbox_3=bbox[3];
    switch(options.relation) {
    case "within":
      inside_bbox=function(bbox2) {
        return (bbox2[0]<=bbox_0&&bbox_2<=bbox2[2]&&
                bbox2[1]<=bbox_1&&bbox_3<=bbox2[3]);
      };
      break;
    case "contains":
      inside_bbox=function(bbox2) {
        return (bbox_0<=bbox2[0]&&bbox2[2]<=bbox_2&&
                bbox_1<=bbox2[1]&&bbox2[3]<=bbox_3);
      };
      break;
    default:
      inside_bbox=function(bbox2) {
        return (bbox_0<=bbox2[2]&&bbox2[0]<=bbox_2&&
                bbox_1<=bbox2[3]&&bbox2[1]<=bbox_3);
      };
      break;
    }
    return inside_bbox(bbox2);
  };
  // iv) Check spatial relation with req.body.GeoJSON.
  var relates=pass;
  if ('relation' in options) {
    if (req.body==="undefined") req.body='{}';
    var related_GeoJSON = JSON.parse(req.body).GeoJSON || {};
    var utils = related_GeoJSON.type && require('views/lib/utils');
    var flip_sideness=options.relation==="intersects";
    if ( related_GeoJSON.type && /within|intersects/.test(options.relation) ) {
      var points=[];
      utils.stripLastCoord(related_GeoJSON);
      utils.eachPoint(related_GeoJSON, function(coord) { points.push(coord); });
      relates=function(GeoJSON) {
        utils.unstripLastCoord(GeoJSON);
        var old_point=points[points.length-1];
        var inside=utils.pointInPolygon(GeoJSON, old_point) ^ flip_sideness;
        for (var p=points.length-2; inside && p!==-1; p--) {
          var point=points[p];
          inside=utils.pointInPolygon(GeoJSON, point, old_point, inside);
          old_point=point;
        }
        return inside;
      };
    }
    var related_GeoJSON_outside=relates;
    var related_Polygons=function(type, relation) {
      if (relation!=="intersects" && relation!=="contains") return;
      if (type) relates=fail;
      var inspect_types=["Polygon", "MultiPolygon"];
      if (inspect_types.indexOf(type)!==-1) return related_GeoJSON;
      if (type!=="GeometryCollection") return;
      var geometries=[];
      for (var g=0;g<related_GeoJSON.geometries.length;g++)
        if (inspect_types.indexOf(related_GeoJSON.geometries[g].type)!==-1)
          geometries.push(related_GeoJSON.geometries[g]);
      if (geometries.length) return {
        type:"GeometryCollection",
        geometries:geometries
      };
    }(related_GeoJSON.type, options.relation);
    if (related_Polygons) {
      utils.unstripLastCoord(related_Polygons);
      var old_point, inside=flip_sideness;
      relates=function(GeoJSON) {
        var points=[];
        utils.eachPoint(GeoJSON, function(coord) { points.push(coord); });
        var point=points.pop();
        do {
          inside=utils.pointInPolygon(related_Polygons, point, old_point, inside);
          old_point=point;
        } while (inside && (point=points.pop()) );
        return inside;
      };
    }
    var outside_related_Polygons=relates;
    if ( related_GeoJSON.type && options.relation==="intersects" ) {
      if (outside_related_Polygons===fail) relates=function(GeoJSON) {
        return !related_GeoJSON_outside(GeoJSON);
      }; else relates=function(GeoJSON) {
        return !outside_related_Polygons(GeoJSON) || !related_GeoJSON_outside(GeoJSON);
      };
    }
  }
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
    send('"'+row.id+'":{"GeoJSON":{"bbox":['+GeoJSON.bbox+'],"error":'+GeoJSON.error+'}}');
    if (!proceed()) break;
  }
  return '}\n';
  // Uncomment this next line as soon as any(more) trouble arises: for some
  // reason, the list crashes if rows are left after the function returned.
  // This happens only if keys are specified in the request body.
  // if (/"keys"/.test(req.body)) while (getRow());
}

