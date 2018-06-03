
// For a drop-down of interpolators
var interpolators = [
    "Rainbow", 	"Viridis", "Inferno", "Magma", 
    "Plasma", "Warm", "Cool", "CubehelixDefault"
  ];

// Margins for the transfer function
var tf_margin = {'left':20,'top':5,'bottom':30,'right':5}
var toolbar_width = window.innerWidth,
	toolbar_height = window.innerHeight * 0.17,
	tf_width = toolbar_width / 2.5 - tf_margin.left - tf_margin.right,
	tf_height = toolbar_height - tf_margin.top - tf_margin.bottom;

// Scales for the range of the data and colors
var x = d3.scaleLinear().range([tf_margin.left, tf_width-tf_margin.right]),
 	y = d3.scaleLinear().range([tf_height, tf_margin.top]),
	color = d3.scaleSequential(d3.interpolateRainbow).domain([tf_height,0]),
	percent = d3.scaleLinear().domain([0,tf_width]).range([0,100]),
	colorScales = [];
var bisect = d3.bisector(function(d){return d.x}),
	bisectColor = d3.bisector(d => d);

// Default Values for the Transfer Functions
var transfer, result, selected_col = "#00000000", started = false;
var num_pts = 20, default_col = d3.rgb("grey"), selectValue = 'Rainbow';

// Set equally spaced x values and apply a linear function to them 
var xs = $.map($(Array(num_pts-1)),function(val, i) { return tf_margin.left + tf_width*(i+1)/num_pts; });
var data = getLinearData(xs);

// The color gradients produced by the transfer function
var default_colors = [d3.rgb('lightgreen'),d3.rgb('yellow'),d3.rgb('goldenrod'),d3.rgb('brown')];
var pts = xs, cols = Array(num_pts).fill(default_col), dx = Math.floor(num_pts/default_colors.length);
for (var i=0; i<default_colors.length; i++)
	for (var j=0; j<dx; j++)
		cols[dx*i + j] = default_colors[i]


build_transfer_function = function(){	
	
	// Builds the original transfer function and sets 

	toolbar_width = window.innerWidth, toolbar_height = window.innerHeight * 0.20,
	tf_width = toolbar_width / 2.5 - tf_margin.left - tf_margin.right,
	tf_height = toolbar_height - tf_margin.top - tf_margin.bottom;

	var div = d3.select("#toolbar");
	div.attr('width',toolbar_width)
	   .attr('height',toolbar_height);

	var toolbar = div.append('svg').classed('toolbar',true)
				 .attr('width',toolbar_width)
				 .attr('height',toolbar_height)

	transfer = toolbar.append('svg').attr('id','transfer_func');	
    transfer.attr('x',toolbar_width/2 - tf_width/2)
		    .attr('y',toolbar_height/2 - tf_height/2)
		    .attr('width',tf_width + tf_margin.left + tf_margin.right)
		    .attr('height',tf_height + tf_margin.top + tf_margin.bottom)

	y.domain(d3.extent(data, d => d.y));	
	result = data;

	// Re Build all Dashboard Elements
	build_plot(); draw_legend(18); build_palette();
	// build_phong_lighting_dials();
}

function build_palette() {
	// Build palette selector
	var selector = 
	  d3.select('#interpolate_select')  	

	var select = d3.select('#palette')  
	  	.attr('class','select')
	    .on('change',change_palette)    
	    .property("selected", function(d){ return d === 'Rainbow'; })

	var options = select
	  .selectAll('option')
		.data(interpolators).enter()
		.append('option')
			.text(function (d) { return d; })
			.property('selected',d => d=="Rainbow")

	d3.select(".selector button").on('mousedown',reset_transfer_function);
}


function build_plot() {
	// Build Transfer Function as Plot
	result = result.sort(function(a, b) { return  a.x - b.x; })


	toolbar_width = window.innerWidth, toolbar_height = window.innerHeight * 0.17,
	tf_width = toolbar_width / 2.5 - tf_margin.left - tf_margin.right,
	tf_height = toolbar_height - tf_margin.top - tf_margin.bottom;

	// Scales for the range of the data and colors
	x.domain(d3.extent(result, d => d.x)).range([tf_margin.left, tf_width-tf_margin.right]),
 	y.domain(d3.extent(result, d => d.y)).range([tf_height, tf_margin.top]),
	color.domain([tf_height,0]), 	percent.domain([0,tf_width]);
	// colorScales.range([tf_margin.left, tf_width-tf_margin.right]);


	var area = d3.line()
		.curve(d3.curveMonotoneY)
	    .x(function(d) { return x(d.x); })
	    .y(function(d) { return y(d.y); })

	var defs = transfer.append("defs").attr('class','_tf');

	var gradient = defs.append("linearGradient")
	   .attr("id", "svgGradient")
	   .attr("x1", "0%")
	   .attr("x2", "100%")
	   .attr("y1", "0%")
	   .attr("y2", "0%")


	pts.forEach(function(pt,i){
		gradient.append("stop")
		   .attr('class', 'start')
		   .attr("offset", percent(pt) + "%")
		   .attr("stop-color", cols[i])
		   .attr("stop-opacity", getOpacity(0, pt));
	})

 	transfer.append('g').attr('id','filled_area').attr('class','_tf')
			.append('path')			
			.datum(result)
			.attr('d',area)		  
			.style('fill','url(#svgGradient)')
			.style('stroke',default_col)
			.style('stroke-width',0.5)
			.call(d3.drag()
				.on("drag", function(d) {
				    var event = d3.mouse(this);
					this.setAttribute('x',event[0])
					this.setAttribute('y',event[1])

					// console.log(event[0])
					if (event[0] < tf_width - tf_margin.right && event[0] > tf_margin.left){
						cnt = 0; pts.forEach(function(d,i){ if (d < event[0]){ cnt = i} });											
						pts = pts.slice(0,cnt).concat([event[0]]).concat(pts.slice(cnt+1));
						cols = cols.slice(0,cnt).concat([selected_col]).concat(cols.slice(cnt+1));																	
						setGUIColors();												
						transfer.selectAll('defs').remove();		 
						build_plot();
					}  
			    })
			    .on("end",function(){
			    	transfer.selectAll('g,defs').remove();
			    	build_plot();	
			    })
			)

	transfer.selectAll('circle')
			.data(result)
			.enter()
			.append('circle')
			.attr('class','_tf')
			.attr('cx',d=>x(d.x))
			.attr('cy',d=>y(d.y))
			.attr('r',2)
			.attr('fill', default_col)
			.style('z-index',2)
			.call(d3.drag()
				.on("drag", function(d,i){
					var event = d3.mouse(this);
					event[0] = x.invert(event[0]);
					event[1] = y.invert(event[1]);
					// console.log(event)
					var dx = toolbar_width/2 - tf_width/2,
						dy = toolbar_height/2 - tf_height/2
					if (i != 0 && i != result.length - 1 
						&& event[1] > y.domain()[0] && event[1] < y.domain()[1]){
						result[i] = {'x':event[0],'y':event[1]}	
						transfer.selectAll('g').remove();
						build_plot();					
						this.setAttribute('cx',x(event[0]))
						this.setAttribute('cy',y(event[1]))
						setGUIColors();
					}
				})
				.on('end',function(d){
					transfer.selectAll('circle').remove();
					build_plot();
				})
			)
			.style('cursor','pointer')	

	build_palette();
}

function draw_legend(cnt) {
	var num_cols = $.map($(Array(cnt)),function(val, i) { return tf_height*i/cnt; });
	transfer.selectAll('rect').remove();
	transfer.selectAll('rect')
			.data(num_cols)
			.enter()
			.append('rect')
			.attr('class','_tf')
			.attr('x',tf_width + tf_margin.right) 
			.attr('y',d=>d)
			.attr('width',10)
			.attr('height',tf_height / (cnt-1))
			.attr('fill',d=>color(d))
			.style('cursor','pointer')
			.on('mousedown',function(d){
				selected_col = d3.rgb(color(d));
				makeCursor(color(d));			
			})			
}

function reset_transfer_function() {

	// sunDirection = sunIntensity = [1,1,1];
	toolbar_width = window.innerWidth, toolbar_height = window.innerHeight * 0.17,
	tf_width = toolbar_width / 2.5 - tf_margin.left - tf_margin.right,
	tf_height = toolbar_height - tf_margin.top - tf_margin.bottom;

	// Resets everything for the transfer function
	pts = $.map($(Array(num_pts)),function(val, i) { return tf_margin.left + tf_width*(i+1)/num_pts; });
	dx = Math.floor(num_pts/default_colors.length);
	for (var i=0; i<default_colors.length; i++)
		for (var j=0; j<dx; j++)
			cols[dx*i + j] = default_colors[i]

	data = getLinearData(xs);
	results = data;

	transfer.style('width',tf_width).style('height',tf_height)

	d3.selectAll('._tf').remove();			
	build_plot();  draw_legend(18);	
}

function change_palette() {
	// Changed the color interpolator for brushing the Transfer function
	selectValue = d3.select('select').property('value')
	color = d3.scaleSequential(d3["interpolate" + selectValue]).domain([tf_height,0]);
	draw_legend(18);
	build_dial_colorbar(18);
};

function getLinearData(xs) {	
	// Returns a dataset with x = xs and y = xs / 8;
	var f = function(x){return d3.max([0,x/8]);}
	var ys = xs.map(f);
	var data = [{'x':tf_margin.left,'y':0}];
	xs.forEach(function(_,i){ data[i+1] = {'x':xs[i],'y':ys[i]}; })
	data.push({'x':tf_width+tf_margin.left,'y':0})	
	return data;
}

function makeCursor(color) {
	// Sets the mouse to a certain colored cursor
    
    var cursor = document.createElement('canvas'),
        ctx = cursor.getContext('2d');

    cursor.width = 16;
    cursor.height = 16;
    
    ctx.strokeStyle = color;
    
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    ctx.moveTo(2, 12);
    ctx.lineTo(2, 2);
    ctx.lineTo(12, 2);
    ctx.moveTo(2, 2);
    ctx.lineTo(30, 30)    
    ctx.stroke();
   
    transfer_func.style.cursor = 'url(' + cursor.toDataURL() + '), auto';
}

//  For Getting Color values from Transfer Functions for the GUI
function linearInterpolate(x,y) {
    return (x + y) / 2;
}

function getOpacity(idx, value) {
	value = colorScales[idx](value);
	var i = d3.min([bisect.left(result, value), result.length-2])	
	return linearInterpolate(result[i].y, result[i+1].y) / d3.max(result, d => d.y);	
}

function getColor(idx, value) {
	value = colorScales[idx](value);
	var i = d3.min([bisectColor.left(pts, value), pts.length-2])	
	var r = Math.round(linearInterpolate(cols[i].r, cols[i+1].r)),
		g = Math.round(linearInterpolate(cols[i].g, cols[i+1].g)),
		b = Math.round(linearInterpolate(cols[i].b, cols[i+1].b));
		o = Math.round(getOpacity(idx, value)*100)/100;
		if (o == undefined){
			console.log('bad value: ' + value)
			o = 1.0;
		}
	return d3.rgb(r,g,b,o);
}

function setGUIColors() {
	// Updated Provided Values
	for (var idx=0; idx<guis.length; idx++){
		addTriangulation(idx);		
	}
}
