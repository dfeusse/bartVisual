function callMap(data) {
	var map = L.map('map').setView([37.78, -122.25], 11);
	var stamen = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'Imagery &copy; <a href="http://maps.stamen.com/#toner/8/51.072/14.584" rel="author" target="_blank"> Stamen</a>'}).addTo(map);
	var cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade, Data-overlay: <a href="http://earthquake.usgs.gov/earthquakes/" rel="author" target="_blank">&copy; USGS</a>',key: 'BC9A493B41014CAABB98F0471D759707',styleId: 22677	});
    
	/* Initialize the SVG layer */
	map._initPathRoot()    

    // var myGlow = glow("myGlow").rgb("#0f0").stdDeviation(3);
    var myGlow = glow("myGlow").rgb("#fff").stdDeviation(2);
    
    // tooltips
    var formatComma = d3.format("0,000");
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d) { return 'station: ' + '<span>' + d.name + '</span>' + '<br>' + '<span>' + formatComma(d.stationEntries) + '</span>' + ' passengers entered' + '<br>' + '<span>' + d.address + '</span>' + '<br>' + '<span>' + d.city + '</span>' + ' ' + '<span>' + d.state + '</span>' + ' ' + '<span>' + d.zipcode + '</span>'})
        //.html(function(d) { return d.name; })
        .offset([-12, 0]);

	/* We simply pick up the SVG from the map object */
	var svg = d3.select("#map").select("svg"),
	g = svg.append("g");

	var arcGroup = g.append('g').call(myGlow);
	var pointGroup = g.append('g');

    var callTooltips = pointGroup.call(tip);

    // --- Add paths
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

    links = [];
    // Be cogniscient that need to break it up into parts so no awkward connectors
    // need millbrae -> richmond
    //      macarthur -> pittsburg
    //      12 st okland -> fremont
    //      bay fair -> dublin pleasonton
    
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
                [ new L.LatLng(data[i].LatLng.lat, data[i].LatLng.lng) ],
                [ new L.LatLng(data[i+1].LatLng.lat, data[i+1].LatLng.lng) ]
            ],
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
                [ new L.LatLng(data[17].LatLng.lat, data[17].LatLng.lng) ],
                [ new L.LatLng(data[24].LatLng.lat, data[24].LatLng.lng) ]
            ],
            value: data[17].stationEntries/2 + data[24].stationEntries/2
    })
    // 12 st oakland to lake merritt
    links.push({
        type: "LineString",
            coordinates: [
                [ new L.LatLng(data[16].LatLng.lat, data[16].LatLng.lng) ],
                [ new L.LatLng(data[32].LatLng.lat, data[32].LatLng.lng) ]
            ],
            value: data[16].stationEntries/2 + data[32].stationEntries/2
    })
    // bay fair to castro valley
    links.push({
        type: "LineString",
            coordinates: [
                [ new L.LatLng(data[36].LatLng.lat, data[36].LatLng.lng) ],
                [ new L.LatLng(data[41].LatLng.lat, data[41].LatLng.lng) ]
            ],
            value: data[36].stationEntries/2 + data[41].stationEntries/2
    })

    console.log('links, finished')
    console.log(links)

    // filter one ------------------
    /*
    svg
        .append("defs")
        .append("filter")
        .attr("id", "inner-glow")
        .append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", 3);
    

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
    */

    var link = arcGroup.selectAll(".link")
      	.data(links)
    .enter().append("line")
      	.attr("class", "link")
        //.attr("filter", "url(#inner-glow)")
        .style("filter", "url(#myGlow)");
        //.attr("stroke", "url(#grad1)")

    var feature = pointGroup.append("g")
		.attr("class", "points")
		.selectAll("circle")
	  	.data(data)
	  	.enter()
	  	.append("circle")
	  	.attr('class', 'cityNodes')
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

    //initialize tooltips
    feature.on('mouseover', tip.show);
    feature.on('mouseout', tip.hide);

	function update() {
	  	feature.attr("cx",function(d) { return map.latLngToLayerPoint(d.LatLng).x})
	  	feature.attr("cy",function(d) { return map.latLngToLayerPoint(d.LatLng).y})
	  	feature.attr("r",function(d) { return 6 })

	  	link.attr("x1",function(d) { return map.latLngToLayerPoint(d.coordinates[0][0]).x})
	  	link.attr("y1",function(d) { return map.latLngToLayerPoint(d.coordinates[0][0]).y})
	  	link.attr("x2",function(d) { return map.latLngToLayerPoint(d.coordinates[1][0]).x})
	  	link.attr("y2",function(d) { return map.latLngToLayerPoint(d.coordinates[1][0]).y})

        //link.style("stroke-width", function(d) { return SCALE(d.KEY) })
        link.style("stroke-width", function(d) { return linkScaleTwo(d.value) })
    }
		
	map.on("viewreset", update);
	update();

} // end of callMap()		