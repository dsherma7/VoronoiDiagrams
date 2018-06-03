
function init(data) {
  
  xScale.domain(d3.extent(data,d=>d.x));
  yScale.domain(d3.extent(data,d=>d.z));
  cScale.domain(d3.extent(data,d=>d.y));

  data.forEach(function(d){
    if (Math.round(Math.random()*100) % 2)
      sites.push([xScale(d.x),yScale(d.z),d.y]);
  })

  draw_new();
}

function draw_new() {

  d3.selectAll('g').remove();

  voro_graph = d3.voronoi()
      .extent([[-1, -1], [width + 1, height + 1]])

  polygon = svg.append("g")
      .attr("class", "polygons")
    .selectAll("path")
    .data(voro_graph.polygons(sites))
    .enter().append("path")
      .call(redrawPolygon);

  link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(voro_graph.links(sites))
    .enter().append("line")
      .call(redrawLink);

  site = svg.append("g")
      .attr("class", "sites")
    .selectAll("circle")
    .data(sites)
    .enter().append("circle")
      .attr("r", 4)
      .style("fill",d=>cScale(d[2]))
      .call(redrawSite);
}

function moved() {

  var mouse = d3.mouse(this);
  mouse.push(interpolate(mouse[0],mouse[1]));
  sites[0] = mouse;  
  d3.select(".polygons :first-child").style("fill",cScale(sites[0][2]))
  redraw();

   div.transition()    
      .duration(200)    
      .style("opacity", .9);    
   div.html("<b>Error:</b> <span>"  + mouse[0] + "," + mouse[1] + "," + mouse[2] + "</span>")  
      .style("left", (d3.event.pageX + 40) + "px")   
      .style("top", (d3.event.pageY - 10) + "px"); 
}

function add_new() {
  var mouse = d3.mouse(this);
  mouse.push(interpolate(mouse[0],mouse[1]));
  sites.push(mouse);
  draw_new();
}

function redraw() {
  var diagram = voro_graph(sites);
  polygon = polygon.data(diagram.polygons(sites)).call(redrawPolygon);    
  link = link.data(diagram.links()), link.exit().remove();
  link = link.enter().append("line").merge(link).call(redrawLink);
  site = site.data(sites).call(redrawSite);  
}

function redrawPolygon(polygon) {
  polygon
      .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; });
}

function redrawLink(link) {
  link
      .attr("x1", function(d) { return d.source[0]; })
      .attr("y1", function(d) { return d.source[1]; })
      .attr("x2", function(d) { return d.target[0]; })
      .attr("y2", function(d) { return d.target[1]; });
}

function redrawSite(site) {
  site
      .attr("cx", function(d) { return d[0]; })
      .attr("cy", function(d) { return d[1]; })
      .style("fill", function(d) { return cScale(d[2]); });
}


function interpolate(x,y) {
  var neighbors = findAll(x,y,n_neighbors);
  return d3.mean(neighbors.nearest,d=>d.data[2]);
}

function findAll(x,y,r) {
  var voronoi = voronois[0];
  var start = voronoi.find(x,y,r);
  
  if(!start) return {center:[],nearest:[]}  ; // no results.
  
  var queue = [start];
  var checked = [];
  var results = [];
  
  for(i = 0; i < queue.length; i++) {
    checked.push(queue[i].index);                           // don't check cells twice
    var edges = voronoi.cells[queue[i].index].halfedges;   
    // use edges to find neighbors
    var neighbors = edges.map(function(e) {
      if(voronoi.edges[e].left == queue[i]) return voronoi.edges[e].right; 
    else return voronoi.edges[e].left;    
    })
    // for each neighbor, see if its point is within the radius:
    neighbors.forEach(function(n) { 
      if (n && checked.indexOf(n.index) == -1) {
      var dx = n[0] - x;
      var dy = n[1] - y;
      var d = Math.sqrt(dx*dx+dy*dy);
      
      if(d>r) checked.push(n.index)          // don't check cells twice
      else {
        queue.push(n);   // add to queue
        results.push(n); // add to results
      }
    } 
  })
}

  return {center:start,nearest:results};
}
