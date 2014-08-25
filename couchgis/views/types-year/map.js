// Sample [type, year] at "reasonable granularity".

function(doc) {
  var ranges=require('views/lib/ranges').toRanges(doc.time);
  var range=ranges.shift();
  range.begin.splice(1);
  if (ranges.length)
    range.end=ranges.pop().end.slice(0,1);
  else range.end.splice(1);
  var granularity=(function(years) {
    if (years>50) return 100;
    if (years>10) return 50;
    if (years>5) return 10;
    if (years>1) return 5;
  }(range.end[0]-range.begin[0]));
  if (granularity) {
    range.begin[0]-=range.begin[0]%granularity;
    var remainder=range.end[0]%granularity;
    if (remainder) range.end[0]+=granularity-remainder;
  }
  emit([doc.type, [range]]);
}
