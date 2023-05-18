// document constants
const totalWidth = document.documentElement.clientWidth;
const totalHeight = document.documentElement.clientHeight;

const margin = {top: .1 * totalHeight, right: .15 * totalWidth , bottom: .1 * totalHeight, left: .15 * totalWidth};
const width = totalWidth - margin.left - margin.right;
const height = totalHeight - margin.top - margin.bottom;

async function loadData() {
  return await d3.json("./data/dataset.json");;
};

// function to make the chart
function makeChart(data) {
  // create the chart
  var chart = d3.select("#stacked-bars")
      .append("g")
      .attr("id", "chart")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // ogni barra è dedicata ad un data-point 
  // ed è costituita dalla sovrapposizione delle cinque 
  // barre relative alle cinque variabili del data-point
  chart = d3.select("#chart");

  // enumeration of the data-points
  var groups = d3.range(0, data.length);

  // list of subgroups = one data case -> one of the staked bars of the final chart
  var subgroups = Object.getOwnPropertyNames(data[0]);

  const maxHeight = d3.max(d3.map(data, function(d){return d3.sum(Object.values(d))}))

  // add X axis
  var x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding([0.2])
    
  chart.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));


  // add Y axis (invertito per via della convenzione utilizzata)
  var y = d3.scaleLinear()
    .domain([0, maxHeight])
    .range([ height, 0 ]);
    
  chart.append("g")
    .call(d3.axisLeft(y));

  // color palette = one color per subgroup
  var colorMap = d3.scaleOrdinal().domain(data)
    .range(d3.schemeRdYlBu[subgroups.length])

  // stack the data per subgroup
  var stackedData = d3.stack()
    .keys(subgroups)(data);

  makeBars(chart, stackedData, x, y, colorMap);
  makeLegend(chart, subgroups, colorMap);
};

function makeBars(chart, stackedData, x, y, colorMap) {
    // Show the bars
    chart.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")  
      .attr("fill", function(d) { return colorMap(d.key); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(_, i) { return x(i); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("hover", function(d) { return d; })
        .attr("width",x.bandwidth());
}

function makeLegend(chart, labels, colorMap) {


  // Add one dot in the legend for each name.
  chart.selectAll("dots")
    .data(labels)
    .enter()
    .append("circle")
      .attr("cx", 0)
      .attr("cy", function(_,i){ return 0 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("r",  4)
      .style("fill", function(d){ return colorMap(d)})

  // Add one dot in the legend for each name.
  chart.selectAll("labels")
    .data(labels)
    .enter()
    .append("text")
      .attr("x", 20)
      .attr("y", function(_,i){ return 0 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
      .style("fill", function(d){ return colorMap(d)})
      .text(function(d){ return d})
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")

};

async function main() {
  // set the dimensions and margins of the graph
  d3.select("#stacked-bars")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  
  var data = await loadData();
  makeChart(data);
};

main();

