// document constants
const totalWidth = document.documentElement.clientWidth;
const totalHeight = document.documentElement.clientHeight;

const margin = {top: .1 * totalHeight, right: .15 * totalWidth , bottom: .1 * totalHeight, left: .15 * totalWidth};
const width = totalWidth - margin.left - margin.right;
const height = totalHeight - margin.top - margin.bottom;

const legendWidth = .1 * totalWidth;
const legendHeight = .05 * totalHeight;


async function loadData() {
  return await d3.json("./data/dataset.json");
};


function drawChart(stackedData, subgroups, x, y, colorMap) {
  svg = d3.select("#stacked-bars");


  // set the dimensions and margins of the graph
  svg.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  chart = svg.append("g")
    .attr("id", "chart")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")

  // add X axis
  chart.append("g")
    .attr("id", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // add Y axis (invertito per via della convenzione utilizzata)
  chart.append("g")
    .attr("id", "y-axis")
    .call(d3.axisLeft(y));

  // // ----------------
  // // Tooltip
  // // ----------------
  // // Three function that change the tooltip when user hover / move / leave a cell
  // var mouseover = function(d) { 
  //   var key = d3.select(this.parentNode).datum().key
  //   var value = (d.target.__data__[1] - d.target.__data__[0])
  //   var tooltip = d3.select("#tooltip")
    
  //   tooltip
  //     .select("#value")
  //     .text("value: " + value);
    
  //     tooltip
  //     .select("#category")
  //     .text("category: " + key);
    
  //   tooltip.classed("hidden", false);

  //   //Get this bar's x/y values, then augment for the tooltip
  //   var barHeight = parseFloat(d3.select(this).attr("height"));
  //   var tooltipHeight = parseFloat(tooltip.node().getBoundingClientRect().height);
  //   var xPosition = parseFloat(d3.select(this).attr("x")) + x.bandwidth() + 20;
  //   var yPosition = parseFloat(d3.select(this).attr("y")) + barHeight / 2 + tooltipHeight / 2;

  //   tooltip
  //   .style("background-color", colorMap(key))
  //   .style("left", xPosition + "px")
  //   .style("top", yPosition + "px");
  // };

  // var mouseout = function() {
  //   d3.select("#tooltip").classed("hidden", true);
  // };

  // ----------------
  // Series
  // ----------------
  series = chart.append("g").attr("id", "series");
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
        // // show tooltip
        // .on("mouseover", mouseover)
        // // hide tooltip
        // .on("mouseout", mouseout);

  series.selectAll(".serie").exit().remove();
  
  // ----------------
  // Legend
  // ----------------
  legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform",
          "translate(" + (width + margin.left) + "," + (margin.top) + ")");
  // Add one dot in the legend for each name.
  legend.selectAll("circle")
    .data(subgroups)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", 0)
      .attr("cy", function(_,i){ return (subgroups.length -1) * 25 - i*25;})
      .attr("r",  4)
      .attr("fill", function(d){ return colorMap(d)});
  
  legend.selectAll(".dot").exit().remove();

  // Add one dot in the legend for each name.
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

};

//----------------
// Update
//----------------
async function update(stackedData, labels, x, y, colorMap) {
  var series = d3.select("#series");
  var legend = d3.select("#legend");

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
    .data(labels).transition().duration(1000)
      .attr("cy", function(_,i){ return (labels.length - 1) * 25 - i * 25; })
      .attr("fill", function(d){ return colorMap(d)});
      
      // Add one dot in the legend for each name.
  legend.selectAll(".label")
    .data(labels).transition().duration(1000)
      .attr("y", function(_,i){ return (labels.length - 1) * 25 - i * 25; })
      .text(function(d){ return d; })
      .attr("fill", function(d){ return colorMap(d)});

}


async function main() {
  // load data
  var data = await loadData();

  // enumeration of the data-points
  var groups = d3.range(0, data.length);
  
  // list of subgroups = one data case -> one of the staked bars of the final chart
  var subgroups = Object.keys(data[0]);
  
  // var colors = ['#ac92eb', '#4fc1e8', '#a0d568', '#ffce54', '#ed5564']
  var colors = d3.schemeOrRd[subgroups.length]

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
  
  // stack the data per subgroup
  var stackedData = d3.stack()
    .keys(subgroups).order(d3.stackOrderNone)(data);

  drawChart(stackedData, subgroups, x, y, colorMap)

  d3.selectAll(".serie").on("click", function() {
    var currKey = d3.select(this).datum().key;
    var firstKey = subgroups[0];

    if (currKey == firstKey) {
      return;
    }
    
    swapIdx = subgroups.indexOf(currKey);
    subgroups[0] = currKey;
    subgroups[swapIdx] = firstKey;
    
    stackedData = d3.stack().keys(subgroups).order(d3.stackOrderNone)(data);
    update(stackedData, subgroups, x, y, colorMap);
  });
};

main();