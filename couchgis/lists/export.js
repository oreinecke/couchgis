// Exports FeatureCollection in combination with views/geojson.js.

function(head, req) {
  var filename=req.query.filename || "export";
  var filetype=({
    xml:"xml", geojson:"geojson"
  })[req.query.filetype] || "xml";
  var download='download' in req.query;
  var indexes=req.query.compressed_keys;
  if (indexes)
    indexes=require('views/lib/indexes').decompress(indexes).reverse();
  else indexes=[];
  var ranges=require('views/lib/ranges');
  var path=require('views/lib/path');
  var include_revision='include_revision' in req.query;
  var fields=req.query.fields;
  var include_geojson_id='include_geojson_id' in req.query;
  var EPSG=req.query.EPSG;
  var index=0, next_index=indexes.pop();
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
  var doc_ids=[];
  while (row) {
    while (row && row.value.GeoJSON && row.value.GeoJSON.error!==0.0)
      row=getRow();
    var geometry=row.value.GeoJSON || {};
    delete geometry.error;
    delete geometry.bbox;
    // If no EPSG was specified in the query, export to the first EPSG of all
    // geometries; Chances are, that it's the only EPSG at the same time. In
    // this case projecting coordinates back and forth causes a numeric
    // inaccuracy of 2mm (otherwhise 1m).
    if (!EPSG) EPSG=geometry.EPSG;
    delete geometry.EPSG;
    while (row && !row.value.doc) row=getRow();
    for (var doc; row && (doc=row.value.doc); row=getRow()) {
      if (next_index===undefined || next_index===index++)
        next_index=indexes.pop();
      else continue;
      if (doc_ids.indexOf(doc._id)!==-1) continue;
      if (filetype==="xml") doc_ids.push(doc._id);
      doc.time=ranges.toString(doc.time) || undefined;
      if (!include_revision) {
        delete doc._rev;
        delete doc._id;
      }
      if (!include_geojson_id)
        delete doc.GeoJSON_clone;
      else if (!doc.GeoJSON_clone)
        doc.GeoJSON_clone=row.key[0];
      // create flat column names from nested objects
      (function flatten(obj, fields) {
        if (!obj || typeof obj!=="object")
          doc[path.encode(fields)]=obj;
        else for (var prop in obj) {
          var obj2=obj[prop];
          delete obj[prop];
          flatten(obj2, fields.concat([prop]));
        }
      })(doc, []);
      for (var field in doc) {
        if (fields==null) break;
        if (!/^[A-ZÄÖÜ]/.test(field)) continue;
        if (/^GeoJSON/.test(field)) continue;
        if (fields.search('(^|:)'+field.replace(/[.+()]/g, "\\$&")+'(:|$)')===-1)
          delete doc[field];
      }
      features.push({
        type:"Feature",
        properties:doc,
        geometry:geometry
      });
    }
  }
  switch(filetype) {
  case "geojson":
    var utils=require('views/lib/utils');
    var projector=require('views/lib/proj4')(utils.projection[EPSG]);
    for (var f=0, geometry=null; f<features.length; f++) {
      // ensure each geometry is projected only once
      if (geometry===features[f].geometry) continue;
      geometry=features[f].geometry;
      utils.eachPoint(geometry, function(coord) {
        var newCoord=projector.forward(coord);
        coord[0]=newCoord[0];
        coord[1]=newCoord[1];
      });
    }
    return JSON.stringify(utils.unstripLastCoord({
      name:filename, type:"FeatureCollection",
      crs:{type:"name", properties:{name:"urn:ogc:def:crs:EPSG::"+EPSG}},
      features:features
    }));
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
      fields=["type", "time"].concat(fields?fields.split(':'):[]);
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
    send('<Row ss:AutoFitHeight="0" ss:Height="24">');
    for (var g=0;g<fields.length;g++)
      send('<Cell><Data ss:Type="String">'+path.pretty(fields[g],'\n')+'</Data></Cell>');
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
          send('<Cell><Data ss:Type="String">'+data.replace(/&/g,'&amp;')
                                                   .replace(/</g,'&lt;')
                                                   .replace(/>/g,'&gt;')+'</Data></Cell>');
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
