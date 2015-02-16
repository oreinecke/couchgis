// Sample [type, year] at "reasonable granularity".

function(doc) {
  if (!doc.type) return;
  var ranges=require('views/lib/ranges')(doc.time);
  var begin=ranges[0].begin.slice(0,1);
  var end=ranges.slice(-1)[0].end.slice(0,1);
  var granularity=(function(years) {
    if (years>50) return 100;
    if (years>10) return 50;
    if (years>5) return 10;
    if (years>1) return 5;
  }(end[0]-begin[0]));
  if (granularity) {
    begin[0]-=begin[0]%granularity;
    var remainder=end[0]%granularity;
    if (remainder) end[0]+=granularity-remainder;
  }
  var year=ranges.toString.apply([{begin:begin, end:end}]);
  emit([doc.type, year], {doc:{type:doc.type, ranges:ranges}});
}
