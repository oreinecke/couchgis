// If queried with group_level=1, it returns the union of
// all fields ever used for one specific document type.

function(keys, values, rereduce) {
  var L=[];
  var K=(rereduce?values.length:keys.length);
  if (!rereduce) {
    values=[];
    for (var k=0;k<K;k++)
      values.push(keys[k][0][1].split('/'));
  }
  values=values.sort().reverse();
  for (var k=0;k<K;k++) {
    var fields=values[k];
    if (fields.length<2) continue; // that is super
    var attached=false;
    for (var i=0;i<L.length;i++) {
      var l=L[i], f, g;
      f=fields.indexOf(l[0]);
      // attach to head
      if (f!=-1) {
        L[i]=l=fields.slice(0,f).concat(l);
        if (f>0) fields=l;
      }
      // attach to tail
      f=fields.indexOf(l[l.length-1])
      if (f!=-1) {
        attached=true;
        L[i]=l=l.concat(fields.slice(f+1));
        L[L.indexOf(fields)]=[];
        if (f<fields.length-1) fields=l;
      }
      // insert
      for (var j=0;j<l.length-1;j++) {
        f=fields.indexOf(l[j]);
        if (f==-1) continue;
        attached=true;
        g=fields.indexOf(l[j+1]);
        if (g==-1||g==f+1) continue;
        L[i]=l=l.slice(0,j).concat(fields.slice(f,g)).concat(l.slice(j+1));
        j+=g-f;
      }
    }
    if (!attached) {
      L.push(fields);
    }
  }
  var result=[];
  for (var i=0;i<L.length;i++)
    result=result.concat(L[i]);
  return result;
}
