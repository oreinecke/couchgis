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
  // We expect keys have random items first (that have been returned at the
  // last query and are likely to be returned again) followed by remaining
  // items by decreasing size. If the client provides this 'sort threshold, we
  // may safely break out of the loop!
  var unsorted=body.unsorted;
  if (typeof(unsorted)!="number") unsorted=Infinity;
  var items=[];
  var row={}, last_key, last_GeoJSON, docs=[];
  while (row) {
    if (row) row=getRow();
    if (last_key && (row==null || last_key!=row.key)) {
      if (last_GeoJSON && docs.length) {
        var i=items.length;
        if (last_GeoJSON.size!=null)
          while (i && items[i-1].GeoJSON.size<last_GeoJSON.size) i--;
        items.splice(i,0,{id:last_key,GeoJSON:last_GeoJSON,docs:docs});
        items=items.slice(0,limit);
      }
      if (unsorted) unsorted--;
      docs=[];
      last_GeoJSON=null;
    }
    if (!row) continue;
    last_key=row.key;
    if ('doc' in row.value && (!types||types.indexOf(row.value.doc.type)!==-1))
      docs.push(row.value.doc);
    // evaluation of geomeric properties follows:
    if ('GeoJSON' in row.value) {
      var GeoJSON=row.value.GeoJSON;
      // skip if outside bbox
      if ('bbox' in GeoJSON && (bbox[0]>GeoJSON.bbox[2]||GeoJSON.bbox[0]>bbox[2]|| 
                                bbox[1]>GeoJSON.bbox[3]||GeoJSON.bbox[1]>bbox[3]))
        continue;
      // skip if geomtry is too small
      if ('size' in GeoJSON && items.length==limit &&
          GeoJSON.size<=items[items.length-1].GeoJSON.size) {
        // no need to look further if only smaller items are expected
        if (!unsorted) break;
        continue;
      }
      if ('error' in GeoJSON) {
        // skip if geometry is too detailed
        if (GeoJSON.error>error) continue;
        // skip if we already have a more detailed version
        if (last_GeoJSON && last_GeoJSON.error>=GeoJSON.error) continue;
      }
      last_GeoJSON=GeoJSON;
    }
  }
  send('{');
  for (var i=0;i<items.length;i++) {
    if (i) send(',\n');
    var item=items[i];
    send('"'+item.id+'":'+JSON.stringify({GeoJSON:item.GeoJSON,docs:item.docs}));
  }
  send('}\n');
}
