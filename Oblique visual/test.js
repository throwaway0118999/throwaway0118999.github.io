var gl;
var canvas;
var program;

var mModelViewLoc;
var mProjectionLoc;

var alpha = 45;
var l = 1;
var beta = 45;

var object = 0;

window.onload = function init() {
    // Get the canvas
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    // Setup the contexts and the program
    gl = WebGLUtils.setupWebGL(canvas);
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    gl.clearColor(0, 0, 0, 1.0);
    gl.viewport(0,0,canvas.width, canvas.height);
    
    cubeInit(gl);
    sphereInit(gl);
    gl.useProgram(program);
    
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mat4()));
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mat4()));
    
    initHTML();
    listeners();
    render();
}

function render() 
{
    gl.clear(gl.COLOR_BUFFER_BIT);
	
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(oblique()));
    drawObject(gl, program);

    window.requestAnimationFrame(render);
}

function drawObject(gl, program) {
    switch(object) {
        case 0: //cube
            cubeDrawWireFrame(gl, program);
            break;
        case 1: //sphere
            sphereDrawWireFrame(gl, program);
            break;
        case 2: //both
            cubeDrawWireFrame(gl, program);
            sphereDrawWireFrame(gl, program);
            break;
    }
}

function initHTML() {
    document.getElementById("alpha").value = alpha;
    document.getElementById("l").value = l;
    document.getElementById("beta").value = beta;
}

function listeners() {
    document.getElementById("alpha").addEventListener("input", function(event) {
        alpha = event.target.value;
        document.getElementById("alpha-display").innerHTML = alpha;
    });
    
    document.getElementById("l").addEventListener("input", function(event) {
        l = event.target.value;
        document.getElementById("l-display").innerHTML = l;
        
        
        beta = approx((180.0 * Math.atan(1/l))/Math.PI, 1);
        document.getElementById("beta").value = beta;
        document.getElementById("beta-display").innerHTML = beta;
    });
    
    document.getElementById("beta").addEventListener("input", function(event) {
        beta = event.target.value;
        document.getElementById("beta-display").innerHTML = beta;
        
        l = approx(1/Math.tan(radians(beta)), 2);
        document.getElementById("l").value = l;
        document.getElementById("l-display").innerHTML = l;
    });
    
    document.getElementById("alpha-30").addEventListener("click", function() {
        alpha = 30;
        document.getElementById("alpha-display").innerHTML = alpha;
        document.getElementById("alpha").value = alpha;
    });
    
    document.getElementById("alpha-45").addEventListener("click", function() {
        alpha = 45;
        document.getElementById("alpha-display").innerHTML = alpha;
        document.getElementById("alpha").value = alpha;
    });
    
    var l1 = function() {
        l = 1;
        document.getElementById("l-display").innerHTML = l;
        document.getElementById("l").value = l;
        
        beta = 45;
        document.getElementById("beta").value = beta;
        document.getElementById("beta-display").innerHTML = beta;
    };

    var l05 = function() {
        l = 0.5;
        document.getElementById("l-display").innerHTML = l;
        document.getElementById("l").value = l;
        
        beta = 63.4;
        document.getElementById("beta").value = beta;
        document.getElementById("beta-display").innerHTML = beta;
    };
    
    var l0 = function() {
        l = 0;
        document.getElementById("l-display").innerHTML = l;
        document.getElementById("l").value = l;
        
        beta = 90;
        document.getElementById("beta").value = beta;
        document.getElementById("beta-display").innerHTML = beta;
    };
    
    document.getElementById("l-1").addEventListener("click", l1);
    
    document.getElementById("l-0.5").addEventListener("click", l05);
    
    document.getElementById("l-0").addEventListener("click", l0);
    
    document.getElementById("beta-45").addEventListener("click", l1);
    
    document.getElementById("beta-63.4").addEventListener("click", l05);
    
    document.getElementById("beta-90").addEventListener("click", l0);
    
    document.getElementById("cube").addEventListener("click", function() {
        object = 0;
    });
    
    document.getElementById("sphere").addEventListener("click", function() {
        object = 1;
    });
    
    document.getElementById("both").addEventListener("click", function() {
        object = 2;
    });
}

function oblique() {
	var result = mat4();
    
	result[0][2] = -l*Math.cos(radians(alpha));
	result[1][2] = -l*Math.sin(radians(alpha));
	result[2][2] = 0;
	
	return result;
}

function approx(n, p) {
    return Math.round(n*Math.pow(10, p))/Math.pow(10, p);
}