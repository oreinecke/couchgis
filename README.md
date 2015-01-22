Couch-GIS
=========

A simple [CouchDB](http://couchdb.apache.org/) application to display and edit
geo-spatial data that links to ordinary JSON documents. It uses the Google Maps
API and works well with [LibreOffice](http://www.libreoffice.org/) Calc for
bulk document editing, and [Quantum GIS](http://qgis.org/en/site/) for shape
import/export.

Installation
------------

To install, push the couchgis directory into your couchdb using
[erica](https://github.com/benoitc/erica):

```
$ erica push couchgis http://localhost:5984/db
==> couchgis (push)
==> Successfully pushed. You can browse it at: http://localhost:5984/db/_design/
couchgis-v1.0/index.html
```

If you don't have erica installed, use the compiled design document that is
shipped with every release (how nice of me!). Just unzip and post the json
file:

```
$ gzip -dc couchgis-v1.0.json.gz | curl -XPOST localhost:5984/db \
  -HContent-type:application/json -d@-
```

Or, if you don't even have gzip or curl or a shell, just replicate a
release from http://lsh1908.selfhost.eu:5984/release (Mo-Th 12-6p.m.) or
https://reinecke.iriscouch.com/release (as long as I am below my monthly
quota).

If you happen to have the [GeoCouch](https://github.com/couchbase/geocouch)
extension installed into your CouchDB, Couch-GIS will automatically use its
faster bounding box filter.

Document Structure
------------------

The following easy-to-read JSON document demonstrates reserved properties and
some conventions:

```json
{
  "_id": "ab45", "_rev": "2-8945",
  "GeoJSON_clone": "e4af",
  "type": "Vegetation",
  "time": "2003/05/02-2004 & 2001",
  "Vegetation": "Coniferous Woodland",
  "Area"             : 20.0,
  "Net Area"         : 19.3,
  "Use by Area": {
    "Hunting Ground" : 17.0,
    "Logging"        :  2.3
  }
}
```

Fields that contain actual document content must start with a capital letter.
This isn't as much of a problem in German as it is in English. Any other field
is suspected to be internal by default (which might probably be a bad design
decision).

Reserved fields are:

###`doc._id` and `doc._rev`

CouchDB creates these automatically, so I do not recommend ever trying to set
them when uploading/editing documents.

###`doc.GeoJSON` or `doc.GeoJSON_clone`

The former must be set to a valid [GeoJSON][1] object and the latter to one or
more ids of existing documents that all have the `GeoJSON` property (there is
no way to follow a chain of ids). Needless to say, using both at the same time
makes no sense and results in a document validation error.

I introduced the geometry clone because I was blown away by how people working
with GIS databases either use duplicate geometries for two rows of the property
table (Seriously! The same geometry was drawn twice!!!), or are working around
that problem by using more and more columns for the same property at a
different time.

A document can even be attached to more than one geometry, as long as ids are
separated by comma/space/ampersand/semicolon. Such a document will be listed
twice or more in the map page, but is exported once into a spreadsheet.

Line comments are supported to help with long id lists ([#%] that is). This way
you can leave a description next to each rather meaningless document id.

`doc.GeoJSON.type` is restricted to Point, LineString, Polygon,
MultiLineString, MultiPolygon. It could make sense, and it would be easy, to
add MultiPoint and GeometryCollection. I will get to it as soon as I need
those. On the other hand, neither Feature nor FeatureCollection will ever be
needed. Actual document content is already stored one level above.

`doc.GeoJSON.crs` must be a [named CRS][2] and so far I have introduced a
couple of coordinate reference systems in [here](couchgis/views/lib/utils.js)
to which you can set `doc.GeoJSON.crs.properties.name`:
- EPSG:31469
- urn:ogc:def:crs:EPSG::31468
- urn:ogc:def:crs:EPSG::3397
- etc. Actually there's more.

ArcGIS seems to stick to legacy identifiers and QGIS uses OGC CRS URNs, so I
just check for EPSG and one or two colons and a bunch of digits.

As a side note, it seems that ArgGIS and QGIS have a different definition of
WGS84. Also, QGIS and [Proj4js][3] (which I use for coordinate transformation)
seem to coincide on that definition. So it is safe to import data in WGS84, as
long as it is from QGIS, but for ArcGIS I cannot guarantee anything.

[1]: http://geojson.org/geojson-spec.html
[2]: http://geojson.org/geojson-spec.html#named-crs
[3]: http://proj4js.org/

###`doc.type`

Documents have to give at least a tiny bit of explanation on what we can expect
to find in them. Or vice versa, if we look for certain information, it should
be obvious which document type covers it. The above document is a very very bad
example, since "Use by Area" should surely go to some different document type.

By removing `doc.type` or setting it to false-ish, the document is hidden from
the map page, but its `GeoJSON` will still be referenceable by other documents.

###`doc[doc.type]`

It is nice to have that property set, because it yields a meaningful title
almost all the time. And I cannot think of any case where it wouldn't make
sense to use it. For all these reasons, the map page uses `doc[doc.type]`
as an item title, or `doc.type` if the former is missing.

###`doc.time`

In every attribute table that I had to review, date information was a mess.
There's always a column for day/month/year, probably with one of them missing,
and the year had either four or two digits. Or worse, somehow a start and end
date was given as `MONTH_BEG` `YEAR_BEG` `DAY_END` or whatever.

[Dates or ranges of dates](couchgis/views/lib/ranges.js) are expressed as a
string as such:
- Dates can be given in DD.MM.YYYY, YYYY.MM.DD, YYYY/MM/DD, DD/MM/YYYY i.e. I
  only expect the year to be four digits, digits to be consecutive, and I don't
  care about the order as long as it follows hierarchy.
- Date intervals are written as `<date> - <date>` ("to" or something hinders
  internationalization). Hence, **the dash must not be used as a separator!**
- If the day is left out, `03/2004` equals `01/03/2004 - 31/03/2004`,
  ditto for months.
- If the entire date is left out, it is treated as +/- infinity. `- 03/2004`
  then amounts to any date before and including 31/03/2004.
- Multiple ranges must be separated by comma/ampersand/semicolon. I do not
  guarantee any predictable behaviour if ranges overlap, because for
  performance reasons I assume they don't.
- Spaces and leading zeros are ignored. Use them in the documents for clarity
  but avoid typing them in a search.

Any character other than dash/comma/ampersand/semicolon can be freely used.
This way document times may also read "von ca. 1970 - 2000" or something.

###`doc.info`

If you have pdf's, spreadsheets etc. that provide some insight into your
uploaded features (I am usually handed a DVD or something), attach them to an
info document: Create a new document in Futon and upload some files. Also add a
few properties like Info or ReadMe. Set `doc.info` to the the info document id.

The map page will display a small link next to the item title. This will direct
you to the nice Futon page of the info document.

If you don't like to upload all attachments one by one, place them in
`_attachments`, write a text file for each property, and launch

```
$ curl localhost:5984/_uuids | grep -o '[0-9a-z]\+' | tail -n 1 > _id
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    47  100    47    0     0    227      0 --:--:-- --:--:-- --:--:--   239
$ erica push --is-ddoc=false localhost:5984/db
```

How to Filter Documents
-----------------------

The [map page](couchgis/_attachments/map.html) filter form should be able to
explain itself pretty much. And where it isn't clear just try to figure out
what it does. The application does not try _that_ hard to be mean to you or to
ruin your day.

Some notes include (you should probably have the map page open to know what
these are refering to):
- Where it says "Text" (below the map) or any of the document's fields, it
  actually means _case insensitive regular expression pattern_ by default. This
  allows for instance to select documents with `doc.Vegetation` matching
  woodland or swamp by typing `woodland|swamp`.
- Selecting a field and filtering for an empty string just checks if the field
  is present in the document.
- "Text" itself may be used to check if the pattern is matched by any of the
  fields. Because I for instance can hardly remember where a particular info
  had been placed.
- Where it says "Funktion" it actually means _eerily modified JavaScript
  expression_. I give some examples using the document from the top:

```javascript
  Area >= 15            // Yes it is doc['Area']>=15!!
  'Net Area' >=15       // Tricky field names are placed in single quotes.
  'Area' !== 'Net Area' // It does not hurt to quote simple fields.
  'Use by Area'.Logging > 'Use by Area'.'Hunting Ground' // The dot descends into objects.
  Vegetation.length > 5 // You can still access for instance String().length.
  Vegetation.match("woodland", "i")    // Double quotes are still strings.
  sum('Use by Area') != 'Net Area'     // I've provided a couple of accumulators.
  min('Use by Area').field==="Logging" // min()/max() return a field/value pair.
  (function average(o) {return sum(o)/count(o);})('Use by Area')>15
                        // This doesn't make much sense here, but feel free
                        // to define functions if it implies less typing.
```

###Search Performance

As the number of documents exceeds 10000, response time will depend on the
complexity of the filter. Whenever possible, CouchGIS will improve response
time by using a secondary index, instead of the documents itself:
- Selecting one or more document types usually responds instantly.
- Restricting documents to a certain time range also responds instantly. I
  recommend taking a look at [_view/type-year](couchgis/views/type-year). It
  sorts documents neatly into time spans.
- Asking for documents containing a certain field responds instantly as well.
- Using a regexp pattern on a category also responds very fast. For example,
  `doc.Vegetation` might be a category, because it has probably less than 100
  unique values.
- Using a fixed pattern on a field also responds very fast. If the regexp looks
  like `/^<NO TRICKY REGEXP SYMBOLS>$/` or `/^(<VALUE1>|<ETC.>)$/`, CouchGIS
  can look up the apparent values directly. The nice autocomplete text input
  conveniently sticks to this syntax and features a compiled list of its own
  suggestions.

However, anything that has to run by a lot of documents may take a while:
JavaScript expressions for example have to be evaluated for each document,
ditto for full-text search. This doesn't matter if the amount of documents was
already been reduced by a previous search, because CouchGIS won't filter
excluded documents again.

###Spatial Relations

As of version 1.0.7, there's rudimentary support for so-called _spatial
relations_. That means, given a fixed geometry, you can check what other
geometry either lies inside, intersects or circumfences it. After you figured
out your fixed geometry, click on 'Auswahl merken', and then a button presents
itself for each relation. I have the following to say to this:
- Each geometry relates to itself by default.
- You might encounter glitches due to my sloppy implementation: For instance, I
  do not check for intersecting line segments, points identical to other
  points, points on line segments, etc.
- I've built in a tolerance (or snap if you will) of 6-10cm depending on
  latitude. This is a good thing, because coordinates usually aren't that
  precise; that magnitude of a distance shouldn't decide if geometries are
  related.
- Let the interface encourage you to select the documents as tightly as
  possible, before they are filtered geometrically. I've tried to make the
  filter perform as fast as it gets, but there's of course limitations. If it
  has to process lots of polygons, it is going to take a while. The application
  will not stall or anything, you just won't be able to apply other filters.

_"So, shouldn't I do this in Quantum GIS? It sure runs way faster there!!"_ -
Well, yes, and no. My spatial filter runs within the CouchJS query server and
is outperformed easily by any compiled version thereof. However, it is not
nearly as painful to use as in Quantum GIS: you don't have to split _one layer_
into _two layers_, and you don't have to store the result in _yet another_
shapefile, and if you've made a mistake, you don't have to _navigate through
the same menu again, and set up a dialog exactly as you did before_. So it
trades a little convenience for performance.

How Document Editing Works
--------------------------

The [upload page](couchgis/_attachments/upload.html) covers editing and
uploading new documents. By itself, it can read the ghastly Microsoft Excel
2003 XML spreadsheet and the GeoJSON Feature/FeatureCollection. If you patch
CouchGIS with [couch-ogr2ogr][4], it will also accept ghastly ESRI Shape Files
as well as pretty much everything.

Not surprisingly, the form pretty much explains itself, and even if documents
have been deleted or messed up, there's always a revert button. Also, you can
review the data that is going to be uploaded.

In CouchDB creating new or changing documents is more or less the same, as soon
as the Bulk Document API is in use. The application works with, and extends its
principle in some way.
- If neither `_id` nor `_rev` exists, a new document will be attached.
- If `_id` and `_rev` match an existing document, the application will update
  its fields with the ones specified in the uploaded data. Unmentioned fields
  are left untouched. If you want to delete a field, set its cell to an empty
  string or `null` or `undefined`.
- Nothing will be done if `_rev` doesn't match. This is for your own safety!!!
- If `_deleted` exists and equals `true` (in LibreOffice Calc, this amounts to
  typing `=TRUE()` in a cell), it deletes the document. It has to be this
  annoying because it is for your own safety as well!!!

[4]: http://github.com/oreinecke/couch-ogr2ogr

###Search and Link to Existing Geometry

Oftentimes the database already contains a document that has a geometry similar
to the one being uploaded. It is possible to show existing similar geometries
and point uploaded documents to re-use those instead of adding new ones. Since
version 1.0.8, I might not advice against using this feature as strongly as
before.

As of version 1.0.8, the bulk upload is adapted automatically to impending
changes to document's geometries. Imagine a database containing the following
documents:

```json
[
  { "_id": "a", "GeoJSON": {...}, etc. },
  { "_id": "a2", "GeoJSON": {...}, etc. }
  { "_id": "b", "GeoJSON_clone": "a", etc. },
  { "_id": "c", "GeoJSON_clone": "a", etc. },
]
```

I imply that documents **b** and **c** are attached to **a**'s geometry and
**a2**'s geometry looks similar to that. Now, here's what could happen, and how
the bulk upload is fixed before being committed to the database:
- Nothing, if either **b** or **c** are pointed to **a2**,
- if **a** is pointed to **a2**, then so are **b** and **c**,
- if `a._deleted` is set, then `b.GeoJSON=a.GeoJSON` and
  `c.GeoJSON_clone=b._id`, meaning **a**'s geometry will be moved into **b**,
  and **c** will point to it from now on,
- if **a** is pointed to **a2** and vice versa, I have no idea and this case is
  not provided for.

###Tabular Document Representation

All software mentioned at the beginning can not cope with nested objects, so
they have to be converted into a flat-hierarchy representation. The example
document would be exported into a GeoJSON Feature like this:

```json
{
  "type": "Feature",
  "crs": {
     "type": "name",
     "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
  },
  "geometry" : { "type" : "Polygon", "coordinates": [...] },
  "properties" : {
    "_id": "ab45", "_rev": "2-8945",
    "GeoJSON_clone": "e4af",
    "type": "Vegetation",
    "time": "2001, 02.05.2003-2004",
    "Vegetation": "Coniferous Woodland",
    "Area"                       : 20.0,
    "Net Area"                   : 19.3,
    "Use by Area.Hunting Ground" : 17.0,
    "Use by Area.Logging"        :  2.3
  }
}
```

The good thing is that, inversely, the application is capable of building
nested objects from this notation by adhering to a few simple rules:
- The dot marks the end of a field and the beginning of a nested field:
  `{"a.b":true} -> {a:{b:true}}`
- Leading/Trailing spaces/newlines/tabs are stripped to enable formatting:
  `{"some field .\n a property":true} -> {"some field":{"a property":true}}`
- Anything single-quoted is used as-is to allow dots and spaces in field names:
  `{" ' some field' . ' a prop. '":true} -> {" some field":{" a prop. ":true}}`
- _Single_ single quotes are nevertheless used as-is, if they are in the middle
  of the name: `{"some object . object's field":true} -> {"some
  object":{"object's field":true}}`
- At the end, empty objects are scratched from the new document:
  `{"obj.prop":"null", "obj.field":"undefined"} -> {}`

###How LibreOffice Calc Handles Line Breaks

LibreOffice Calc handles line breaks in a very crappy way. I can't really blame
them for not properly supporing an outdated and bulky format. Sadly, it still
beats writing _Office Open XML Spreadsheets_ etc. let alone reading them.

What happens is that
- line breaks of a downloaded XML spreadsheet are displayed only when editing a
  cell, or if some weird formatting is applied that makes normal cells look
  spooky ('Horizontal': 'Distributed' or something),
- bare line breaks are removed from the saved XML spreadsheet,
- as well as XML-style line breaks (`&#10;`).

This sounds like bad news, because it removes newlines by accident. I've
circumvented the annoyance by exporting line breaks as `&#13;&#10`, the XML
equivalent of a DOS CR-LF. LibreOffice Calc strips these little gold nuggets
down to `&#13;` and displays the remainder still as a line break.
MS-Excel reads `&10;` as line break and `&13;` as a strange empty character,
but saves everything as-is.
