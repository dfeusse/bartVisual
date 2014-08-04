function callCircles(data) {

		// sort data so biggest nodes on top
		var data = _.sortBy(data, function(obj){ return +obj.stationEntries });
		data.reverse()
		console.log(data)

		var formatComma = d3.format("0,000");
		var tip = d3.tip()
		    .attr('class', 'd3-tip')
		    .html(function(d) { return 'station: ' + '<span>' + d.name + '</span>' + '<br>' + '<span>' + formatComma(d.stationEntries) + '</span>' + ' passengers entered' })
		    .offset([-12, 0]);

		var margin = {top: 22, right: 20, bottom: 30, left: 20},
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

		var callTooltip = svg.call(tip);

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
			.on("mouseenter", function() { 
                d3.select(this).transition().duration(500)
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 2)
                })
            .on("mouseleave", function() { 
                d3.select(this).transition().duration(500)
                    .attr("stroke-width", 0)
                });
		
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

		circles.on('mouseover', tip.show);
		circles.on('mouseout', tip.hide);

} // end of callCircles()


