var gl;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    // Three vertices
    var vertices = [
        vec2(-1,1),
        vec2(-1,-1),
        vec2(1,1),
        vec2(1,-1)
    ];

    setupCallbacks();
    
    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    
    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    displacementLoc = gl.getUniformLocation(program, "displacement");
    
    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    requestAnimFrame(render);
}

var dragging = false;
var lastPos;
var displacement = [0.0, 0.0];
var displacementLoc;

function setupCallbacks() {
    //press down mouse
    document.getElementById("gl-canvas").addEventListener("mousedown",
        function(event) {
            console.log("Mouse down");
            dragging = true;
            lastPos = screen2model(event.clientX, event.clientY);
            console.log("Last pos: " + lastPos);
        }
    );
    
    //release mouse
    document.getElementById("gl-canvas").addEventListener("mouseup",
        function() {
            console.log("Mouse up");
            dragging = false;
        }
    );
    
    //moving mouse
    document.getElementById("gl-canvas").addEventListener("mousemove",
        function(event) {
            if(dragging) {
                console.log("Last pos: " + lastPos);
                
                var coords = screen2model(event.clientX, event.clientY);
            
                console.log("Moving mouse");
                console.log("At coordinates: " + coords);
                
                displacement[0] += lastPos[0] - coords[0];
                displacement[1] += lastPos[1] - coords[1];
                console.log("Displacement: " + displacement);
                
                gl.uniform2fv(displacementLoc, vec2(displacement[0], displacement[1]));
                
                lastPos = coords;
            }
        }
    );
}

function screen2model(s_x, s_y) {
    var m_x, m_y;
    var canvas = document.getElementById("gl-canvas");
    var w = canvas.width, h = canvas.height;
    
    m_x = (s_x/w) * 2 - 1;
    m_y = 1 - 2 * (s_y/h);

    return [m_x, m_y];
}
