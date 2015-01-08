// Render document as indented plaintext
// without geometry and revision.

function(doc, req) {
  delete doc.GeoJSON;
  delete doc._revisions;
  return function stringify(obj, spaces, lines) {
    for (var prop in obj)
      if (obj[prop] && typeof obj[prop]==="object") {
        lines.push(spaces+prop+':');
        stringify(obj[prop], spaces+'  ', lines);
      } else lines.push(spaces+prop+': '+obj[prop]);
    return lines;
  }(doc, "", []).join('\n');
}
