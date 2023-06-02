// ----------------
// Author: Davide Glletti
// Date: 2023/06/28
// ----------------

d3.selection.prototype.first = function() {
  return d3.select(this.nodes()[0]);
};
d3.selection.prototype.last = function() {
  var last = this.size() - 1;
  if (last < 0) 
    return d3.select(null);

  return d3.select(this.nodes()[last]);
};

//----------------
// Costants 
//----------------

const margin = {top: 25, right: 0, bottom: 25, left: 30};
const strokeWidth = 2;


//----------------
// Utility functions
//----------------

function computeContrastColor(hexColor, trashold = .6) {
  return d3.hsl(hexColor).l > trashold ? "black" : "white";
}

//----------------
// Add functions
//----------------

function addTooltip() {
  var tooltip = d3.select("#dataviz")
    .append("div")
    .attr("id", "tooltip");
    
  tooltip.classed("hidden", true);
  
  tooltip.append("p")
    .append("span")
    .attr("id", "category")
    .text("Category");
    
  tooltip.append("p")
    .append("span")
    .attr("id", "value")
    .text("Value");
}

function addChart() {
  d3.select("#stacked-bars")
    .append("g")
    .attr("id", "chart");
}


function addTotalValue(totals) {
  var rects = d3.selectAll('.serie').last()
    .selectAll('.bar');
  
  var textData = [];
  rects.each(function(d,i) {
    textDatum = {
      width: d3.select(this).attr('width'),
      height: d3.select(this).attr('height'),
      y: parseFloat(d3.select(this).attr('y')),
      x: parseFloat(d3.select(this).attr('x')),
      text: d3.format(".3s")(totals[i]),
      };
    textData.push(textDatum);

  });

  var text = d3.select('.serie')
    .selectAll('.total-value')
    .data(textData)
    .enter()
    .append('text')
      .text(d => d.text)
      .attr('class', 'total-value')
      .attr('y', d => {
        return d.y - 8;
      })
      .attr('x', d => {
        return d.x + d.width / 2;
      });
};

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
    .text("Value: " + data[idx][category]);
  
  tooltip
    .select("#category")
    .text("Category: " + category);
};

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
  chart.style("transform", "translate(" + margin.left + "px, " + margin.top + "px)");
  var height = y.range()[0];
  var width = x.range()[1];

  // stack the data per subgroup
  var stackedData = d3.stack()
    .keys(subgroups).order(d3.stackOrderNone)(data);


  // add X axis
  chart.append("g")
    .attr("id", "x-axis")
    .attr("transform", "translate(0, " + height  + ")")
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
        .attr("width", x.bandwidth());

  series.selectAll(".serie").exit().remove();

  // ----------------
  // Legend
  // ----------------
  var legend = chart.append("g")
    .attr("id", "legend")
    .attr("transform",
    "translate(" + width + ", 0)");
  
      
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
    

    var coords = d3.pointer(d, d3.select("body").node());
    
    tooltip
      .style("left",(coords[0] - tooltipWidth) + "px")
      .style("top", (coords[1] - tooltipHeight) + "px");
  };

  var mouseout = function() {
    d3.select("#tooltip").classed("hidden", true);
  };
  

  // add events //
  series.selectAll(".bar")
    .on("click", onclick)
    // show tooltip
    .on("mouseover", mouseover)
    // move tooltip
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

  var dataviz = d3.select("#dataviz");

  var width = dataviz.node().getBoundingClientRect().width;
  var height = dataviz.node().getBoundingClientRect().height;

  
  // list of subgroups = one data case -> one of the staked bars of the final chart
  var subgroups = Object.keys(data[0]);
  
  // color shema
  // var colors = ['#ac92eb', '#4fc1e8', '#a0d568', '#ffce54', '#ed5564']; // chromatic aberration but nice
  // var colors = d3.schemeSpectral[subgroups.length]; // chromatic aberration
  // var colors = d3.schemeRdYlGn[subgroups.length]; // chromatic aberration
  // var colors = d3.schemeYlOrBr[subgroups.length]; // nice
  var colors = d3.schemeOrRd[subgroups.length]; // nice
  // var colors = d3.schemeGreens[subgroups.length]; // nice
  // var colors = d3.schemeReds[subgroups.length]; // nice
  // var colors = d3.schemeOranges[subgroups.length]; // nice
  // var colors = d3.schemeBlues[subgroups.length]; // problem with the background color
  // var colors = d3.schemeRdGy[subgroups.length]; // problema with the background color but nice

  // Compute the max height of the chart
  const maxHeight = d3.max(d3.map(data, function(d){return d3.sum(Object.values(d))}));

  // Compute the total sum for each data-point
  var totals = data.map(function(d) { return d3.sum(Object.values(d)); });

  var x = d3.scaleBand()
      .domain(groups)
      .range([0, width - margin.left - margin.right])
      .padding([0.2]);
  
  var y = d3.scaleLinear()
    .domain([0, maxHeight])
    .range([height - margin.top - margin.bottom, 0 ]);

  // color palette = one color per subgroup
  var colorMap = d3.scaleOrdinal().domain(data)
    .range(colors);

  addChart();
  addTooltip();
  drawChart(data, subgroups, x, y, colorMap);
  addTotalValue(totals);

};



main();