/*
*    main.js
*    Mastering Data Visualization with D3.js
*    CoinStats
*/


//Margins 
var margin = { left:80, right:80, top:10, bottom:80 },
    height = 500 - margin.top - margin.bottom, 
    width = 850 - margin.left - margin.right;

//SVGs added
var svg = d3.select("#chart-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

//Group added to the SVG to shift the graphs 
var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + 
        ", " + margin.top + ")");

// Time parser for x-scale
var parseTime = d3.timeParse("%d/%m/%Y");
// For tooltip
var bisectDate = d3.bisector(function(d) { return d.date; }).left;

// Scales
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// Axis generators
var xAxisCall = d3.axisBottom()
                    //  .tickFormat(d3.timeFormat("%b-%y"));
var yAxisCall = d3.axisLeft()
    // .ticks(10)
    // .tickFormat(function(d) { return parseInt(d / 1000) + "k"; });

//For sliders
slider_date = d3.timeFormat("%d-%b-%Y")

// Axis groups
var xAxis = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");

var yAxis = g.append("g")
    .attr("class", "y axis")
    
// Y-Axis label
var ylabel = g.append("g")
    .append("text")
    .attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", -50)
    .style("text-anchor", "middle")
    .attr('font-size', "20px")
    .attr("fill", "black")
    

// X-Axis label
var xlabel =  g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .append("text")
    .attr("class", "axis-title")
    .attr("x", width/2)
    .attr("y", 45)
    .style("text-anchor", "middle")
    .attr('font-size', "20px")
    .attr("fill", "black")
    .text("Time");


//  //Path for line charts
// g.append("path")
//     .attr("class", "line")
//     .attr("fill", "none")
//     .attr("stroke", "black")
//     .attr("stroke-with", "1px")

// Path for area Charts
g.append("path")
    .attr("class", "area")
      .attr("fill", "#cce5df")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 1.5)


var t = d3.transition().duration(100)

$("#slider").slider(
    { max:2014,
      min:1800,
      step:1, 
      slide:function(event, ui){
               i = ui.value - 1800
               update(formattedData[i],i+1800)
      }
    })


d3.json("data/coins.json").then(function(data) {

    //Formatting the data by removing the null values
    for (const [key, value] of Object.entries(data)) {
        updated_val = value.filter(function(d){
            return d["24h_vol"] && d["price_usd"] && d["market_cap"]
        })
        .map(function(d){
            d["24h_vol"] = + d["24h_vol"];
            d.price_usd = +d.price_usd;
            d.market_cap = +d.market_cap;
            d.date = parseTime(d.date);
            return d
        })

        data[key] = updated_val
    } 

    //Call to plot 

    var plotCall = function(){
    coin = $("#coin-select")[0].value
    metric = $("#var-select")[0].value
    filteredData = data[coin]
    l = filteredData.length

    min_date = slider_date(filteredData[0].date)
    max_date = slider_date(filteredData[l-1].date)

    $("#dateLabel1").text(min_date)
    $("#dateLabel2").text(max_date)

    $("#date-slider").slider(
        { max:l,
          min:0,
          step:1, 
          values:[0,l],
          range:true,
          slide:function(event, ui){
                    min_date = slider_date(filteredData[ui.values[0]].date)
                    max_date = slider_date(filteredData[ui.values[1]-1].date)
                    $("#dateLabel1").text(min_date)
                    $("#dateLabel2").text(max_date)
                   plot( coin, metric, filteredData.slice(ui.values[0],ui.values[1]))
          }
        })
    
    plot(coin, metric, filteredData)
    }

    //Main Function  
    var plot = function(coinSelected,MetricSelected, coindata){

   

    // Set scale domains
    miny = d3.min(coindata, function(d) { return d[MetricSelected]; }) / 1.005
    maxy = d3.max(coindata, function(d) { return d[MetricSelected]; }) * 1.005

    function formatmaker(d){
        if(metric == "price_usd"){
            return d3.format("$.1f")(d)}
        else{
            return Math.floor(d / 100000000)/10 + " B"
        }
    }
    // yAxisCall.tickFormat(formatmaker(d))
    if(maxy > 1000000000){

        yAxisCall.tickFormat(function(d) { return d3.format(".1f")(Math.floor(d / 100000000)/10) + " B"; });
    }
    else{
        yAxisCall.tickFormat(d3.format("$"))
    }
    

    x.domain(d3.extent(coindata, function(d) { return d.date; }));
    y.domain([0, maxy])

    // Generate axes once scales have been set
    xAxis.transition(t).call(xAxisCall.scale(x))
    yAxis.transition(t).call(yAxisCall.scale(y))
    
    //

    switch(MetricSelected){
        case "price_usd":
            ytext = coinSelected+ " Price (in $)"
            break;
        case "market_cap":
            ytext = coinSelected + " Market Cap(in Billion $)"
            break;
        default:
            ytext = coinSelected + " Trading Volume(in Billion)"
    }
    ylabel
    .style("text-transform","capitalize ")
    .text(ytext);


    // //Line path generator
    // var line = d3.line()
    // .x(function(d) { return x(d.date); })
    // .y(function(d) { return y(d[MetricSelected]); });

    //Area Generator
    area = d3.area()
        .x(function(d) { return x(d.date) })
        .y0(y(0))
        .y1(function(d) { return y(d[MetricSelected]) })

    areaplot = g.select(".area")
                .datum(coindata)
                .attr("d", area)


    // svg.append("path")
    //   .datum(data)
    //   .attr("fill", "#cce5df")
    //   .attr("stroke", "#69b3a2")
    //   .attr("stroke-width", 1.5)
    //   .attr("d", d3.area()
    //     .x(function(d) { return x(d.date) })
    //     .y0(y(0))
    //     .y1(function(d) { return y(d.value) })
    //     )


   
    // // Add line to chart
    // linePlot = g.select(".line")
    // .transition(t)
    // .attr("d", line(coindata));

     /******************************** Tooltip Code ********************************/

    var focus = g.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("line")
        .attr("class", "x-hover-line hover-line")
        .attr("y1", 0)
        .attr("y2", height);

    focus.append("line")
        .attr("class", "y-hover-line hover-line")
        .attr("x1", 0)
        .attr("x2", width);

    focus.append("circle")
        .attr("r", 7.5);

    focus.append("text")
        .attr("x", 15)
        .attr("dy", ".31em");

    g.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(coindata, x0, 1),
            d0 = coindata[i - 1],
            d1 = coindata[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.date) + "," + y(d[MetricSelected]) + ")");
        focus.select("text").text(formatmaker(d[MetricSelected]));
        focus.select(".x-hover-line").attr("y2", height - y(d[MetricSelected]));
        focus.select(".y-hover-line").attr("x2", -x(d.date));
    }


  /******************************** Tooltip Code ********************************/
    
    }


    $("#coin-select").on("change", plotCall)
    $("#var-select").on("change", plotCall)
    plotCall()


//    

});

