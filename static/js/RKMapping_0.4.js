//adding an overlay to an existing leaflet map object
function mapOverlay(map_){
	this.map=map_;
	this.overlaySVG = d3.select(this.map.getPanes().overlayPane).append("svg");
	this.overlay=this.overlaySVG.append("g").attr("class", "leaflet-zoom-hide")
	var path_geo = d3.geo.path().projection(project);
	//necessary for zooming the map...corresponded to: map.on("viewreset", reset);
	this.resetView=resetView;
	function resetView(bounds_map_){
		var bottomLeft = project(bounds_map_[0]),
		    topRight = project(bounds_map_[1]);
		this.overlaySVG.attr("width", topRight[0] - bottomLeft[0])
		    	.attr("height", bottomLeft[1] - topRight[1])
		    	.style("margin-left", bottomLeft[0] + "px")
		    	.style("margin-top", topRight[1] + "px");
		this.overlay.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
//		this.showAll();
	}
	//show us all geometries that where added
	this.showAll=showAll;
	function showAll(){
		this.features.attr("d",function(d){
			var coords = d.coordinates, typ = d.type;
			if (d.type==='Feature'){coords = d.geometry.coordinates; typ=d.geometry.type;}		
		//console.log(d)
			if (d.type==='ArcString')typ='LineString';
			var new_path = path_geo({type: typ, coordinates: coords})			
			return new_path;
		})
	}
	//show us all geometries...filteres
	this.showAllFiltered=showAllFiltered;
	function showAllFiltered(maxVal){
		var counter = [0,0,0]; //[features, points_all, points_filteres]
		this.features.attr("d",function(d){
			var coords = d.coordinates, typ = d.type;
			if (d.type==='Feature'){coords = d.geometry.coordinates; typ=d.geometry.type;}		
		//console.log(d)
			if (d.type==='ArcString')typ='LineString';
			var new_path = path_geo({type: typ, coordinates: filtering(typ, coords)})
			counter[0]++;			
			return new_path;
		})
		return counter;
		function filtering(type, coords){
			//console.log("test")
			if (type == 'Polygon'){	coords = coords.map(mapLineString)			}
			else if (type == 'MultiPolygon'){coords = coords.map(mapPolygon)		}
			else if (type == 'MultiLineString'){coords = d.coords.map(mapLineString)	}
			return coords;
		}
		function mapPolygon(polygon){
			return polygon.map(mapLineString);
		}
		function mapLineString(linestring){
			return linestring.filter(filterPoints);
		}
		function filterPoints(point){
			counter[1]++;			
			if (point.length<3 || point[2]>maxVal){ counter[2]++;			
			return point; }
		}

	}
	//clean the overlay container
	this.removeAll=removeAll;
	function removeAll(){this.overlay.selectAll("path").remove();}
	//add some geometries to the overlay
	this.addGeometries=addGeometries;
	function addGeometries(geoms_,path_ext){
		if(path_ext===undefined)path_ext="path"
		if (geoms_.length!==undefined){
			this.features = this.overlay.selectAll(path_ext)
				.data(geoms_)
				.enter()
				.append("path");
		}else {
			this.features = this.overlay
				.append("path")
				.datum(geoms_);
		}
	}
	//projection to re-project overlay on the existing leaflet map
	this.project=project;
	function project(x) {
		var point = this.map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
		return [point.x, point.y];
	}
}
//end of map overlay

//*****************
//get the arc-geometries...2nd version - using feature_objects
function getArcs_V2(topology, featureObjects_, simplify_){
	var col_arcs_ = {};	
	featureObjects_.forEach(function(featureObj_){
		var arcs = featureObj_.getArcsPure();
		readArcs(arcs);
		
		function readArcs(arcs_){
			arcs_.forEach(function(arc){
				var arc_id = arc;
				var sign = 1; 
				if(arc_id<0){arc_id= (arc_id*(-1))-1; sign = -1;}
				if((arc_id in col_arcs_)===false){
					var arcs_cache = topojson.feature(topology, {type: 'LineString', arcs:[arc_id]});
					arcs_cache.coordinates = arcs_cache.geometry.coordinates;
					arcs_cache.members = [{id:featureObj_.id, direction:sign}]//, name:featureObj_.properties.GEN}]
					arcs_cache.length = getLineLength(arcs_cache.geometry.coordinates)
					//...simplify arc-geometries directly when specified
					if (simplify_ !== undefined){
						simplifyProcesses(arcs_cache, simplify_[0], simplify_[1])
					}
					//arcs_cache.sign = sign;
					col_arcs_[arc_id]=arcs_cache;
				}else {
					col_arcs_[arc_id].members.push({id:featureObj_.id, direction:sign, name:featureObj_.properties.GEN})
				}
			})
		}				
	})
	return col_arcs_;
}
//end of get the arc-geometries
//*****************
//build geometries from arc-geometries...2nd version-using feature_objects
function getGeometries_V2(featObjs, col_arcs_){
	var polygons = [], members = [];
	featObjs.forEach(function(d){
		if(d.type==='Polygon'){
			members = [];
			var a = readPolygon2({arcs:d.geometry}, d.id); 
			polygons.push({type:'Polygon', coordinates: a, id:d.id, clipped:d.clipped, properties: d.properties, neighbors: members, arcs:d.geometry})
		}
		else if(d.type==='MultiPolygon'){
			members = [];
			var a = d.geometry.map(function(e,i){return readPolygon2({arcs:d.geometry[i]},d.id)}); 
			//console.log(d.id,members)
			polygons.push({type:'MultiPolygon', coordinates: a, id:d.id, properties: d.properties, neighbors: members, arcs:d.geometry})
		}
		
	})
	return polygons;
	function readPolygon2(data, id){
		var interPolys = [];
		//loop the linestrings of the polygon
		for (var i=0;i<data.arcs.length;i++){
			//get the related 'LineString's by splitting at the start/end points (length === 4) 
			var poly_cache = [];
			for (var j=0; j<data.arcs[i].length;j++){
				var arc_id = data.arcs[i][j];
				//avoid an unexplainable inconsistency within the dataset
				//if(typeof(arc_id)!='number')arc_id=data.arcs[i][0][j];
				var sign = 1; 
				if(arc_id<0){arc_id= (arc_id*(-1))-1; sign = -1;}
				var arcs_cache2 = col_arcs_[arc_id].coordinates.slice();//--> das war der knackpunkt!!!!!!!!!!http://www.d-mueller.de/blog/javascript-arrays-kopieren/
				if(col_arcs_[arc_id].members.length==2){					
					if(id==col_arcs_[arc_id].members[0].id){var c=col_arcs_[arc_id].members[1];c.arc_id=arc_id;members.push(c)}
					else if(id==col_arcs_[arc_id].members[1].id){var c=col_arcs_[arc_id].members[0];c.arc_id=arc_id;members.push(c)}
				}
				if(sign===-1){arcs_cache2.reverse();}
				//remove the last (it is redundant!!!) ...do only, when it is not the last LineString
				if(j!==data.arcs[i].length-1){arcs_cache2.pop();}
				//re-build the polygon to test this implementation
				for (var x = 0;x<arcs_cache2.length;x++) poly_cache.push(arcs_cache2[x])				
			}
			interPolys.push(poly_cache);					
		}
		return interPolys;
	}
}
//end of build
//****************
//old version of neighbor detection
function getArcsOfNeighbores(features, col_arcs_){
	var members = [];
	var feat_members = features.map(function(feature){
		//clear the members array
		members = members.slice(members.length);
		if(feature.arcs!=undefined)var cache = feature.arcs;
		else if (feature.geometry!=undefined)var cache = feature.geometry;
			
		if(feature.type==='Polygon'){
			readPolygon2({arcs:cache}, feature.id); 
			//console.log(members)
		}
		else if(feature.type==='MultiPolygon'){
			cache.map(function(e,i){return readPolygon2({arcs:cache[i]},feature.id)}); 
			//console.log(members)
		}	
		return members;
	});
	return feat_members;
	function readPolygon2(data, id){
//		console.log(data.arcs)
		//loop the linestrings of the polygon
		for (var i=0;i<data.arcs.length;i++){
//			console.log(data.arcs[i])
			for (var j=0; j<data.arcs[i].length;j++){
				var arc_id = data.arcs[i][j];
				if(arc_id<0){arc_id= (arc_id*(-1))-1;}
//				console.log(data.arcs[i][j], col_arcs_)
				if(col_arcs_[arc_id].members.length==2){					
					if(id==col_arcs_[arc_id].members[0].id){var c=col_arcs_[arc_id].members[1];c.arc_id=arc_id;members.push(c)}
					else if(id==col_arcs_[arc_id].members[1].id){var c=col_arcs_[arc_id].members[0];c.arc_id=arc_id;members.push(c)}
				}								
			}								
		}
	}
}
//****************
//new version for neighbor detection ... modular=read array of features or single features
function getNeighborsOfArcs(featuresObjs_, arcCollection_){
	var members = [];
	featuresObjs_.forEach(function(featurObj){
		var feat_members = getNeighborsOfFeature(featurObj, arcCollection_);
		members.push(feat_members)
	})
	return members;
}

function getNeighborsOfFeature(featurObj, arcCollection_){
	var feat_members = [], allArcs = featurObj.getArcsPure(), id = featurObj.id;
	allArcs.forEach(function(arc){
		var arc_id = arc;
		if(arc_id<0){arc_id= (arc_id*(-1))-1;}
		var arcObject_members = arcCollection_[arc_id].members;
		if(arcObject_members.length==2){
				if(id==arcObject_members[0].id) var c=arcObject_members[1];
				else if(id==arcObject_members[1].id) var c=arcObject_members[0];
				c.arc_id=arc_id; 
				feat_members.push(c)
			}
	})
	return feat_members;
}

//object for removed features
function remFeatures(removeCandidate, id_origin_){
	this.id=removeCandidate.id;
	this.id_origin=id_origin_; //this is the id of the feature, where this was aggregated to
	//this.index=index_;
}
function remFeatureStorage(){
	this.removedFeatures = [];
	var removedFeaturesIndizes = [];

	this.addRemFeat=addRemFeat;
	function addRemFeat(remFeature_, id_origin_){
		var remFeature = new remFeatures(remFeature_, id_origin_);
		this.removedFeatures.push(remFeature);
	}
	this.getIndizes=getIndizes;
	function getIndizes(){
		removedFeaturesIndizes = this.removedFeatures.map(function(d){return d.id});
		return removedFeaturesIndizes;
	}
}

//Object-definition -- Feature-Object ... contains all necessary functions and variables of one feature:
//Type, ID, PROPERTIES, GEOMETRY, getArcsPure(), getGeometry(), getNeighbors()
function featureObj(feature_){
	//this.feature = feature_;
	this.type = feature_.type;
	this.id = feature_.id;
	this.properties = feature_.properties;
	this.geometry = feature_.arcs;
	this.clipped = false;
	//check if geometry has holes
	this.has_hole = false;
	if(this.type=='Polygon'){
		if (this.geometry.length==2)this.has_hole = true;
	} 
	else if(this.type=='MultiPolygon'){
		this.geometry.forEach(function(polygonGeom){
			if(polygonGeom.length==2)this.has_hole = true;
		})
	}

	//***FUNCTIONS***
	//get all neighbors of this feature ... fundamentally based on 'getNeighborsOfFeature()'
	this.getNeighbors=getNeighbors;
	function getNeighbors(arcCollection__){
			return getNeighborsOfFeature(this, arcCollection__)
	}
	//get all arcs (pure) in one array...'arcs'
	this.getArcsPure=getArcsPure;
	function getArcsPure(){
		var pure_arcs = [];
		if(this.type=='Polygon')pure_arcs = readPoly(this.geometry,'arcs');
		else if (this.type=='MultiPolygon') {
			this.geometry.forEach(function(polygon0){pure_arcs=pure_arcs.concat(readPoly(polygon0,'arcs'))})
		}
		return pure_arcs;	
	}
	//get polygons singulary...'single'
	this.getSingleGeometries=getSingleGeometries;
	function getSingleGeometries(){
		var single_geoms = [];
		if(this.type=='Polygon')single_geoms = readPoly(this.geometry,'single');
		else if (this.type=='MultiPolygon') {
			this.geometry.forEach(function(polygon0){single_geoms.push(readPoly(polygon0,'single')); })
		}
		return single_geoms;
			
	}
	//aggregate a feature with this
	this.aggregateFeature=aggregateFeature;
	function aggregateFeature(remFeature, neighArc){
		console.log("This is my -add to- geometry: ", this.geometry," ... this is the -origin- geometry: ", remFeature.geometry," ... and this is the neighbor arc: ",neighArc)
		console.log("Hole in the -add to- geometry? ", this.has_hole," ... hole in the -origin- geometry: ", remFeature.has_hole)
		if(this.type=='Polygon'){
			var reformedGeom = reformPolygonArcs2(neighArc.direction, neighArc.arc_id, remFeature.geometry).slice();
			
			console.log("This is the reformed -origin- geometry: ",reformedGeom)
			//find the corresponding arc in this geometry 
			if (neighArc.direction == 1)var replace_id = neighArc.arc_id;
			else if (neighArc.direction == -1)var replace_id = (neighArc.arc_id+1)*(-1);
			var arcIndex = this.geometry[0].indexOf(replace_id)
			console.log("This is the index of the arc (",replace_id,"), in the -add to- geometry: ",arcIndex," ... proof it: ", this.geometry)
			var new_composition = reCombinateArcs(this.geometry[0], arcIndex, reformedGeom)
			console.log("This is the re-combined outer ring of this geometry (polygon): ",new_composition)
			this.geometry[0]=new_composition; //just replace the outer ring ... by that we simply keep the holes
			//add the holes of the -origin- geometry to the reformed geometry...if some exist
			if(remFeature.has_hole==true){
				for(var i=1;i<remFeature.geometry.length;i++){
					this.geometry.push(remFeature.geometry[i])
				}
			}
		}	else alert("Other geometries than Polygon, are not implemented so far")
		this.clipped=true;
		return remFeature;	
	}
	//add the reformed ('redi_geom_') geometry to the -add to- geometry ('feature')
	function reCombinateArcs(feature, arc_index_, redi_geom_){
		//when at position 0 --> [reformed arcs, original arcs {1...End}]
		if (arc_index_ == 0){
			var new_composition_ = redi_geom_; 
			new_composition_ = new_composition_.concat( feature.slice(1));					
		//when at any position X --> [original arcs {0...X-1}, reformed arcs, original arcs {X+1...End}]
		}else { var new_composition_ = feature.slice(0,arc_index_);
			new_composition_ = new_composition_.concat( redi_geom_);
			new_composition_ = new_composition_.concat(feature.slice(arc_index_+1));
		}
		return new_composition_
	}
	function readPoly(polygon_parts, origin){
		if(origin=='arcs'){
			var arcs = [];
			polygon_parts.forEach(function(polygon){
				polygon.forEach(function(arc){arcs.push(arc)})
			})
			return arcs;
		} 
		else if(origin=='single'){
			//var single = [];
			//console.log(polygon_parts);
			//polygon_parts.forEach(function(part){single.push(part)})

			//TODO: needs an additional processing for the holes of a polygon --> polygon_parts[1] - polygon_parts[length-1]
			//use only the outer ring
			return polygon_parts[0];
		}
	}
}
function reformPolygonArcs2(direction, arc_id, arcs){
	if (direction == -1)var replace_id0 = arc_id;
	else if (direction == 1)var replace_id0 = (arc_id+1)*(-1);
	return editPolygon_(replace_id0, arcs);
	function editPolygon_(id, arcs){
		//get the indizes ... 
		var poly_index = 0, 	//poly_index=0--> we only need the outer ring
			arc_index = arcs[poly_index].indexOf(id);	//arc_index is the position of the arc in the array of the outer ring
		//console.log(id, arcs[poly_index],arcs[poly_index][arc_index])
		if (arc_index == 0)var de_composition = arcs[poly_index].slice(1);
		else {	var de_composition = arcs[poly_index].slice(arc_index+1);
			de_composition = de_composition.concat(arcs[poly_index].slice(0,arc_index));			
		}
		//console.log("de_composition of arcs: ",de_composition)
		return de_composition
		
	}
}

//get the length of a polygon only from the lengths of each arcs, which it is consists of
function getPolyLengthFromArcs(arcs_, arcCollection_){
	//console.log(arcs_)
	var length_ = 0;
	for (var i=0; i<arcs_.length; i++){	
		var arc_id = arcs_[i];
		if(arc_id<0)arc_id=(arc_id*(-1))-1;
		length_ = length_ + arcCollection_[arc_id].length;
	}
	return length_;
}


//************
//get Length of a linestring [[coordsX1,coordsY1],...,[coordsXn,coordsYn]]
function getLineLength(coords){
	var length = 0;
	//coords.forEach(function(d){
	for (var i=1;i<coords.length;i++){
		var a = coords[i-1], b = coords[i], dX = a[0]+b[0], dY = a[1]+b[1]; 
		length = length + Math.sqrt(Math.pow(dX,2)+Math.pow(dY,2));
	}
	return length;
}
//************
//simplify and filter arc-geometries
function simplifyArcs(col_arcs_, simplify_, max_val){
	for(arcs in col_arcs_){
		simplifyProcesses(col_arcs_[arcs], simplify_, max_val)
	}
	return col_arcs_;
}
function simplifyProcesses(arc, simplify_, max_val){
	arc.type='LineString';
	simplify_(arc)
	var simple_arc = arc.coordinates.filter(call_filterLine)
	arc.coordinates=simple_arc;

	function call_filterLine(data){
		return filterLine(data, max_val)
	}
}

function filterLine(data, max_val){
	if(data.length===2 ||data[2]===0 || data[2]>max_val) 
	//console.log(data)
	return data
}
//end of simplify arc-geometries
//************
function filterSimplifiedArcs(col_arcs_, max_val){
	for(arcs in col_arcs_){
		var arc = col_arcs_[arcs];
		var simple_arc = arc.coordinates.filter(call_filterLine)
		arc.coordinates=simple_arc;
	}
	return col_arcs_;
	function call_filterLine(data){
		return filterLine(data, max_val)
	}
}

//get the triangle values of the generalized arc-geometries
function getTriangleSizes(col_arcs_){
	var max = 0, min = 100000000;//,allTriangleSizes = [];
	for (arcs in col_arcs_){
		col_arcs_[arcs].geometry.coordinates.forEach(function(d){
			if(d.length >= 3 ){
				//allTriangleSizes.push(d[2])
				if (d[2]<min)min=d[2];
				if(d[2]>max)max=d[2];
			}		
		})
	}
	return [min, max]
}

//replace all german umlaute within a given string
function replaceUmlaute(value){
	var id = value;
	var umlaute = {'\u00c4':'Ae', '\u00e4':"ae", '\u00d6':'Oe', '\u00f6': 'oe', '\u00dc':'Ue', '\u00fc':'ue', '\u00df':'ss'}
	for(i in umlaute){if(id.indexOf(i)!=-1)id=id.replace(i,umlaute[i])}
	return id;
}

//***********************
//ArcClipping - Functions
function findLongestArc(neigh_arcs, arcCollection_){
	var longest = {}, longest_neigh_ = {}, test = false, list = [];
	neigh_arcs.forEach(function(e){
		if (test == false){test=true; longest=arcCollection_[e.arc_id]; longest_neigh_=e;}
		else if(arcCollection_[e.arc_id].length>longest.length){longest = arcCollection_[e.arc_id];longest_neigh_=e;}				
	})

	return longest_neigh_;
}
//was 'findLongestArc2' before renaming
function sortArcs(neigh_arcs, arcCollection_){
	var list = neigh_arcs.map(function(a){
		//a.length =arcCollection_[a.arc_id].length; 
		return a;})
	list.sort(function sortfunction(a, b){return (arcCollection_[b.arc_id].length - arcCollection_[a.arc_id].length)})
	//console.log('list-sorted: ', list)
	return list;
}
function reformPolygonArcs(direction, arc_id, arcs, type){
	if (direction == -1)var replace_id0 = arc_id;
	else if (direction == 1)var replace_id0 = (arc_id+1)*(-1);
	if (type==undefined)type='Polygon';
	if(type=='Polygon'){
		return editPolygon_(replace_id0, arcs);
	}else if(type=='MultiPolygon'){
		alert('Reforming MultiPolygonal Features is not implemented, so far!')
		stop();
	}
	function editPolygon_(id, arcs){
		var found = false;
		var poly_index, arc_index;
	 	//find the indizes
		arcs.forEach(function(arc,i){
			if (arc.indexOf(id) != -1){ 
				poly_index = i, arc_index = arc.indexOf(id);
				found = true;
			}
		})
		if(found===true){
			//console.log(id, arcs[poly_index],arcs[poly_index][arc_index])
			if (arc_index == 0)var de_composition = arcs[poly_index].slice(1);
			else {	var de_composition = arcs[poly_index].slice(arc_index+1);
				de_composition = de_composition.concat(arcs[poly_index].slice(0,arc_index));			
			}
			//console.log("de_composition of arcs: ",de_composition)
			return de_composition
		}
	}
}

//clip the reformed arcs of the 'to-clip-feature' to the 'clip-to-feature'
function clipArcs(direction, arc_id, corresp_feat_, redi_geom_){
	console.log(direction, arc_id, corresp_feat_, redi_geom_)
	var arcGeom = corresp_feat_.arcs;
	for(var u=0;u<arc_id.length;u++){
		//re-define the arc-id...to find it
		if (direction[u] == 1)var replace_id = arc_id[u];
		else if (direction[u] == -1)var replace_id = (arc_id[u]+1)*(-1);
		//if 'clip-to-feature' is a POLYGON
		if (corresp_feat_.type == 'Polygon'){
			var poly_index, arc_index, polygon = arcGeom;//old version: corresp_feat_.arcs;
			getPolygonIndizes(polygon); //called without index = POLYGON
			var new_composition = reCombinateArcs(polygon[poly_index], arc_index)
			//console.log("new_composition: ",new_composition)
			polygon[poly_index]=new_composition;
			//console.log("polygon: ",polygon)
			//return polygon
			//define the arcs of the geometry
			arcGeom = polygon;
		//if 'clip-to-feature' is a MULTIPOLYGON
		}else if (corresp_feat_.type == 'MultiPolygon'){
			var multi_poly_index, poly_index, arc_index, multi_poly = arcGeom;//old version: corresp_feat_.arcs;
			//console.log(corresp_feat_.arcs);
			var found = false;
			multi_poly.forEach(function(poly,count){
				if (found===true)return;
				//console.log(poly);
				found = getPolygonIndizes(poly, count); //called withindex = MULTIPOLYGON
			})
			//console.log("final multi indizes: ",multi_poly_index, poly_index, arc_index)
			var new_composition = reCombinateArcs(multi_poly[multi_poly_index][poly_index], arc_index)
		
			//console.log("new_composition: ",new_composition)
			multi_poly[multi_poly_index][poly_index]=new_composition;
			//console.log("multi_polygon: ",multi_poly)
			//return multi_poly
			//define the arcs of the geometry
			arcGeom = multi_poly;
		}	
	}
	return arcGeom;
	//function to find the positions, where the redundant arc can be found
	function getPolygonIndizes(polygon_, index){ //index...is needed for the differentiation between MULTI- & POLYGON
		var found_ = false;
		polygon_.forEach(function(d,i){
			if (found_===true)return;
			if(d.indexOf(replace_id)!=-1){
				//console.log("rest: ",replace_id,d, d.indexOf(replace_id), d[d.indexOf(replace_id)])
				poly_index = i, arc_index = d.indexOf(replace_id);
				if (index!=undefined)multi_poly_index = index;
				found_=true;
			}
		})
		return found_;				
	}
	//add the reformed arcs to the 'clip-to-feature'
	function reCombinateArcs(feature, arc_index_){
		//when at position 0 --> [reformed arcs, original arcs {1...End}]
		if (arc_index_ == 0){
			var new_composition_ = redi_geom_; 
			new_composition_ = new_composition_.concat( feature.slice(1));					
		//when at any position X --> [original arcs {0...X-1}, reformed arcs, original arcs {X+1...End}]
		}else { var new_composition_ = feature.slice(0,arc_index_);
			new_composition_ = new_composition_.concat( redi_geom_);
			new_composition_ = new_composition_.concat(feature.slice(arc_index_+1));
		}
		return new_composition_
	}
}

function polygonArea(polygon__) //http://www.mathopenref.com/coordpolygonarea2.html
{ numPoints = polygon__.length;
  area = 0;         // Accumulates area in the loop
  j = numPoints-1;  // The last vertex is the 'previous' one to the first

  for (i=0; i<numPoints; i++)
    { 
	X1 = polygon__[i][0], Y1 = polygon__[i][1];
  	X2 = polygon__[j][0], Y2 = polygon__[j][1];
  	area = area +  (X1+X2) * (Y1-Y2); 
      j = i;  //j is previous vertex to i
    }
  return area/2;
}

function RKMapping_version(){
	return "0.4.3"
}
