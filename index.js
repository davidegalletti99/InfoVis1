// document constants
const totalWidth = document.documentElement.clientWidth;
const totalHeight = document.documentElement.clientHeight;

const margin = {top: .1 * totalHeight, right: .15 * totalWidth , bottom: .1 * totalHeight, left: .15 * totalWidth};
const width = totalWidth - margin.left - margin.right;
const height = totalHeight - margin.top - margin.bottom;

const legendWidth = .1 * totalWidth;
const legendHeight = .05 * totalHeight;

function computeContrastColor(hexColor, trashold = 150) {
  var red = parseInt(hexColor.substring(1,3), 16);
  var green = parseInt(hexColor.substring(3,5), 16);
  var blue = parseInt(hexColor.substring(5,7), 16);

  return (red*0.299 + green*0.587 + blue*0.114) > trashold ? "black" : "white";
}

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
// Update
//----------------
async function update(data, subgroups, x, y, colorMap) {
  var series = d3.select("#series");
  var legend = d3.select("#legend");
  var tooltip = d3.select("#tooltip");

  // stack the data per subgroup
  var stackedData = d3.stack()
    .keys(subgroups).order(d3.stackOrderNone)(data);

  // Update color
  series.selectAll(".serie").data(stackedData).transition().duration(1000)
    .attr("fill", function(d) { return colorMap(d.key); });
  
    // Update height and y position
  series.selectAll(".serie").selectAll(".bar")
    .data(function(d) { return d; }).transition().duration(1000)
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); });

  // Add one dot in the legend for each name.
  legend.selectAll(".dot")
    .data(subgroups).transition().duration(1000)
      .attr("cy", function(_,i){ return (subgroups.length - 1) * 25 - i * 25; })
      .attr("fill", function(d){ return colorMap(d)});
      
      // Add one dot in the legend for each name.
  legend.selectAll(".label")
    .data(subgroups).transition().duration(1000)
      .attr("y", function(_,i){ return (subgroups.length - 1) * 25 - i * 25; })
      .text(function(d){ return d; })
      .attr("fill", function(d){ return colorMap(d)});

};


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
    var currKey = d3.select(this).datum().key;
    var firstKey = subgroups[0];
    
    if (currKey == firstKey) {
      return;
    }
    
    swapIdx = subgroups.indexOf(currKey);
    subgroups[0] = currKey;
    subgroups[swapIdx] = firstKey;
    
    update(data, subgroups, x, y, colorMap);
    
    // var value = "evaluating...";
    // var tooltip = d3.select("#tooltip");
    // tooltip
    //   .select("#value")
    //   .text("value: " + value);
    
    // tooltip
    //   .select("#category")
    //   .text("category: " + firstKey);

    // var backgroundColor = colorMap(firstKey);
    // var textColor = computeContrastColor(backgroundColor);

    // tooltip
    //   .style("background-color", backgroundColor)
    //   .style("color", textColor);
  };

  var mouseover = function() {
    var tooltip = d3.select("#tooltip");
    var key = d3.select(this.parentNode).datum().key;
    var value = this.__data__[1] - this.__data__[0];
    
    tooltip
      .select("#value")
      .text("value: " + value);
    
    tooltip
      .select("#category")
      .text("category: " + key);

    var backgroundColor = colorMap(key);
    var textColor = computeContrastColor(backgroundColor);

    tooltip
      .style("background-color", backgroundColor)
      .style("color", textColor);
      
    tooltip.classed("hidden", false);

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
    .on("click", onclick);

  series.selectAll(".bar")
    // show tooltip
    .on("mouseover", mouseover)
    .on("mousemove", onmousemove)
    // hide tooltip
    .on("mouseout", mouseout);
};


async function main() {
  // load data
  var data = await d3.json("./data/dataset.json");

  // enumeration of the data-points
  var groups = d3.range(0, data.length);
  
  // list of subgroups = one data case -> one of the staked bars of the final chart
  var subgroups = Object.keys(data[0]);
  
  // var colors = ['#ac92eb', '#4fc1e8', '#a0d568', '#ffce54', '#ed5564']
  var colors = d3.schemeOrRd[subgroups.length];

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