// Exports FeatureCollection in combination with views/geojson.js.

function(head, req) {
  var filename=req.query.filename || "export";
  var filetype=({
    xml:"xml", geojson:"geojson"
  })[req.query.filetype] || "xml";
  var download='download' in req.query;
  var indexes=req.query.compressed_keys;
  if (indexes)
    indexes=require('views/lib/indexes').decompress(indexes);
  var range=require('views/lib/range');
  var include_revision='include_revision' in req.query;
  var fields=req.query.fields;
  var include_geojson_id='include_geojson_id' in req.query;
  var index=0;
  start({'headers':{
    'Content-Type':{
      geojson:'application/json;charset=utf-8',
      xml:'text/xml'
    }[filetype],
    'Content-Disposition':{
      true:'attachment;filename="'+filename+'.'+filetype
    }[download]
  }});
  var features=[];
  var row=getRow();
  while (row) {
    while (row && row.value.GeoJSON && row.value.GeoJSON.error!==0.0)
      row=getRow();
    var geometry=row.value.GeoJSON || {};
    delete geometry.error;
    delete geometry.crs;
    while (row && !row.value.doc) row=getRow();
    while (row && row.value.doc) {
      if (!indexes || index===indexes[0]) {
        var doc=row.value.doc;
        doc.time=range.toString(doc.time) || undefined;
        if (!include_revision) {
          delete doc._rev;
          delete doc._id;
        }
        if (include_geojson_id)
          doc.GeoJSON_clone=row.key[0];
        // create flat column names from nested objects
        (function flatten(obj, fields) {
          if (obj && typeof(obj)!=="object") {
            // quote field names with dots in it
            for (var f=0;f<fields.length;f++)
              if (/\./.test(fields[f])) fields[f]="'"+fields[f]+"'";
            doc[fields.join('.')]=obj;
          } else for (var prop in obj) {
            var obj2=obj[prop];
            delete obj[prop];
            flatten(obj2, fields.concat([prop]));
          }
        })(doc, []);
        for (var field in doc) {
          if (fields==null) break;
          if (!/^[A-ZÄÖÜ]/.test(field) continue;
          if (/^GeoJSON/.test(field)) continue;
          if (fields.search('(^|:)'+field+'(:|$)')!==-1) continue;
          delete doc[field];
        }
        features.push({
          type:"Feature",
          geometry:geometry,
          properties:row.value.doc
        });
        if (indexes) indexes.shift();
      }
      row=getRow();
      index++;
    }
  }
  switch(filetype) {
  case "geojson":
    return JSON.stringify({
      crs:{type:"name", properties:{name:"urn:ogc:def:crs:OGC:1.3:CRS84"}},
      name:filename,
      features:features,
      type:"FeatureCollection"
    });
  case "xml":
    if (fields==null) {
      fields=[];
      // move _id, _rev, GeoJSON_clone to the left
      if (include_geojson_id) fields.unshift("GeoJSON_clone");
      if (include_revision) fields=["_id", "_rev"].concat(fields);
      for (var f=0;f<features.length;f++)
      for (var prop in features[f].properties)
        if (fields.indexOf(prop)===-1) fields.push(prop);
    } else {
      fields=["type", "time"].concat(fields.split(':'));
      if (include_geojson_id) fields.unshift("GeoJSON_clone");
      if (include_revision) fields=["_id", "_rev"].concat(fields);
    }
    send('<?xml version="1.0"?>');
    send('<?mso-application progid="Excel.Sheet"?>');
    send('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
    send(' xmlns:o="urn:schemas-microsoft-com:office:office"');
    send(' xmlns:x="urn:schemas-microsoft-com:office:excel"');
    send(' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"');
    send(' xmlns:html="http://www.w3.org/TR/REC-html40">');
    send('<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">');
    send(' <Version>14.00</Version>');
    send('</DocumentProperties>');
    send('<OfficeDocumentSettings xmlns="urn:schemas-microsoft-com:office:office">');
    send('</OfficeDocumentSettings>');
    send('<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">');
    send('</ExcelWorkbook>');
    send('<Worksheet ss:Name="'+filename+'">');
    send('<Table>');
    send('<Row>');
    for (var g=0;g<fields.length;g++)
      send('<Cell><Data ss:Type="String">'+fields[g]+'</Data></Cell>');
    send('</Row>');
    for (var f=0;f<features.length;f++) {
      send('<Row>');
      var properties=features[f].properties;
      for (var g=0;g<fields.length;g++) {
        var field=fields[g];
        var data=properties[field];
        if (typeof data==="number")
          send('<Cell><Data ss:Type="Number">'+data+'</Data></Cell>');
        else if (typeof data==="string")
          send('<Cell><Data ss:Type="String">'+data+'</Data></Cell>');
        else if (typeof data==="boolean")
          send('<Cell><Data ss:Type="Boolean">'+data?1:0+'</Data></Cell>');
        else send('<Cell/>');
      }
      send('</Row>');
    }
    send('</Table>');
    send('</Worksheet>');
    return '</Workbook>';
  }
}
