// Yields docs that have an associated GeoJSON bbox
// intersecting with the one specified in req.body.

function(head, req) {
  start({'headers':{'Content-Type':'application/json;charset=utf-8'}});
  var body=JSON.parse(req.body);
  var bbox=body.bbox;
  // initialize to infinite bbox if none provided
  if (bbox==null || typeof(bbox)!="object")
    bbox=[-Infinity,-Infinity,Infinity,Infinity];
  // we need to limit output and server load
  var limit=body.limit;
  if (limit==null) limit=Infinity;
  // and allow to filter types
  var types=body.types;
  if (typeof(types)!="object")
    types=null;
  var items=[];
  var row={}, last_row=null, docs=[], GeoJSON, size;
  while (row) {
    if (row) row=getRow();
    if (last_row && (row==null || last_row.key!=row.key)) {
      if ( items.length!=limit || size > items[items.length-1] )
      if ( docs.length>0 )
      if ( bbox[0]<=GeoJSON.bbox[2] && GeoJSON.bbox[0]<=bbox[2] && 
           bbox[1]<=GeoJSON.bbox[3] && GeoJSON.bbox[1]<=bbox[3]) {
        var item={size:size,id:last_row.key,GeoJSON:GeoJSON,docs:docs};
        items.push(item);
        // performance may be improved here
        // with binary search or something
        items=items.sort(function(a,b){return a.size<b.size;}).slice(0,limit);
      }
      docs=[];
    }
    if (!row) continue;
    last_row=row;
    if ('doc' in row.value && (!types||types.indexOf(row.value.doc.type)!==-1))
      docs.push(row.value.doc);
    if ('GeoJSON' in row.value) {
      GeoJSON=row.value.GeoJSON;
      size=row.value.size;
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
