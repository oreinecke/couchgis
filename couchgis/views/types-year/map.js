// Sample [type, year] if doc.time is limited
// to one year and [type, null] otherwhise.

function(doc) {
  var ranges=require('views/lib/ranges').toRanges(doc.time);
  var range=ranges.pop(), year=range.begin[0];
  if (year!==range.end[0]) year=null;
  while (range=ranges.pop()) {
    if (year!==range.begin[0]) year=null;
    if (year!==range.end[0]) year=null;
  }
  emit([doc.type, year]);
}
