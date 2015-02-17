// Convert date to [YYYY,MM,DD] without any leading zeros.

function toDate(date) {
  date=date.match(/\d+/g);
  if (!date) return [];
  if (date[0].length!==4) date.reverse();
  for (var d=0;d!==date.length;d++)
    date[d]=+date[d];
  return date;
}

// Convert range or date string to range object.

function toRange(range) {
  if (!range) return { begin:[], end:[] };
  range=range.split('-');
  return {
    begin:toDate(range[0]),
    end:toDate(range[range.length-1])
  };
}

// Ranges object generator.

function Ranges(time) {
  var result;
  if (!time)
    result=[toRange()];
  else if (typeof(time)==="object")
    result=time.slice();
  else {
    result=String(time).split(/\s*[,;&]\s*/);
    for (var r=0;r<result.length;r++)
      result[r]=toRange(result[r]);
    result.sort(function(l,r) {
      l=l.begin; r=r.begin;
      for (var d=0;d<3;d++) {
        if (d===l.length && d===r.length) break;
        if (d===l.length || d===r.length)
          return (d===r.length) - (d===l.length);
        if (l[d]!==r[d]) return l[d]-r[d];
      }
    });
  }
  result.toString=toString;
  result.contains=contains;
  result.intersects=intersects;
  return result;
}
module.exports=Ranges;

// Convert range to string. If no day is given,
// MM/YYYY is returned, DD.MM.YYYY otherwise.

function toString() {
  for (var r=0;r<this.length;r++) {
    var begin=this[r].begin.reverse();
    var end=this[r].end.reverse();
    begin=begin.join(begin.length===2?'/':'.');
    end=end.join(end.length===2?'/':'.');
    if (begin===end) this[r]=begin;
    else this[r]=begin+'-'+end;
  }
  return this.join(', ');
}

// Returns true if Ranges contain b.

function contains(b) {
  var a=this.slice();
  b=Ranges(b);
  function greater(a, b) {
    for (var d=0;d<3;d++) {
      if (d===a.length) break;
      if (d===b.length) return true;
      if (a[d]<b[d]) break;
      if (a[d]>b[d]) return true;
    }
  }
  function smaller(a, b) {
    for (var d=0;d<3;d++) {
      if (d===a.length) break;
      if (d===b.length) return true;
      if (a[d]>b[d]) break;
      if (a[d]<b[d]) return true;
    }
  }
  var a0=a.shift();
  while (b.length) {
    var b0=b.shift(), b1=b0.begin;
    while (a0 && smaller(a0.end,b1))
      a0=a.shift();
    if ( !a0 || greater(a0.begin,b1) || smaller(a0.end,b0.end) )
      return false;
  }
  return true;
}

// Returns true if Ranges overlap with b.

function intersects(b) {
  var a=this.slice();
  b=Ranges(b);
  function greater(l,r) {
    for (var d=0;d<3;d++) {
      if (d===l.length || d===r.length) break;
      if (l[d]>r[d]) return true;
      if (l[d]<r[d]) break;
    }
  }
  var a0=a.shift();
  var b0=b.shift();
  while (a0 && b0)
    if (greater(a0.begin, b0.end)) b0=b.shift();
    else if (greater(b0.begin, a0.end)) a0=a.shift();
    else return true;
}
