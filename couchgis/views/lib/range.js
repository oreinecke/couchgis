// Convert date to [YYYY,MM,DD] without any leading zeros.

function toDate(date) {
  if (date=="") return [];
  date=date.split(/[./]/);
  if (!/[0-9]{4}/.test(date[0])) date.reverse();
  for (var d=0;d<date.length;d++)
    date[d]=parseInt(date[d].replace(/^0/g, ""));
  return date;
}

// Convert range or date string to range object.

function toRange(range) {
  if (!range) return { begin:[], end:[] };
  if (typeof(range)==="object") return range;
  range=String(range).split('-');
  return {
    begin:toDate(range[0]),
    end:toDate(range[range.length-1])
  };
}
exports.toRange=toRange;

// Convert list of ranges to ranges object.

function toRanges(ranges) {
  if (!ranges) return [toRange()];
  if (typeof(ranges)==="object") return range;
  ranges=String(ranges).split(/\s*[,;&]\s*/);
  for (var r=0;r<ranges.length;r++)
    ranges[r]=toRange(ranges[r]);
  return ranges.sort(function(a,b) {
    return greater_or_equal(a.begin, b.begin) || -1;
  });
}
exports.toRanges=toRanges;

// Convert range to string. If no day is given,
// MM/YYYY is returned, DD.MM.YYYY otherwise.

exports.toString=function(ranges) {
  for (var r=0;r<ranges.length;r++) {
    var begin=ranges[r].begin.reverse();
    var end=ranges[r].end.reverse();
    begin=begin.join(begin.length===2?'/':'.');
    end=end.join(end.length===2?'/':'.');
    if (begin===end) ranges[r]=begin;
    else ranges[r]=begin+'-'+end;
  }
  return ranges.join(', ');
}

// Returns true if date a<=b.

function less_or_equal(a, b) {
  for (var d=0;d<3;d++) {
    if (d==a.length) return true;
    if (d==b.length) return false;
    if (a[d]<b[d]) return true;
    if (a[d]>b[d]) return false;
  }
  return true;
}

// Returns true if date a>=b, not equal to calling less_or_equal(b, a).

function greater_or_equal(a, b) {
  for (var d=0;d<3;d++) {
    if (d==a.length) return true;
    if (d==b.length) return false;
    if (a[d]>b[d]) return true;
    if (a[d]<b[d]) return false;
  }
  return true;
}

// Returns true if ranges a contain ranges b.

exports.contains=function(a, b) {
  a=toRanges(a);
  b=toRanges(b);
  var a0=a.shift();
  while (b.length) {
    var b0=b.shift(), b1=b0.begin;
    while (a0 && !greater_or_equal(a0.end,b1))
      a0=a.shift();
    if ( !a0 || !less_or_equal(a0.begin,b1) || !greater_or_equal(a0.end,b0.end) )
      return false;
  }
  return true;
}

// Returns true if range a overlaps with range b.

exports.intersects=function(a, b) {
  a=toRange(a);
  var a1=a.begin, a2=a.end;
  b=toRange(b);
  var b1=b.begin, b2=b.end;
  for (var d=0;d<3;d++) {
    if (d==a1.length || d==b2.length) break;
    if (a1[d]>b2[d]) return false;
    if (a1[d]<b2[d]) break;
  }
  for (var d=0;d<3;d++) {
    if (d==b1.length || d==a2.length) break;
    if (b1[d]>a2[d]) return false;
    if (b1[d]<a2[d]) break;
  }
  return true;
};
