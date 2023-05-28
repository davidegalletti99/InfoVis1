// ----------------
// Author: Davide Glletti
// Date: 2023/06/28
// ----------------

//----------------
// Costants 
//----------------

const totalWidth = document.documentElement.clientWidth;
const totalHeight = document.documentElement.clientHeight;

const margin = {top: .1 * totalHeight, right: .15 * totalWidth , bottom: .1 * totalHeight, left: .15 * totalWidth};
const width = totalWidth - margin.left - margin.right;
const height = totalHeight - margin.top - margin.bottom;

const legendWidth = .1 * totalWidth;
const legendHeight = .05 * totalHeight;

//----------------
// Utility functions
//----------------

function computeContrastColor(hexColor, trashold = .5) {
  return d3.hsl(hexColor).l > trashold ? "black" : "white";
}

//----------------
// Add functions
//----------------

function addTooltip() {
  var tooltip = d3.select("#dataviz")
    .append("div")
    .attr("id", "tooltip");
    
  tooltip.append("p")
    .append("span")
    .attr("id", "category")
    .text("category");
    
  tooltip.append("p")
    .append("span")
    .attr("id", "value")
    .text("value");
}

function addChart() {
  d3.select("#stacked-bars")
    .append("g")
    .attr("id", "chart") 
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

//----------------
// Update functions
//----------------

async function updateTooltip(data, that, colorMap, duration = 1000) {
  var currBar = d3.select(that).node();
  var bars = d3.select(that.parentNode).selectAll(".bar").nodes();
  
  var idx = bars.indexOf(currBar);
  var category = d3.select(that.parentNode).datum().key;
  
  var backgroundColor = colorMap(category);
  var textColor = computeContrastColor(backgroundColor);
  
  var tooltip = d3.select("#tooltip");


  tooltip.transition().duration(duration)
    .style("background-color", backgroundColor)
    .style("color", textColor);

  tooltip
    .select("#value")
    .text("value: " + data[idx][category]);
  
  tooltip
    .select("#category")
    .text("category: " + category);
}

async function update(data, subgroups, x, y, colorMap, duration = 1000) {
  var series = d3.select("#series");
  var legend = d3.select("#legend");

  // stack the data per subgroup
  var stackedData = d3.stack()
    .keys(subgroups).order(d3.stackOrderNone)(data);

  // Update color
  series.selectAll(".serie").data(stackedData).transition().duration(duration)
    .attr("fill", function(d) { return colorMap(d.key); });
  
    // Update height and y position
  series.selectAll(".serie").selectAll(".bar")
    .data(function(d) { return d; }).transition().duration(duration)
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); });

  // Add one dot in the legend for each name.
  legend.selectAll(".dot")
    .data(subgroups).transition().duration(duration)
      .attr("cy", function(_,i){ return (subgroups.length - 1) * 25 - i * 25; })
      .attr("fill", function(d){ return colorMap(d)});
      
      // Add one dot in the legend for each name.
  legend.selectAll(".label")
    .data(subgroups).transition().duration(duration)
      .attr("y", function(_,i){ return (subgroups.length - 1) * 25 - i * 25; })
      .text(function(d){ return d; })
      .attr("fill", function(d){ return colorMap(d)});

};

//----------------
// Draw frunctions
//----------------

function drawChart(data, subgroups, x, y, colorMap) {
  chart = d3.select("#chart");

  // stack the data per subgroup
  var stackedData = d3.stack()
    .keys(subgroups).order(d3.stackOrderNone)(data);
  
  
  // add X axis
  chart.append("g")
    .attr("id", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // add Y axis (invertito per via della convenzione utilizzata)
  chart.append("g")
    .attr("id", "y-axis")
    .call(d3.axisLeft(y));


  // ----------------
  // Series
  // ----------------
  var series = chart.append("g").attr("id", "series");
  
  series.selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")  
      .attr("class", "serie")
      .attr("fill", function(d) { return colorMap(d.key); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(_, i) { return x(i); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth())
        .attr("stroke", "black");

  series.selectAll(".serie").exit().remove();

  // ----------------
  // Legend
  // ----------------
  var legend = chart.append("g")
    .attr("id", "legend")
    .attr("transform",
    "translate(" + (width) + ", 0)");
  
      
  // Add the labeles in the legend for each name.
  legend.selectAll("text")
    .data(subgroups)
    .enter().append("text")
    .attr("class", "label")
    .attr("x", 10)
    .attr("y", function(_,i){ return (subgroups.length -1) * 25 - i*25; })
    .attr("fill", function(d){ return colorMap(d)})
    .text(function(d){ return d; })
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle");
  
  legend.selectAll(".label").exit().remove();
  
  // Add one dot in the legend for each name.
  legend.selectAll("circle")
    .data(subgroups)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", 0)
    .attr("cy", function(_,i){ return (subgroups.length - 1) * 25 - i*25;})
    .attr("r",  4)
    .attr("fill", function(d){ return colorMap(d)});
  
  legend.selectAll(".dot").exit().remove();
  

  // ----------------
  // Events
  // ----------------

  // Add interactivity
  var onclick = function() {
    var currKey = d3.select(this.parentNode).datum().key;
    var firstKey = subgroups[0];
    
    if (currKey == firstKey) {
      return;
    }
    
    swapIdx = subgroups.indexOf(currKey);
    subgroups[0] = currKey;
    subgroups[swapIdx] = firstKey;
    
    update(data, subgroups, x, y, colorMap);
    updateTooltip(data, this, colorMap);
  };

  var mouseover = function() {
    updateTooltip(data, this, colorMap, 0);
    d3.select("#tooltip").classed("hidden", false);
  };
  
  var onmousemove = function(d) {
    var tooltip = d3.select("#tooltip");

    var tooltipHeight = tooltip.node().getBoundingClientRect().height;
    var tooltipWidth = tooltip.node().getBoundingClientRect().width;
    
    tooltip
      .style("top", (d3.pointer(d)[1] + margin.top - tooltipHeight) + "px")
      .style("left",(d3.pointer(d)[0] + margin.left - tooltipWidth) + "px");
  };

  var mouseout = function() {
    d3.select("#tooltip").classed("hidden", true);
  };
  

  // add events //
  d3.selectAll(".serie")
  
  series.selectAll(".bar")
    .on("click", onclick)
    // show tooltip
    .on("mouseover", mouseover)
    .on("mousemove", onmousemove)
    // hide tooltip
    .on("mouseout", mouseout);
};


//----------------
// Main
//----------------

async function main() {
  // load data
  var data = await d3.json("./data/dataset.json");

  // enumeration of the data-points
  var groups = d3.range(0, data.length);
  
  // list of subgroups = one data case -> one of the staked bars of the final chart
  var subgroups = Object.keys(data[0]);
  
  // var colors = ['#ac92eb', '#4fc1e8', '#a0d568', '#ffce54', '#ed5564'];
  // var colors = d3.schemeOrRd[subgroups.length];
  var colors = d3.schemeYlOrBr[subgroups.length];
  // var colors = d3.schemeYlGnBu[subgroups.length];
  // var colors = d3.schemePuBuGn[subgroups.length];
  // var colors = d3.schemeBrBG[subgroups.length];

  const maxHeight = d3.max(d3.map(data, function(d){return d3.sum(Object.values(d))}));

  var x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding([0.2]);
  
  var y = d3.scaleLinear()
    .domain([0, maxHeight])
    .range([ height, 0 ]);

  // color palette = one color per subgroup
  var colorMap = d3.scaleOrdinal().domain(data)
    .range(colors);
  
  // set the dimensions and margins of the graph
  var svg = d3.select("#stacked-bars");
  svg.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  addChart();
  addTooltip();
  drawChart(data, subgroups, x, y, colorMap)
};



main();