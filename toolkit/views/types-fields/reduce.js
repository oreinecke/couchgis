// If queried with group_level=1, it returns the union of
// all fields ever used for one specific document type.

function(keys, values, rereduce) {
  var result=[];
  var K=(rereduce?values.length:keys.length);
  for (var k=0;k<K;k++) {
    fields=(rereduce?values[k]:keys[k][0][1].split('/'));
    for (var f=0;f<fields.length;f++) {
      var field=fields[f];
      if (result.indexOf(field)==-1) result.push(field);
    }
  }
  return result.sort();
}

