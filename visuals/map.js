function callMap() {
//var map = L.map('map').setView([40, 11], 2);
	//var map = L.map('map').setView([22.5, 0], 2);
	var map = L.map('map').setView([37.78, -122.25], 11);

	var stamen = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'Imagery &copy; <a href="http://maps.stamen.com/#toner/8/51.072/14.584" rel="author" target="_blank"> Stamen</a>'}).addTo(map);

	var cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade, Data-overlay: <a href="http://earthquake.usgs.gov/earthquakes/" rel="author" target="_blank">&copy; USGS</a>',key: 'BC9A493B41014CAABB98F0471D759707',styleId: 22677	});
    /*
    //var myText = L.tileLayer({attribution: 'Imagery &copy; <a href="http://maps.stamen.com/#toner/8/51.072/14.584" rel="author" target="_blank"> Stamen</a>'}).addTo(map)
    var textLatLng = [37.87836087, -122.1837911];  
    var myTextLabel = L.marker(textLatLng, {
        icon: L.divIcon({
            className: 'header',   // Set class for CSS styling
            html: 'A Text Label'
        }),
        //draggable: true,       // Allow label dragging...?
        zIndexOffset: 1000     // Make appear above other map features
    });
    map.addLayer(myTextLabel);
    */
    //var labelLocation = new L.LatLng(37.905628, -122.067423);
    //var labelTitle = new L.LabelOverlay(labelLocation, '<b>GERMANY</b>');
    //map.addLayer(labelTitle);
    //var myText = L.divIcon({className: 'header', html: '<h2><span>Hello!</span><h2b>'});
    //L.marker([50.505, 30.57], {icon: myText}).addTo(map);
    //L.addTo(map)

	/* Initialize the SVG layer */
	map._initPathRoot()    


   // var myGlow = glow("myGlow").rgb("#0f0").stdDeviation(3);
    var myGlow = glow("myGlow").rgb("#fff").stdDeviation(2);
    

	/* We simply pick up the SVG from the map object */
	var svg = d3.select("#map").select("svg"),
	g = svg.append("g");

	var arcGroup = g.append('g').call(myGlow);
	var pointGroup = g.append('g');
	
d3.json("dataWrangling/bartDataAndLookup.json", function(lookupData) {
	//d3.json("us_taxa.json", function(collection) {
	d3.json("data/bartApiLatLonDataOrderedPassenger.json", function(rawData) {
		/* Add a LatLng object to each item in the dataset */

		var data = rawData.root.stations.station;
		console.log('DATA')
		console.log(data)

        console.log('lookupData')
        console.log(lookupData)

        // now have data, lookupData & apiData
        for(var i=0; i<data.length; i++){
            //_.where(listOfPlays, {author: "Shakespeare"});
            //var lookupValue = fullData[i].abbr;
            //console.log(lookupValue)
            console.log(data[i].abbr)
            var matchingObj = _.where(lookupData, {Abbr: data[i].abbr})
            // Entries: 166349
            //console.log(matchingObj[0].Entries)
            data[i].stationEntries = matchingObj[0].Entries;
        }

        // now have data, lookupData & apiData
        for(var i=0; i<data.length-1; i++){
            data[i].entriesSplit = data[i].stationEntries/2 + data[i+1].stationEntries/2
        }

		//collection.features.forEach(function(d) {
		data.forEach(function(d) {
			//d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0])
			//"gtfs_latitude": "37.792976",
            //"gtfs_longitude": "-122.396742",
			//[-122.4,37.78]
			d.LatLng = new L.LatLng(d.gtfs_latitude,d.gtfs_longitude)
            d.totalPassengers = d.leavingPassengers + d.arrivingPassengers
		})

		//console.log(collection.features.length)
		console.log('NEW DATA')
		console.log(data)

    /*
		var feature = pointGroup.append("g")
    		.attr("class", "points")
  //.selectAll("g")
  		.selectAll("circle")
		//var feature = g.selectAll("circle")
		  	.data(data)
		  	//.enter().append("circle").attr("r", function (d) { return d.properties.count/20 }).attr('fill','lightcoral');
		  	.enter()
		  	.append("circle")
		  	.attr('class', 'cityNodes')
		  	//.attr("r", function (d) { return d.properties.count })
		  	//.attr("r", function (d) { return d.zipcode })
		  	.attr("r", function (d) { return 6 })
		  	.attr('fill','red')
            .on('mouseover', function(d){
                //var nodeSelection = d3.select(this).style({opacity:'0.8'});
                //nodeSelection.select("text").style({opacity:'1.0'});
                d3.select(this).attr("r", 12)
                //nodeSelection.select("text").style({opacity:'1.0'});
            })
    */

		console.log('PONE')
		// -----------------------------------------

		// --- Helper functions (for tweening the path)
        var lineTransition = function lineTransition(path) {
            path.transition()
                //NOTE: Change this number (in ms) to make lines draw faster or slower
                .duration(5500)
                .attrTween("stroke-dasharray", tweenDash)
                .each("end", function(d,i) { 
                    ////Uncomment following line to re-transition
                    //d3.select(this).call(transition); 
                    
                    //We might want to do stuff when the line reaches the target,
                    //  like start the pulsating or add a new point or tell the
                    //  NSA to listen to this guy's phone calls
                    //doStuffWhenLineFinishes(d,i);
                });
        };
        var tweenDash = function tweenDash() {
            //This function is used to animate the dash-array property, which is a
            //  nice hack that gives us animation along some arbitrary path (in this
            //  case, makes it look like a line is being drawn from point A to B)
            var len = this.getTotalLength(),
                interpolate = d3.interpolateString("0," + len, len + "," + len);

            return function(t) { return interpolate(t); };
        };

        // --- Add paths
        // Format of object is an array of objects, each containing
        //  a type (LineString - the path will automatically draw a greatArc)
        //  and coordinates 
        var links = [
            {
                type: "LineString",
                    coordinates: [
                    	// d.LatLng = new L.LatLng(d.gtfs_latitude,d.gtfs_longitude)
                    	
                        //[ data[0].LatLng.lng, data[0].LatLng.lat ],
                        //[ data[1].LatLng.lng, data[1].LatLng.lat ]
                        
                        //[ new L.LatLng(data[0].LatLng.lng), new L.LatLng(data[0].LatLng.lat) ],
                        //[ new L.LatLng(data[1].LatLng.lng), new L.LatLng(data[1].LatLng.lat) ]

                        [ new L.LatLng(data[0].LatLng.lat, data[0].LatLng.lng) ],
                        [ new L.LatLng(data[1].LatLng.lat, data[1].LatLng.lng) ]
                    ]//,
                //value: leavPass()
            }
        ];
        console.log('links, initial')
        console.log(links)

        // you can build the links any way you want - e.g., if you have only
        //  certain items you want to draw paths between
        // Alterntively, it can be created automatically based on the data
        links = [];
        // Be cogniscient that need to break it up into parts so no awkward connectors
        // need millbrae -> richmond
        //      macarthur -> pittsburg
        //      12 st okland -> fremont
        //      bay fair -> dublin pleasonton
        
        console.log('$$$$$$$$$$$$$')
        // millbrae -> richmond
        var millbraeToRichmond = data.slice(0, 23);
        //console.log(data[23])
        //console.log(millbraeToRichmond)

        var linkScale = d3.scale.linear()
            .domain([0, d3.max(data, function(d) {return d.leavingPassengers})])
            .range([2, 15])

        function leavPass() {
            return data[i].leavingPassengers;
        }

        function leavPass2() {
            return data[0].leavingPassengers;
        }

        for(var i=0; i<millbraeToRichmond.length; i++){
            // (note: loop until length - 1 since we're getting the next
            //  item with i+1)
            links.push({
                type: "LineString",
                coordinates: [
                    //[ data[i].LatLng.lng, data[i].LatLng.lat ],
                    //[ data[i+1].LatLng.lng, data[i+1].LatLng.lat ]
                    [ new L.LatLng(data[i].LatLng.lat, data[i].LatLng.lng) ],
                    [ new L.LatLng(data[i+1].LatLng.lat, data[i+1].LatLng.lng) ]
                ],
                //value: leavPass()
                //value: data[i].leavingPassengers
                //value: (data[i].leavingPassengers/2 - data[i].arrivingPassengers/2) + (data[i+1].leavingPassengers/2 - data[i+1].arrivingPassengers/2)
                value: data[i].stationEntries/2 + data[i+1].stationEntries/2
            });
        }

        var linkScaleTwo = d3.scale.linear()
            .domain([0, d3.max(links, function(d) {return d.value})])
            .range([2, 18])

        // macarthur -> pittsburg
        // data: rockridge -> pittsburg
        // still need macarthur to rockridge
        console.log(data[24])
        var rockridgeToPittsburg = data.slice(24, 32);
        console.log(rockridgeToPittsburg)
        for(var i=0; i<rockridgeToPittsburg.length-1; i++){
            // (note: loop until length - 1 since we're getting the next
            //  item with i+1)
            links.push({
                type: "LineString",
                coordinates: [
                    //[ data[i].LatLng.lng, data[i].LatLng.lat ],
                    //[ data[i+1].LatLng.lng, data[i+1].LatLng.lat ]
                    [ new L.LatLng(rockridgeToPittsburg[i].LatLng.lat, rockridgeToPittsburg[i].LatLng.lng) ],
                    [ new L.LatLng(rockridgeToPittsburg[i+1].LatLng.lat, rockridgeToPittsburg[i+1].LatLng.lng) ]
                ],
                value: data[i].stationEntries/2 + data[i+1].stationEntries/2
            });
        }

        // 12 st oakland -> fremont
        // data: lake merritt -> fremont
        // still need 12 st oakland to lake merritt
        console.log(data[32])
        var lakeMerrittToFremont = data.slice(32, 41);
        console.log(lakeMerrittToFremont)
        for(var i=0; i<lakeMerrittToFremont.length-1; i++){
            // (note: loop until length - 1 since we're getting the next
            //  item with i+1)
            links.push({
                type: "LineString",
                coordinates: [
                    //[ data[i].LatLng.lng, data[i].LatLng.lat ],
                    //[ data[i+1].LatLng.lng, data[i+1].LatLng.lat ]
                    [ new L.LatLng(lakeMerrittToFremont[i].LatLng.lat, lakeMerrittToFremont[i].LatLng.lng) ],
                    [ new L.LatLng(lakeMerrittToFremont[i+1].LatLng.lat, lakeMerrittToFremont[i+1].LatLng.lng) ]
                ],
                value: data[i].stationEntries/2 + data[i+1].stationEntries/2
            });
        }

        // bay fair -> dublin/pleasanton
        // data: castro valley -> pleasanton
        // still need bay fair to castro valley
        console.log(data[41])
        var lenOfData = data.length;
        var castroValleyToPleasanton = data.slice(41, lenOfData);
        console.log(castroValleyToPleasanton)
        for(var i=0; i<castroValleyToPleasanton.length-1; i++){
            // (note: loop until length - 1 since we're getting the next
            //  item with i+1)
            links.push({
                type: "LineString",
                coordinates: [
                    //[ data[i].LatLng.lng, data[i].LatLng.lat ],
                    //[ data[i+1].LatLng.lng, data[i+1].LatLng.lat ]
                    [ new L.LatLng(castroValleyToPleasanton[i].LatLng.lat, castroValleyToPleasanton[i].LatLng.lng) ],
                    [ new L.LatLng(castroValleyToPleasanton[i+1].LatLng.lat, castroValleyToPleasanton[i+1].LatLng.lng) ]
                ],
                value: data[i].stationEntries/2 + data[i+1].stationEntries/2
            });
        }

        // Now need to connect each of the BART lines
        // there are THREE lines which are missing
        // macarthur to rockridge
        links.push({
            type: "LineString",
                coordinates: [
                    // d.LatLng = new L.LatLng(d.gtfs_latitude,d.gtfs_longitude)
                    
                    //[ data[0].LatLng.lng, data[0].LatLng.lat ],
                    //[ data[1].LatLng.lng, data[1].LatLng.lat ]
                    
                    //[ new L.LatLng(data[0].LatLng.lng), new L.LatLng(data[0].LatLng.lat) ],
                    //[ new L.LatLng(data[1].LatLng.lng), new L.LatLng(data[1].LatLng.lat) ]

                    [ new L.LatLng(data[17].LatLng.lat, data[17].LatLng.lng) ],
                    [ new L.LatLng(data[24].LatLng.lat, data[24].LatLng.lng) ]
                ],
                value: data[17].stationEntries/2 + data[24].stationEntries/2
        })
        // 12 st oakland to lake merritt
        links.push({
            type: "LineString",
                coordinates: [
                    // d.LatLng = new L.LatLng(d.gtfs_latitude,d.gtfs_longitude)
                    
                    //[ data[0].LatLng.lng, data[0].LatLng.lat ],
                    //[ data[1].LatLng.lng, data[1].LatLng.lat ]
                    
                    //[ new L.LatLng(data[0].LatLng.lng), new L.LatLng(data[0].LatLng.lat) ],
                    //[ new L.LatLng(data[1].LatLng.lng), new L.LatLng(data[1].LatLng.lat) ]

                    [ new L.LatLng(data[16].LatLng.lat, data[16].LatLng.lng) ],
                    [ new L.LatLng(data[32].LatLng.lat, data[32].LatLng.lng) ]
                ],
                value: data[16].stationEntries/2 + data[32].stationEntries/2
        })
        // bay fair to castro valley
        links.push({
            type: "LineString",
                coordinates: [
                    // d.LatLng = new L.LatLng(d.gtfs_latitude,d.gtfs_longitude)
                    
                    //[ data[0].LatLng.lng, data[0].LatLng.lat ],
                    //[ data[1].LatLng.lng, data[1].LatLng.lat ]
                    
                    //[ new L.LatLng(data[0].LatLng.lng), new L.LatLng(data[0].LatLng.lat) ],
                    //[ new L.LatLng(data[1].LatLng.lng), new L.LatLng(data[1].LatLng.lat) ]

                    [ new L.LatLng(data[36].LatLng.lat, data[36].LatLng.lng) ],
                    [ new L.LatLng(data[41].LatLng.lat, data[41].LatLng.lng) ]
                ],
                value: data[36].stationEntries/2 + data[41].stationEntries/2
        })


        /* All Links
        for(var i=0, len=data.length-1; i<len; i++){
            // (note: loop until length - 1 since we're getting the next
            //  item with i+1)
            links.push({
                type: "LineString",
                coordinates: [
                    //[ data[i].LatLng.lng, data[i].LatLng.lat ],
                    //[ data[i+1].LatLng.lng, data[i+1].LatLng.lat ]
                    [ new L.LatLng(data[i].LatLng.lat, data[i].LatLng.lng) ],
                    [ new L.LatLng(data[i+1].LatLng.lat, data[i+1].LatLng.lng) ]
                ]
            });
        }
        */
        console.log('links, contd')
        console.log(links)
        console.log('regular data')
        console.log(data[0].LatLng)
        console.log('links data')
        console.log(links[0].coordinates[0][0])

// filter one ------------------
/*
   svg
    .append("defs")
    .append("filter")
    .attr("id", "inner-glow")
    .append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 3);
    */

// filter two ------------------

var gradient = arcGroup.append("svg:defs")
  .append("svg:radialGradient")
    .attr("id", "grad1")
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "50%")
    .attr("fx", "50%")
    .attr("fy", "50%");

gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", "rgb(255,255,0)")
    .attr("stop-opacity", 1);

gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", "rgb(255,140,0)")
    .attr("stop-opacity", 0);


        var link = arcGroup.selectAll(".link")
	      	.data(links)
	    .enter().append("line")
	      	.attr("class", "link")
            //.attr("filter", "url(#inner-glow)")
            .style("filter", "url(#myGlow)");
            //.attr("stroke", "url(#grad1)")
	
	/*
	var link = arcGroup.append("g")
		.attr("class", "connectingLines")
	.selectAll(".link")
		.data(links)
		.enter()
		.append("line")
		.attr("class", "link")
	*/


var feature = pointGroup.append("g")
    		.attr("class", "points")
  //.selectAll("g")
  		.selectAll("circle")
		//var feature = g.selectAll("circle")
		  	.data(data)
		  	//.enter().append("circle").attr("r", function (d) { return d.properties.count/20 }).attr('fill','lightcoral');
		  	.enter()
		  	.append("circle")
		  	.attr('class', 'cityNodes')
		  	//.attr("r", function (d) { return d.properties.count })
		  	//.attr("r", function (d) { return d.zipcode })
		  	.attr("r", function (d) { return 6 })
            //.attr("fill", "url(#grad1)")
            .on("mouseenter", function() { 
                d3.select(this).transition().duration(500)
                    //.attr("fill", "blue")
                    .attr("r", 14)
                })
             .on("mouseleave", function() { 
                d3.select(this).transition().duration(500)
                    //.attr("opacity", 0)
                    .attr("r", 6)
                });

	      	//.style("stroke-width", function(d) { return Math.sqrt(d.value); });

	/*
        // Standard enter / update 
        var pathArcs = arcGroup.selectAll(".arc")
            .data(links);

        //enter
        pathArcs.enter()
            //.append("path")
            .append("line")
            .attr({
                'class': 'arc'
            })
            .style({ 
                fill: 'none',
            });
    */

// -----------------------------------------

    
        //feature.on("mouseover",function(d) { console.warn(d3.select(this)) });

    /*
        d3.select(this)
        	.transition()
        	.delay(300)
        	.duration(1000)
        	//.attr('r',function (d){ return (d.zipcode/20)*3 })
            .attr('r',function (d){ return 10 })
            //.attr('fill','yellow') });
    */
    

		function update() {
		  	feature.attr("cx",function(d) { return map.latLngToLayerPoint(d.LatLng).x})
		  	feature.attr("cy",function(d) { return map.latLngToLayerPoint(d.LatLng).y})
		  	//feature.attr("r",function(d) { return d.zipcode/205400*Math.pow(2,map.getZoom())})
		  	feature.attr("r",function(d) { return 6 })

		  	
		  	//pathArcs
		  		//.attr("x1", function(d) { return d.source.x; })
        		//.attr("y1", function(d) { return d.source.y; })
        		//.attr("x2", function(d) { return d.target.x; })
        		//.attr("y2", function(d) { return d.target.y; });
    		//pathArcs.attr("x1", function(d) { return d.coordinates[0][0]; })
    		//pathArcs.attr("y1", function(d) { return d.coordinates[0][1]; })
    		//pathArcs.attr("x2", function(d) { return d.coordinates[1][0]; })
    		//pathArcs.attr("y2", function(d) { return d.coordinates[1][1]; });
    	//link
    		/*
    		link.attr("x1", function(d) { return d.coordinates[0][0]; })
    		link.attr("y1", function(d) { return d.coordinates[0][1]; })
    		link.attr("x2", function(d) { return d.coordinates[1][0]; })
    		link.attr("y2", function(d) { return d.coordinates[1][1]; });
    		*/
    		//link.attr("x1", function(d) { return map.latLngToLayerPoint(d.coordinates[0].LatLng).x })
    		//link.attr("x1", function(d) { return map.latLngToLayerPoint(-122.271604).x })
    		//link.attr("y1", function(d) { return map.latLngToLayerPoint(d.coordinates[0].LatLng).y })
    		//link.attr("y1", function(d) { return map.latLngToLayerPoint(37.803664).y })
    		//link.attr("x2", function(d) { return map.latLngToLayerPoint(d.coordinates[1][0]).x })
    		//link.attr("x2", function(d) { return map.latLngToLayerPoint(-122.419694).x })
    		//link.attr("y2", function(d) { return map.latLngToLayerPoint(d.coordinates[1][1]).y });
    		//link.attr("y2", function(d) { return map.latLngToLayerPoint(37.765062).y });

    		//link.attr("x1",function(d) { return map.latLngToLayerPoint(d.coordinates[0].LatLng).x})
		  	//link.attr("y1",function(d) { return map.latLngToLayerPoint(d.coordinates[0].LatLng).y})
		  	link.attr("x1",function(d) { return map.latLngToLayerPoint(d.coordinates[0][0]).x})
		  	link.attr("y1",function(d) { return map.latLngToLayerPoint(d.coordinates[0][0]).y})
		  	//link.attr("x2",function(d) { return 379})
		  	//link.attr("y2",function(d) { return 312})
		  	link.attr("x2",function(d) { return map.latLngToLayerPoint(d.coordinates[1][0]).x})
		  	link.attr("y2",function(d) { return map.latLngToLayerPoint(d.coordinates[1][0]).y})

            //link.style("stroke-width", 7)
            //link.style("stroke-width", function(d) { return SCALE(d.KEY) })
            //link.style("stroke-width", function(d) { return linkScale(d.value) })
            link.style("stroke-width", function(d) { return linkScaleTwo(d.value) })
            //link.style("stroke-width", function(d) { return linkScaleThree(d.entriesSplit) })
            

		  	//link.attr("x1",function(d) { return 300})
		  	//link.attr("y1",function(d) { return 300})
		  	//link.attr("x2",function(d) { return 379})
		  	//link.attr("y2",function(d) { return 312})
        

        /*
        //update
        pathArcs.attr({
                //d is the points attribute for this path, we'll draw
                //  an arc between the points using the arc function
                d: path
            })
            .style({
                stroke: '#0000ff',
                'stroke-width': '2px'
            })
            // Uncomment this line to remove the transition
            .call(lineTransition); 

        //exit
        pathArcs.exit().remove();
        */

    }
		
		map.on("viewreset", update);
		update();
	})
})
} // end of callMap()		