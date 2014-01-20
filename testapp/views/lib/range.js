// Convert date to [YYYY,MM,DD] without any leading zeros.

function toDate(date) {
  if (date=="") return [];
  date=date.split(/[./]/).reverse();
  for (var d=0;d<date.length;d++)
    date[d]=parseInt(date[d].replace(/^0/g, ""));
  return date;
}

// Convert range or date string to range object.

function toRange(range) {
  if (!range) return { begin:[], end:[] };
  if (typeof(range)=="object") return range;
  range=String(range).split('-');
  return {
    begin:toDate(range[0]),
    end:toDate(range[range.length-1])
  };
}
exports.toRange=toRange;

// Convert range to string. If no day is given,
// MM/YYYY is returned, DD.MM.YYYY otherwise.

exports.toString=function(range) {
  var begin=range.begin.reverse();
  var end=range.end.reverse();
  begin=begin.join(begin.length===2?'/':'.');
  end=end.join(end.length===2?'/':'.');
  if (begin===end) return begin;
  else return begin+'-'+end;
};

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

// Returns true if range a contains range b.

exports.contains=function(a, b) {
  a=toRange(a);
  var a1=a.begin, a2=a.end;
  b=toRange(b);
  var b1=b.begin, b2=b.end;
  return less_or_equal(a1,b1) && greater_or_equal(a2,b2);
};

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

// Return minimum range that includes a and b.

exports.expand=function(a, b) {
  a=toRange(a);
  var a1=a.begin, a2=a.end;
  b=toRange(b);
  var b1=b.begin, b2=b.end;
  return {
    begin:(less_or_equal(a1,b1)?a1:b1),
    end:(greater_or_equal(a2,b2)?a2:b2)
  };
};
