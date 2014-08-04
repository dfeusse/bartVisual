d3.json("dataWrangling/bartDataAndLookup.json", function(lookupData) {
	d3.json("data/bartApiLatLonDataOrderedPassenger.json", function(rawData) {

		var data = rawData.root.stations.station;
		console.log(data)

        console.log('lookupData')
        console.log(lookupData)

        // now have data, lookupData & apiData
        for(var i=0; i<data.length; i++){
            var matchingObj = _.where(lookupData, {Abbr: data[i].abbr})
            data[i].stationEntries = matchingObj[0].Entries;
        }

        // now have data, lookupData & apiData
        for(var i=0; i<data.length-1; i++){
            data[i].entriesSplit = data[i].stationEntries/2 + data[i+1].stationEntries/2
        }

		data.forEach(function(d) {
			//"gtfs_latitude": "37.792976",
            //"gtfs_longitude": "-122.396742",
			d.LatLng = new L.LatLng(d.gtfs_latitude,d.gtfs_longitude)
            d.totalPassengers = d.leavingPassengers + d.arrivingPassengers
		})

		console.log('DATA')
		console.log(data)

		// call visuals
		callCircles(data);
		callMap(data);
	});
});