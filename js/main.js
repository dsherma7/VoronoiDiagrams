
// Build initial Canvas
var width = window.innerWidth, height = window.innerHeight;
var w = width, h = height ;

// Global Variables for Animations
var paused = false, animating = false;
var down = false, sx = 0, sy = 0;
var guiControlss=[], guis=[];

var extrudeSettings = { amount: 0.25, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: 0.6, bevelThickness: 0.1 };

// Phong Lighting Variables
var sunDirection = [3.0, -2.0, 0.0],
    sunIntensity = [1.0, 1.0, 1.0],
    ambientLightIntensity = [0.3, 0.3, 0.3];

// Main Illustrations
var renderers = [], cameras=[], containers = [], scenes=[];

// Data Sources
var datasets = [], xExent, yExent, zExent;
var data_files = [ 'Sinusoidal','Wave', 'Gaussian', 'Hourglass' ];

// Voronoi
var voronois = [], sitess = [], rests = [], last_num_sites = 10;

// Scales and Formatters
var delta = 30;

var format = d3.format("+.3f");
var colour = d3.scaleSequential(d3.interpolateRainbow),
    xScale = d3.scaleLinear().range([-1*delta,delta]),
    yScale = d3.scaleLinear().range([-1*delta,delta]),                  
    zScale = d3.scaleLinear().range([-1*delta,delta]),
    aScale = d3.scaleLinear().range([1, 0.5]),
    sScale = d3.scaleLinear().range([5, 0.2]);

function init(idx) {
    // Load both sets of Shaders and start the program
    loadTextResource('./gl/fragmentShader.glsl', function (fs_err, fs) {
        if (fs_err) {
            alert('Fatal error getting vertex shader (see console)');
            console.error(fs_err);
        } else {
            loadTextResource('./gl/vertexShader.glsl', function (vs_err, vs) {
                if (vs_err) {
                    alert('Fatal error getting fragment shader (see console)');
                    console.error(vs_err);
                } else {                     
                    build_transfer_function();                                         
                    init_render(idx,vs,fs);    
                    // init_render(1,vs,fs);    
                }
            });
        }
    });
};
loadData('Gaussian',0,function(){init(0)});

/* --------------------------------------
   Initial all webGL elements with GL shaders
   -------------------------------------- */
function init_render(idx,vertexShader,fragmentShader) {

    guiControlss[idx] = new function() {
        this.model = 'Gaussian';
        this.transparent = true;
        this.num_sites = 10;
        this.flatten = false;
    };        

    renderers[idx] = new THREE.WebGLRenderer();
    renderers[idx].setSize(w, h);
    renderers[idx].setClearColor(0x111111, 0.2);  // Changes BG colors

    cameras[idx] = new THREE.PerspectiveCamera(60, w / h, 0.001, 500);
    cameras[idx].position.z = 100;

    containers[idx] = document.getElementById('container'+idx);
    containers[idx].appendChild(renderers[idx].domElement);
    var controls = new THREE.OrbitControls( cameras[idx], containers[idx] );
    controls.center.set( 0.0, 0.0, 0.0 );
    
    scenes[idx] = new THREE.Scene();    
    guis[idx] = new dat.GUI({autoplace: false});
    guis[idx].domElement.id = "gui"+idx;

    addTriangulation(idx)
    animate();
    updateGUI();    
    onWindowResize();
    window.addEventListener( 'resize', onWindowResize, false );
}

/* ---------------------------------------------
    Adds triangulation between points
   --------------------------------------------- */
function addTriangulation(idx) {

    update_sites(idx);
   
    voronois[idx] = d3.voronoi().extent([[-1*delta, -1*delta], [delta, delta]])(sitess[idx]);

    scenes[idx].children.filter(d=>d.name=="polygon").forEach(d=>scenes[idx].remove(d))
    var polygon = voronois[idx].polygons()

    // if (false){
    for (var i=0; i < polygon.length; i++){
                
        if (polygon[i]){

        var points = [];
        polygon[i].map(function(d){            
            points.push(new THREE.Vector3(d[0],d[1],voronois[idx].find(d[0],d[1]).data[2]));
        });
        
        var x,y,z,f;
        [x,z,y,f] = polygon[i].data;

        // console.log(points.map(d=>[d.x,d.z,d.y]))
        var shape = new THREE.Shape(points);  
        // var geometry = new THREE.ConvexGeometry( points );      
        // var geometry = new THREE.LatheGeometry( points );
        var geometry = new THREE.ExtrudeGeometry( shape , extrudeSettings);
        

        if (!guiControlss[idx].flatten){
            geometry.rotateX( Math.abs(Math.atan2(y,0.2*(x+z))) );      
            geometry.rotateY( (1-f)*Math.PI / 2.5 );              
        }
        

        var geoCol = getColor(idx, f);
        var geoAlpha = geoCol.opacity;
        geoCol.opacity = 1.0;
        var material = new THREE.MeshBasicMaterial( {
            color: d3.rgb(geoCol).toString(),
            opacity: getOpacity(idx, f),
            transparent: guiControlss[idx].transparent,
            side: THREE.DoubleSide
        } );

        var mesh = new THREE.Mesh( geometry, material);
        mesh.name = "polygon";
        if (!guiControlss[idx].flatten)
            mesh.translateY(y);

        scenes[idx].add( mesh );
        }
        
    }  

}


/* --------------------------------------
      Functions run at each interval
   -------------------------------------- */
function animate(t) {
    requestAnimationFrame( animate );
    render();
}

/* --------------------------------------
      Render the shader elements
   -------------------------------------- */
function render() {
    for (var idx=0; idx<guis.length; idx++){
        renderers[idx].render( scenes[idx], cameras[idx] );
    }
}

/* --------------------------------------
      Loads & stores a dataset locally
   -------------------------------------- */
function loadData(file, idx, callback) {
    function type(d,i) { datasets[idx][i] = { x:+d.x, y:+d.y, z:+d.z, f:+d.f }}
    datasets[idx] = [];
    d3.csv("./data/"+file+".csv", type, function(d){

        if (!colorScales[idx])
             colorScales[idx] = d3.scaleLinear().range([tf_margin.left, tf_width-tf_margin.right]);
        colorScales[idx].domain(d3.extent(datasets[idx],d=>d.f));
        
        xExent = d3.extent(datasets[idx], function (d) {return d.x; }),
        yExent = d3.extent(datasets[idx], function (d) {return d.y; }),
        zExent = d3.extent(datasets[idx], function (d) {return d.z; }),
        fExent = d3.extent(datasets[idx], function (d) {return d.f; }),

        colour.domain(fExent).clamp(true);
        xScale.domain(xExent).clamp(true);
        yScale.domain(yExent).clamp(true);
        zScale.domain(zExent).clamp(true);
        aScale.domain(fExent).clamp(true);

        datasets[idx].shuffle();// = shuffle(datasets[idx]);
        
        sitess[idx] = [], rests[idx] = [];
        datasets[idx].forEach(function(c,i){
            if (i < last_num_sites) {
                sitess[idx].push([xScale(c.x), zScale(c.z), yScale(c.y), c.f]);
            }else{
                rests[idx].push({"i":i,"data":c});
            }
        })

        callback();
    })
}

/* --------------------------  
      Controls for the Viz
   -------------------------- */
function updateGUI() 
{
    for (var idx=0; idx<guis.length; idx++){
        
        d3.select('div#gui'+idx).remove()
        guis[idx] = new dat.GUI({autoplace: false});
        guis[idx].domElement.id = 'gui'+idx;

        set_load_data = function(){
            var idx = +this.__gui.domElement.id.slice(-1); 
            var value = guiControlss[idx].model;
            loadData(value, idx, function(){addTriangulation(idx)});
        }        
        update_points = function(){
            addTriangulation(this.domElement.classList.contains('0')?0:1)
        };

        guis[idx].add(guiControlss[idx], 'model', data_files )
                 .name("Dataset").onChange(set_load_data);
        guis[idx].add(guiControlss[idx], 'num_sites', 0, datasets[idx].length)
                 .name('# Sites').onFinishChange(update_points);
        guis[idx].add(guiControlss[idx], 'transparent')
                 .name('Transparent').onChange(update_points);
        guis[idx].add(guiControlss[idx], 'flatten')
                 .name('Flatten').onChange(update_points);
        
        d3.select(guis[idx].domElement)
          .selectAll('div').classed(idx,true)
        d3.select(guis[idx].domElement)          
          .style('top', height/2+20 + 'px')
           .transition().delay(50)
           .style('width', width/4 + 'px')
  }
      
}

/* --------------------------  
      Resize all elements 
   -------------------------- */
function onWindowResize( event ) {

    for (var idx=0; idx<guis.length; idx++){

        width = window.innerWidth;
        height = window.innerHeight;

        w = width * 0.7; 
        h = height * 0.7;

        cameras[idx].aspect = w / h;
        cameras[idx].updateProjectionMatrix();

        renderers[idx].setSize( w, h);

        guis[idx].width = width/4;
        guis[idx].height = height/2+50;
        
    }

    // palette.style('top',height*3/4-30)
    //            .style('left',width/2-150)
    d3.select('.toolbar').style('width',width*1.1);
    reset_transfer_function();

}


/* --------------------------------------
   Update the sites for the voronoi structure
   -------------------------------------- */
function update_sites(idx) {
    var num_to_add = guiControlss[idx].num_sites - last_num_sites
    if (num_to_add > 0){
        var errors = rests[0].map(function(d,i){
            return{'error':Math.abs(voronois[0].find(d.data.x,d.data.z).data[3]-d.data.f),'data':d.data,'i':i}
        });

        var bests = errors.sort(function(a,b){return a.error-b.error}).slice(0,num_to_add);

        bests.forEach(function(c){
            sitess[idx].push([xScale(c.data.x), zScale(c.data.z), yScale(c.data.y), c.data.f]);
            delete rests[idx][c.i]
        })
        rests[idx].clean(); 

    } else {
        sitess[idx] = [], rests[idx] = [];
        datasets[idx].forEach(function(c,i){
            if (i < guiControlss[idx].num_sites) {
                sitess[idx].push([xScale(c.x), zScale(c.z), yScale(c.y), c.f]);
            }else{
                rests[idx].push({"i":i,"data":c});
            }
        })
    }
    last_num_sites = guiControlss[idx].num_sites;
}


/* --------------------------------------
   Computes the area for a given set of points
   -------------------------------------- */
function polygonArea(points) {
  var sum = 0.0;
  var length = points.length;
  if (length < 3) {
    return sum;
  }
  points.forEach(function(d1, i1) {
    i2 = (i1 + 1) % length;
    d2 = points[i2];
    sum += (d2[1] * d1[0]) - (d1[1] * d2[0]);
  });
  return sum / 2;
}


