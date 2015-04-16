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
  var path=require('views/lib/path');
  var include_revision='include_revision' in req.query;
  var field_set=req.query.fields;
  if (field_set!==undefined)
    field_set=':'+field_set+':';
  var include_geojson_id='include_geojson_id' in req.query;
  var EPSG=req.query.EPSG;
  var include_WKT='include_WKT' in req.query;
  var include_JSON='include_JSON' in req.query;
  var index=0, next_index=indexes.pop();
  start({headers:{
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
  var doc_ids={};
  while (row) {
    while (row && row.value.GeoJSON && row.value.GeoJSON.error!==0.0)
      row=getRow();
    var geometry=row.value.GeoJSON || {};
    delete geometry.error;
    delete geometry.bbox;
    // If no EPSG was specified in the query, export to the first EPSG of all
    // geometries; Chances are, that it's the only EPSG at the same time.
    if (!EPSG) EPSG=geometry.EPSG;
    delete geometry.EPSG;
    while (row && !row.value.doc) row=getRow();
    for (var doc; row && (doc=row.value.doc); row=getRow()) {
      if (next_index===undefined || next_index===index++)
        next_index=indexes.pop();
      else continue;
      if (doc._id in doc_ids) continue;
      if (filetype==="xml") doc_ids[doc._id]=true;
      delete doc.info;
      delete doc.ranges;
      if (!include_revision) {
        delete doc._rev;
        delete doc._id;
      }
      if (!include_geojson_id)
        delete doc.GeoJSON_clone;
      else if (!doc.GeoJSON_clone)
        doc.GeoJSON_clone=row.key[0];
      if (include_JSON) {
        var _JSON={};
        for (var field in doc) _JSON[field]=doc[field];
        delete _JSON._id;
        delete _JSON._rev;
        delete _JSON.GeoJSON_clone;
        doc._JSON=JSON.stringify(_JSON);
      }
      // create flat column names from nested objects
      (function flatten(obj, fields) {
        if (!obj || typeof obj!=="object")
          doc[path.encode(fields)]=obj;
        else for (var prop in obj) {
          var obj2=obj[prop];
          delete obj[prop];
          fields.push(prop);
          flatten(obj2, fields);
          fields.pop(prop);
        }
      }(doc, []));
      // remove fields that aren't in field_set
      for (var field in doc) {
        if (field_set===undefined) break;
        if (!/^[A-ZÄÖÜ]/.test(field)) continue;
        if (/^GeoJSON/.test(field)) continue;
        if (field_set.indexOf(':'+field.replace(/\.[0-9]+/g, '')+':')===-1)
          delete doc[field];
      }
      features.push({
        type:"Feature",
        properties:doc,
        geometry:geometry
      });
    }
  }
  if (filetype==="geojson" || include_WKT) {
    var utils=require('views/lib/utils');
    var proj4=utils.proj4(utils.projection[EPSG]);
    for (var f=0, geometry=null; f<features.length; f++) {
      // ensure each geometry is projected only once
      if (geometry===features[f].geometry) continue;
      geometry=features[f].geometry;
      utils.eachPoint(geometry, function(coord) {
        var newCoord=proj4.forward(coord);
        coord[0]=newCoord[0];
        coord[1]=newCoord[1];
      });
    }
  }
  switch(filetype) {
  case "geojson":
    return JSON.stringify(utils.unstripLastCoord({
      name:filename, type:"FeatureCollection",
      crs:{type:"name", properties:{name:"urn:ogc:def:crs:EPSG::"+EPSG}},
      features:features
    }));
  case "xml":
    var columns=["type", "time"];
    if (include_JSON) columns.unshift("_JSON");
    if (include_WKT) columns.unshift("_WKT");
    if (include_geojson_id) columns.unshift("GeoJSON_clone");
    if (include_revision) columns.unshift("_id", "_rev");
    for (var f=0;f<features.length;f++)
    for (var prop in features[f].properties)
      if (columns.indexOf(prop)===-1) columns.push(prop);
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
    for (var g=0;g!==columns.length;g++)
      send('<Cell><Data ss:Type="String">'+path.pretty(columns[g],'&#13;&#10;')+'</Data></Cell>');
    send('</Row>');
    for (var f=0;f<features.length;f++) {
      send('<Row>');
      var properties=features[f].properties;
      if (include_WKT) {
        var geometry=features[f].geometry, coordinates=geometry.coordinates;
        properties._WKT=geometry.type.toUpperCase() + function toWKT(c) {
          if (typeof c[0]==="number")
            return c[0].toPrecision(13)+' '+c[1].toPrecision(13);
          var part=toWKT(c[0]);
          for (var i=1;i!==c.length;i++) part+=', '+toWKT(c[i]);
          return '('+part+')';
        }(geometry.type==="Point" ? [coordinates] : coordinates);
      }
      for (var g=0;g!==columns.length;g++) {
        var data=properties[columns[g]], type=typeof data;
        if (type==="number")
          send('<Cell><Data ss:Type="Number">'+data+'</Data></Cell>');
        else if (type==="string")
          send('<Cell><Data ss:Type="String">'+data.replace(/&/g,'&amp;')
                                                   .replace(/\n/g,'&#13;&#10;')
                                                   .replace(/</g,'&lt;')
                                                   .replace(/>/g,'&gt;')+'</Data></Cell>');
        else if (type==="boolean")
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
