// Yields docs who have an associated GeoJSON bbox
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
  send('{');
  var row={}, last_row=null, docs=[], GeoJSON=null, count=0;
  while (row) {
    if (row) row=getRow();
    log({row:row, last_row:last_row, GeoJSON:GeoJSON});
    if (last_row && (row==null || last_row.key!=row.key)) {
      if ( bbox[0]<=GeoJSON.bbox[2] && GeoJSON.bbox[0]<=bbox[2] && 
           bbox[1]<=GeoJSON.bbox[3] && GeoJSON.bbox[1]<=bbox[3]) {
        if (count) send(',\n');
        send('"'+last_row.key+'":'+JSON.stringify({docs:docs,GeoJSON:GeoJSON}));
        count++;
        if (count>=limit) break;
      }
      docs=[];
      GeoJSON=null;
    }
    if (!row) continue;
    last_row=row;
    if ('doc' in row.value) docs.push(row.value.doc);
    if ('GeoJSON' in row.value) GeoJSON=row.value.GeoJSON;
  }
  send('}\n');
}
