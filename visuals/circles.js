function callCircles() {
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
            //console.log(data[i].abbr)
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

		// sort data so biggest nodes on top
		var data = _.sortBy(data, function(obj){ return +obj.stationEntries });
		data.reverse()
		console.log(data)


		// ---------- END OF DATA MANIPULATION
		var margin = {top: 25, right: 20, bottom: 30, left: 20},
    		width = 1200 - margin.left - margin.right,
    		height = 800 - margin.top - margin.bottom;

    	var x = d3.scale.linear()
    		.domain(d3.extent(data, function(d) { return d.sepalWidth; })).nice()
		    .range([0, width]);

		var y = d3.scale.linear()
			.domain(d3.extent(data, function(d) { return d.sepalLength; })).nice()
		    .range([height, 0]);

		var radiusScale = d3.scale.linear()
			.domain([0, d3.max(data, function(d){return d.stationEntries})])
			.range([1,16]);

		var svg = d3.select("#circleVis").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var elem = svg.selectAll('.dots')
			.data(data)
			.enter()
			
		var circles = elem.append("circle")
			.attr("class", "dot")
			//.attr("r", 7)
			.attr("r", function(d,i) {return radiusScale(d.stationEntries)})
			.attr("cx", function(d,i) {return 0})
			//.attr("cy", function(d,i) {return i * 15 + 5})
			.attr("cy", function(d,i) {
				if(i < 2) {return i*30}
				else if (i<4){ return i*21 + 13}
				else { return i * 15 + 34}
			})
			//.attr("cy", function(d,i) {return (i * (radiusScale(d.stationEntries)*2.4)+20) + 5})
		
		var text = elem.append("text")
			.attr("class", "label")
			//.attr("dy", function(d,i) {return i * 15 + 5})
			.attr("dx", function(d,i) {return 20})
			.attr("dy", function(d,i) {
				if(i < 2) {return i*30 + 6}
				else if (i<4){ return i*21 + 13 + 6}
				else { return i * 15 + 34 + 6}
			})
			.text(function(d,i) {return d.name})





	}) // first data call
}) // second data call

} // end of callCircles()


