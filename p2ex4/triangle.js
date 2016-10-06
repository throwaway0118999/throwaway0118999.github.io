var gl;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    // Three vertices
    var vertices = [
        vec2(-1,-1),
        vec2(0, 1),
        vec2(1,-1)
    ];
    
    var goal = [
        vec2(-1, 1),
        vec2(0, -1),
        vec2(1, 1)
    ];
    
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
    
    var buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(goal), gl.STATIC_DRAW);
    
    var vGoal = gl.getAttribLocation(program, "vGoal");
    gl.vertexAttribPointer(vGoal, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vGoal);
    
    mixAmountLoc = gl.getUniformLocation(program, "mixAmount");
    
    render();
}

var mixAmount = 0;
var step = 0.01;
var mixAmountLoc;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if(mixAmount < 1) {
        mixAmount += step;
    }
    gl.uniform1f(mixAmountLoc, mixAmount);
    
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    
    requestAnimFrame(render);
}