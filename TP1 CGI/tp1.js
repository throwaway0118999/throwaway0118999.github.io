var gl;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    var vertices = [
        vec2(-1, 1),
        vec2(-1, -1),
        vec2(1, 1),
        vec2(1, -1)
    ];
    
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    factorLoc = gl.getUniformLocation(program, "factor");
    gl.uniform1f(factorLoc, 1.0);
    
    fractalTypeLoc = gl.getUniformLocation(program, "fractalType");
    gl.uniform1i(fractalTypeLoc, true);
    
    scaleLoc = gl.getUniformLocation(program, "scale");
    gl.uniform1f(scaleLoc, scale);
    
    centerLoc = gl.getUniformLocation(program, "center");
    gl.uniform2fv(centerLoc, vec2(center[0], center[1]));
    
    julia_cLoc = gl.getUniformLocation(program, "julia_c");
    //Default value of vec2(0.0, 0.0), as per GLSL's defaults
    
    setupHTMLDefaults();
    setupListeners();
    render();
}

function setupHTMLDefaults() {
    //Set up fractal type selector
    var options = document.getElementById("fractal-select").options;
    
    for(var i = 0; i < options.length; ++i) {
        var d = options.item(0);
        
        if(d.value == "0") {
            d.selected = true;
            break;
        }
    }
    
    //Set up factor slider
    document.getElementById("slider").value = "1.0";
    
    //Set up Julia c value text inputs
    var r = document.getElementById("real"),
        i = document.getElementById("imaginary");
    
    r.disabled = true;
    r.value = "";
    i.disabled = true;
    i.value = "";
    
    //Set up Julia c submission button
    document.getElementById("submit-julia").disabled = true;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    requestAnimFrame(render);
}

var factorLoc;
var fractalTypeLoc;
var scaleLoc;
var centerLoc;
var julia_cLoc;

var scale = 1.0;
/*
    The point to display in the center of the screen,
    in model coordinates, scaled by our scale.
*/
var center = [0.0, 0.0];

var dragging = false;
/*
    The last point the mouse button was pressed at,
    in model coordinates, scaled by our scale.
*/
var lastPos;

function setupListeners() {
    document.getElementById("slider").addEventListener("input",
        function(event) {
            gl.uniform1f(factorLoc, event.target.value);
        }
    );

    document.getElementById("fractal-select").addEventListener("change",
        function(event) {
            var option = event.target.value;
        
            var r = document.getElementById("real"),
                i = document.getElementById("imaginary"),
                button = document.getElementById("submit-julia");
        
            if(option=="6") {
                r.disabled = false;
                i.disabled = false;
                button.disabled = false;
            } else {
                r.disabled = true;
                i.disabled = true;
                button.disabled = true;    
            }
        
            if(option == "0") {
                gl.uniform1i(fractalTypeLoc, true);
            } else {
                gl.uniform1i(fractalTypeLoc, false);
        
                var c;
                
                switch(option) {
                    case "1":
                        c = [-0.4, 0.6];
                        break;
                    case "2":
                        c = [0.285, 0.0];
                        break;
                    case "3":
                        c = [0.285, 0.01];
                        break;
                    case "4":
                        c = [-0.8, 0.156];
                        break;
                    case "5":
                        c = [0.8, 0.0];
                        break;
                    case "6":
                        var re = r.value,
                            im = i.value;
                        
                        if(isANumber(re) && isANumber(im)) {
                            c = [re, im];
                        } else {
                            c = [0.0, 0.0]; //A "dumb" default value for c
                        }
                        
                        break;
                }
                
                gl.uniform2fv(julia_cLoc, vec2(c[0], c[1]));
            }
        }
    );
    
    document.getElementById("submit-julia").addEventListener("click",
        function() {
            var re = document.getElementById("real").value,
                im = document.getElementById("imaginary").value;
        
            if(isANumber(re) && isANumber(im)) {
                gl.uniform2fv(julia_cLoc, vec2(re, im));
            } else {
                alert("c is not a number (make sure you're using \".\" as the decimal separator.)");
            }
        }
    );
    
    document.getElementById("reset-scale").addEventListener("click",
        function() {
            scale = 1.0;
            gl.uniform1f(scaleLoc, scale);
        }
    );
    
    document.getElementById("reset-center").addEventListener("click",
        function() {
            center = [0.0, 0.0];
            gl.uniform2fv(centerLoc, vec2(center[0], center[1]));
        }
    );
    
    window.addEventListener("keydown", function(event) {
        var key = String.fromCharCode(event.keyCode);
        
        switch(key) {
            case 'Q':
                scale *= 1.01;
                break;
            case 'A':
                scale /= 1.01;
                break;
        }

        gl.uniform1f(scaleLoc, scale);
    });
    
    var canvas = document.getElementById("gl-canvas");
    canvas.addEventListener("mousedown", function(event) {
        dragging = true;
        lastPos = screen2model(event.clientX, event.clientY);
    });
                            
    canvas.addEventListener("mouseup", function() {
        dragging = false;
    });
    
    canvas.addEventListener("mousemove", function(event) {
        if(dragging) {
            var coords = screen2model(event.clientX, event.clientY);
            
            var delta = [coords[0] - lastPos[0],
                         coords[1] - lastPos[1]];

            /*
                We subtract because the point we want to be at the
                center of the image is the one at the coordinates
                opposite to those of the translation vector.
                
                e.g. If we drag the image 1 unit to the right,
                then every point will be displayed as the one
                1 unit to its left.
            */
            center[0] -= delta[0];
            center[1] -= delta[1];
            
            gl.uniform2fv(centerLoc, vec2(center[0], center[1]));
            
            lastPos = coords;
        }
    });
}

/*
    Converts from screen coordinates [0, width]x[0, height] to
    scaled model coordinates [-1/scale, 1/scale]x[-1/scale, 1/scale].
*/
function screen2model(s_x, s_y) {
    var m_x, m_y;
    var canvas = document.getElementById("gl-canvas");
    var w = canvas.width, h = canvas.height;
    
    m_x = (s_x/w) * 2 - 1;
    m_y = 1 - 2 * (s_y/h);
    
    return [m_x/scale, m_y/scale];
}

function isANumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
