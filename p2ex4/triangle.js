var gl;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    // Three vertices
    var vertices = [];
    
    m = Math.floor(Math.random() * 4 + 3);
    for(var i = 0; i < m; ++i) {
        vertices.push(vec2(Math.random()*2 - 1, Math.random()*2 - 1));
    }
    
    var goal = [];
    
    for(var i = 0; i < vertices.length; ++i) {
        goal.push(vec2(Math.random()*2 - 1, Math.random()*2 - 1));
    }
    
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
    colorLoc = gl.getUniformLocation(program, "fColor");
    
    render();
}

var mixAmount = 0;
var step = 0.01;
var mixAmountLoc;
var m;
var colorLoc;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.uniform1f(mixAmountLoc, 0);
    gl.uniform4fv(colorLoc, vec4(0.8, 0.9, 0.0, 1.0));
    gl.drawArrays(gl.TRIANGLE_FAN, 0, m);
    gl.uniform4fv(colorLoc, vec4(0.0, 0.0, 0.0, 1.0));
    gl.drawArrays(gl.LINE_LOOP, 0, m);
    
    gl.uniform1f(mixAmountLoc, 1);
    gl.uniform4fv(colorLoc, vec4(1.0, 0.5, 0.0, 1.0));
    gl.drawArrays(gl.TRIANGLE_FAN, 0, m);
    gl.uniform4fv(colorLoc, vec4(1.0, 0.75, 0.79, 1.0));
    gl.drawArrays(gl.LINE_LOOP, 0, m);
    
    if(mixAmount < 1) {
        mixAmount += step;
    }
    gl.uniform1f(mixAmountLoc, mixAmount);

    gl.uniform4fv(colorLoc, vec4(0.3, 0.5, 0.8, 1.0));
    gl.drawArrays(gl.TRIANGLE_FAN, 0, m);
    gl.uniform4fv(colorLoc, vec4(1.0, 0.3, 0.0, 1.0));
    gl.drawArrays(gl.LINE_LOOP, 0, m);
    
    requestAnimFrame(render);
}