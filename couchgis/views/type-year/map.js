// Sample [type, year] at "reasonable granularity".

function(doc) {
  if (!doc.type) return;
  var ranges=require('views/lib/ranges');
  var range=function(ranges) {
    return {
      begin:ranges[0].begin.slice(0,1),
      end:ranges.pop().end.slice(0,1)
    };
  }(ranges.toRanges(doc.time));
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
  emit([doc.type, ranges.toString([range])]);
}
