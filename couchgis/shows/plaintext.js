// Render document as indented plaintext; omit
// geometry and revisions, format _attachments.

function(doc, req) {
  delete doc.GeoJSON;
  delete doc._revisions;
  for (filename in doc._attachments) {
    var a=doc._attachments[filename];
    for ( var B=["GB", "MB", "KB", "B"]; a.length>=1024; B.pop() )
      a.length/=1024;
    doc._attachments[filename]=a.length.toFixed(1)+B.pop()+" ("+a.content_type+")";
  }
  return {
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:function stringify(obj, spaces, lines) {
      for (var prop in obj)
        if (obj[prop] && typeof obj[prop]==="object") {
          lines.push(spaces+prop+':');
          stringify(obj[prop], spaces+'  ', lines);
        } else lines.push(spaces+prop+':\t'+obj[prop]);
      return lines;
    }(doc, "", []).join('\n')
  };
}
