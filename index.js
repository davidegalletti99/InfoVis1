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

// function to make the chart
function makeChart(svg, stackedData, x, y, colorMap) {
  // ogni barra è dedicata ad un data-point 
  // ed è costituita dalla sovrapposizione delle cinque 
  // barre relative alle cinque variabili del data-point
  chart = svg.append("g")
    .attr("id", "chart")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")


  // add X axis
  chart.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // add Y axis (invertito per via della convenzione utilizzata)
  chart.append("g")
    .call(d3.axisLeft(y));

  // Show the bars
  chart.append("g")
    .attr("id", "series")
    .selectAll("g")
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
        .attr("hover", function(d) { return d; })
        .attr("width", x.bandwidth());
};


function makeLegend(svg, labels, colorMap) {
  legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform",
          "translate(" + (width + margin.left) + "," + (margin.top) + ")");
  // Add one dot in the legend for each name.
  legend.selectAll("dots")
    .data(labels)
    .enter()
    .append("circle")
      .attr("cx",0)
      .attr("cy", function(_,i){ return i*25})
      .attr("r",  4)
      .style("fill", function(d){ return colorMap(d)});

  // Add one dot in the legend for each name.
  legend.selectAll("labels")
    .data(labels)
    .enter()
    .append("text")
      .attr("x",10)
      .attr("y", function(_,i){ return i*25; })
      .style("fill", function(d){ return colorMap(d)})
      .text(function(d){ return d; })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");

};

async function main() {
  var data = await loadData();

  // enumeration of the data-points
  var groups = d3.range(0, data.length);

  // list of subgroups = one data case -> one of the staked bars of the final chart
  var subgroups = Object.getOwnPropertyNames(data[0]);

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
    .range(d3.schemeRdYlBu[subgroups.length]);
  
  // stack the data per subgroup
  var stackedData = d3.stack()
    .keys(subgroups)(data);
  
  svg = d3.select("#stacked-bars");

  // set the dimensions and margins of the graph
  svg.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  
  makeChart(svg, stackedData, x, y, colorMap);
  makeLegend(svg, subgroups, colorMap);

  d3.selectAll(".bar").on("click", function(event, i) {
    var currentSerie = d3.select(this.parentNode);
    var firstSerie = d3.select("#series").select(".serie");

    firstKey = firstSerie.datum().key;
    currentKey = currentSerie.datum().key;

    currentSerie.transition().duration(1000).attr("fill", colorMap(firstSerie.datum().key));
    firstSerie.transition().duration(1000).attr("fill", colorMap(currentSerie.datum().key));

    currentSerie.datum().key = firstKey;
    firstSerie.datum().key = currentKey;


    // var tmp_data = currentSerie.datum().data;
    // currentSerie.datum().data = firstSerie.datum().data;
    // firstSerie.datum().data = tmp_data;

    console.log(currentSerie.datum().key);
    console.log(firstSerie.datum().key);

  });


};

main();