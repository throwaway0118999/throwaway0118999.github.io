var gl;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    // Three vertices
    var vertices = [];
    //var vertices = [vec2(1.0, 1.0),
    //               vec2(-1.0, -1.0),
    //               vec2(1.0, -1.0)]
    
    for(var i = 0; i < 10002; ++i) {
        for(var j = 0; j < 2; ++j) {
            var r1 = 2*Math.random() - 1;
            var r2 = 2*Math.random() - 1;
            
            vertices.push(vec2(r1, r2));
        }
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
    
    fColor = gl.getUniformLocation(program, "fColor");
    render();
}

var start = 0, end = 500;
var fColor;
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.drawArrays(gl.TRIANGLE_STRIP, start, end);
    //start = (start + 1)%10002;
    //end = (end + 1)%10002;
    for(var i = start; i < start + 500; i = (i + 1)%10000) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
        
        var arr = [];
        for(var j = 0; j < 3; ++j) {
            arr.push(Math.random());
        }
        
        gl.uniform4fv(fColor, vec4(arr[0], arr[1], arr[2]));
    }
    start = (start + 1)%10000;
    
    requestAnimFrame(render);
}