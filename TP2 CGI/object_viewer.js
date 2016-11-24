/************************************************
AXXXXX SXXXXX - XXXX7 |
MXXXXXX AXXXX - XXXX5 |
----------------------*

All functions should try to avoid using global
state outside of their sections.
Any functions breaking this rule should be
marked as /!\ DIRTY /!\.
If deemed appropriate, a function that doesn't
break the aforementioned rule may also be
marked as being /!\ DIRTY /!\ (if its reliance
on global state is deemed too unintuitive).
************************************************/

/************************************************
Initalisation
************************************************/
/***************************+
Variables
****************************/
var gl;
var canvas;
var program, program_original, program_alt;

/****************************
Functions
****************************/
//Don't touch this too much (provided to us)
function load_file() {
    var selectedFile = this.files[0];
    var reader = new FileReader();
    var id = (this.id == "vertex" ? "vertex-shader-2" : "fragment-shader-2");
    
    reader.onload = (function(f) {
        var fname = f.name;
        return function(e) {
            console.log(fname);
            console.log(e.target.result);
            console.log(id);
            document.getElementById(id).textContent = e.target.result;
            program_alt = initShaders(gl, "vertex-shader-2", "fragment-shader-2");
            
            //Added by us: No point in calling reset_program
            //when the program isn't valid
            if(program_alt != -1) {
                reset_program(program_alt);
            }
        }
    })(selectedFile);
    
    reader.readAsText(selectedFile);
}

/****************************
/!\ DIRTY /!\:
  - mModelViewLoc
  - mNormalsLoc
  - mProjectionLoc
  - usingWireframeLoc
****************************/
function reset_program(prg) {    
    mModelViewLoc = gl.getUniformLocation(prg, "mModelView");
    mNormalsLoc = gl.getUniformLocation(prg, "mNormals");
    mProjectionLoc = gl.getUniformLocation(prg, "mProjection");
    
    if(prg == program_original) {
        usingWireframeLoc = gl.getUniformLocation(prg, "usingWireframe");
    }
    
    program = prg;
    gl.useProgram(program);
}

/****************************
/!\ DIRTY /!\:
  - aspect
****************************/
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) {
        alert("WebGL isn't available");
    }

    gl = WebGLUtils.setupWebGL(canvas);
    program_original = initShaders(gl, "vertex-shader", "fragment-shader");
    reset_program(program_original);
    
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    sphereInit(gl);
    cubeInit(gl);
    pyramidInit(gl);
    torusInit(gl);
    
    aspect = canvas.width/canvas.height;
    window.onresize = function() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        aspect = canvas.width / canvas.height;
    }

    setupDefaults();
    setupListeners();
    
    gl.enable(gl.DEPTH_TEST);
    render();
}

/************************************************
Rendering
************************************************/
/***************************+
Variables
****************************/
var aspect;

var mModelViewLoc;
var mProjectionLoc;
var mNormalsLoc;

//Used in the default fragment shader to output
//different values to gl_FragColor, depending
//on whether we're rendering a wireframe or a surface
var usingWireframeLoc;

/***************************+
Functions
****************************/
function drawObject(currentObject, currentSurface) {
    switch(currentObject) {
        case "cube":
            drawObject_helper(currentSurface, cubeDrawWireFrame, cubeDrawFilled);
            break;
        case "sphere":
            drawObject_helper(currentSurface, sphereDrawWireFrame, sphereDrawFilled);
            break;
        case "pyramid":
            drawObject_helper(currentSurface, pyramidDrawWireFrame, pyramidDrawFilled);
            break;
        case "torus":
            drawObject_helper(currentSurface, torusDrawWireFrame, torusDrawFilled);
            break;
        default:
            alert("You should not be seeing this. You should reload the page.");
            break;
    }
}

/****************************
/!\ DIRTY /!\:
  - gl
  - program
  - program_original
****************************/
function drawObject_helper(currentSurface, fn_wireFrame, fn_surface) {
    var is_original_prg = (program == program_original);
    
    switch(currentSurface) {
        case "wireframe":
            if(is_original_prg) {
                gl.uniform1i(usingWireframeLoc, 1);
            }
            
            fn_wireFrame(gl, program);
            break;
        case "surface":
            if(is_original_prg) {
                gl.uniform1i(usingWireframeLoc, 0);
            }
            
            fn_surface(gl, program);
            break;
        case "both":
            if(is_original_prg) {
                gl.uniform1i(usingWireframeLoc, 0);
            }
            fn_surface(gl, program);

            if(is_original_prg) {
                gl.uniform1i(usingWireframeLoc, 1);
            }
            fn_wireFrame(gl, program);
            break;
        default:
            alert("You should not be seeing this. You should reload the page.");
            break;
    }
}

/****************************
/!\ DIRTY /!\:
  - gl
  - currentProjection
  - alpha
  - l
  - theta
  - gamma
  - d
  - currentObject
  - currentSurface
****************************/
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //O aspect diz-nos "quanta" largura ter por cada unidade de altura
    var mProjection;
    if(aspect >= 1) { //Temos largura a mais
        mProjection = ortho(-1 * aspect, 1 * aspect, -1, 1, -1, 1);
    } else { //Neste caso o que temos em demasia é altura
        mProjection = ortho(-1, 1, -1*(1/aspect), 1*(1/aspect), -1, 1);
    }
    
    var modelView;
    var mNormals;
    switch(currentProjection) {
        case "oblique":
            mModelView = oblique(alpha, l);
            mNormals = mat4();
            break;
        case "axonometric":
            mModelView = axonometric(theta, gamma);
            mNormals = transpose(inverse(mModelView));
            break;
        case "perspective":
            mModelView = perspect(d);
            mNormals = mat4();
            break;
        default:
            alert("You should not be seeing this. You should reload the page.");
            break;
    }

    //Other view - Projecção definida pelo utilizador
    gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height/2);
	render_helper(currentObject, currentSurface, mProjection, mModelView, mNormals);

    //Front view - Alçado Principal
    gl.viewport(0, canvas.height/2, canvas.width/2, canvas.height/2);
    mModelView = frontView();
    mNormals = transpose(inverse(mModelView));
	render_helper(currentObject, currentSurface, mProjection, mModelView, mNormals);

    //Top view - Planta
    gl.viewport(0, 0, canvas.width/2, canvas.height/2);
    mModelView = plantView();
    mNormals = transpose(inverse(mModelView));
	render_helper(currentObject, currentSurface, mProjection, mModelView, mNormals);
    
    //Left side view - Alçado lateral esquerdo
    gl.viewport(canvas.width/2, canvas.height/2, canvas.width/2, canvas.height/2);
    mModelView = leftSideView();
    mNormals = transpose(inverse(mModelView));
	render_helper(currentObject, currentSurface, mProjection, mModelView, mNormals);

    window.requestAnimationFrame(render);
}

/****************************
/!\ DIRTY /!\:
  - gl
****************************/
function render_helper(currentObject, currentSurface, mProjection, mModelView, mNormals) {
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mModelView));
    gl.uniformMatrix4fv(mNormalsLoc, false, flatten(mNormals));
    drawObject(currentObject, currentSurface);
}

/************************************************
Interface
************************************************/
var currentObject;
var currentSurface;
var currentProjection;

/************************************************
Interface > Defaults
************************************************/

/***************************+
Functions
****************************/
/****************************
/!\ DIRTY /!\:
  - program_original
****************************/
function setupDefaults() {
    //User submitted shaders' loaders
    document.getElementById("vertex").onchange = load_file;
    document.getElementById("fragment").onchange = load_file;
    document.getElementById("reset-shaders").addEventListener("click", function() {
        reset_program(program_original);
    });
    
    //Object (to render) selection
    var object_opts = document.getElementById("object-select").children;
   
    for(var i = 0; i < object_opts.length; ++i) {
        if(object_opts[i].value != "cube") {
            object_opts[i].selected = false;
        } else {
            object_opts[i].selected = true;
        }
    }
    currentObject = "cube";
    
    //Surface (wireframe or filled) selection
    var surface_btns = document.getElementById("surface-form").children;
    
    for(var i = 0; i < surface_btns.length; ++i) {
        if(surface_btns[i].value != "wireframe") {
            surface_btns[i].checked = false;
        } else {
            surface_btns[i].checked = true;
        }
    }
    currentSurface = "wireframe";
    
    //Projection selection
    var projection_btns = document.getElementById("projection-form").children;
    
    for(var i = 0; i < projection_btns.length; ++i) {
        if(projection_btns[i].value != "oblique") {
            projection_btns[i].checked = false;
        } else {
            projection_btns[i].checked = true;
        }
    }
    currentProjection = "oblique";
    
    //Hiding the divs of the currently unused projections
    document.getElementById("axonometric-div").hidden = true;
    document.getElementById("perspective-div").hidden = true;

    //Setting up each projection's defaults
    obliqueProjectionDefaults();
    axonometricProjectionDefaults();
    perspectiveProjectionDefaults();
}

function obliqueProjectionDefaults() {
    changeAlpha(45);
    changeL(1);
}

function axonometricProjectionDefaults() {
    changeA(42);
    changeB(7);

    //Although the following lines may seem out of place
    //when compared to the other XXXDefaults() functions,
    //consider that the only reason the other functions
    //seem so simple is that the equivalent "interface reset"
    //code (to reset the HTML elements to their initial state)
    //is completely encapsulated in the changeXXX() functions.
    
    var axonometric_btns = document.getElementById("axonometric-form").children;
    
    var projection_controls = document.getElementById("axo-projection-plane-angles");
    var rotation_controls = document.getElementById("axo-rotation-angles");
    
    //It may be the case that we're coming from setupDefaults(), and hence
    //None of the controls are hidden yet.
    if(!rotation_controls.hidden && !projection_controls.hidden) {
        rotation_controls.hidden = true;    //Hide one
        axo_projection_mode = "projection"; //Set the other as the current projection mode
    }
        
    //Check the button corresponding to the interface being used
    //to change the angles of the projection
    for(var i = 0; i < axonometric_btns.length; ++i) {
        if( (axonometric_btns[i].value == "projection" && !projection_controls.hidden) ||
            (axonometric_btns[i].value == "rotation" && !rotation_controls.hidden) )
        {
            axonometric_btns[i].checked = true;
        } else {
            axonometric_btns[i].checked = false;
        }
    }
}

function perspectiveProjectionDefaults() {
    changeD(2);
}

/************************************************
Interface > Listeners
************************************************/

/***************************+
Functions
****************************/
function setupListeners() {
    var object_select = document.getElementById("object-select");
    var surface_form = document.getElementById("surface-form");
    var projection_form = document.getElementById("projection-form");
    
    var oblique_div = document.getElementById("oblique-div");
    var axonometric_div = document.getElementById("axonometric-div");
    var perspective_div = document.getElementById("perspective-div");
    
    var reset_btn = document.getElementById("reset-btn");
    
    object_select.addEventListener("change", function(event) {
        currentObject = event.target.value;
    });
    
    surface_form.addEventListener("change", function(event) {
        currentSurface = event.target.value;
    });
    
    projection_form.addEventListener("change", function(event) {
        switch(event.target.value) {
            case "oblique":
                oblique_div.hidden = false;
                axonometric_div.hidden = true;
                perspective_div.hidden = true;
                break;
            case "axonometric":
                oblique_div.hidden = true;
                axonometric_div.hidden = false;
                perspective_div.hidden = true;
                break;
            case "perspective":
                oblique_div.hidden = true;
                axonometric_div.hidden = true;
                perspective_div.hidden = false;
                break;
            default:
                alert("You should not be seeing this. You should reload the page.");
                break;
        }
        
        currentProjection = event.target.value;
    });
    
    reset_btn.addEventListener("click", function() {
       switch(currentProjection) {
            case "oblique":
                obliqueProjectionDefaults();
                break;
            case "axonometric":
               axonometricProjectionDefaults();
                break;
            case "perspective":
               perspectiveProjectionDefaults();
                break;
            default:
                alert("You should not be seeing this. You should reload the page.");
                break;
       } 
    });
    
    obliqueDivListeners();
    axonometricDivListeners();
    perspectiveDivListeners();
}

/****************************
/!\ DIRTY /!\:
  - l
  - beta
****************************/
function obliqueDivListeners() {
    document.getElementById("alpha").addEventListener("input", function(event) {
        changeAlpha(event.target.value);
    });
    
    document.getElementById("l").addEventListener("input", function(event) {
        changeL(event.target.value);
    });
    
    document.getElementById("beta").addEventListener("input", function(event) {
        changeBeta(event.target.value);
    });
    
    document.getElementById("alpha-30").addEventListener("click", function() {
        changeAlpha(30);
    });
    
    document.getElementById("alpha-45").addEventListener("click", function() {
        changeAlpha(45);
    });
    
    var no_foreshorten = function() {
        changeL(1);
    };

    //I distinguish between these two only
    //because l = 0.5 does not give *exactly*
    //beta = 63.4º, although the reverse is true
    //(beta = 63.4º -> l = 0.5)
    var half_foreshorten_l = function() {
        changeL(0.5);
    };
    
    var half_foreshorten_beta = function() {
        changeBeta(63.4);
    };
    
    var full_foreshorten = function() {
        changeL(0);
    };
    
    document.getElementById("l-1").addEventListener("click", no_foreshorten);
    
    document.getElementById("l-0.5").addEventListener("click", half_foreshorten_l);
    
    document.getElementById("l-0").addEventListener("click", full_foreshorten);
    
    document.getElementById("beta-45").addEventListener("click", no_foreshorten);
    
    document.getElementById("beta-63.4").addEventListener("click", half_foreshorten_beta);
    
    document.getElementById("beta-90").addEventListener("click", full_foreshorten);
}

/****************************
/!\ DIRTY /!\:
  - d
****************************/
function perspectiveDivListeners() {
    document.getElementById("d").addEventListener("input", function(event) {
        changeD(event.target.value);
    });
    
    //The only reason for us not to use changeD() here as well
    //is that we don't want to set the slider's value to Infinity
    document.getElementById("d-+inf").addEventListener("click", function() {
        d = Infinity;
        var d_slider = document.getElementById("d");
        d_slider.value = d_slider.max;
        
        document.getElementById("d-display").innerHTML = "+&infin;";
    });
}

/************************************************
Interface > Listeners > Axonometric
************************************************/
var axo_projection_mode;

/***************************+
Functions
****************************/
function axonometricDivListeners() {
    document.getElementById("A").addEventListener("input", function(event) {
        changeA(event.target.value);
    });
    
    document.getElementById("B").addEventListener("input", function(event) {
        changeB(event.target.value);
    });
    
    document.getElementById("theta").addEventListener("input", function(event) {
        changeTheta(event.target.value);
    });
    
    document.getElementById("gamma").addEventListener("input", function(event) {
        changeGamma(event.target.value);
    });
    
    document.getElementById("axonometric-form").addEventListener("change", function(event) {
        switch(event.target.value) {
            case "projection":
                document.getElementById("axo-projection-plane-angles").hidden = false;
                document.getElementById("axo-rotation-angles").hidden = true;
                break;
            case "rotation":
                document.getElementById("axo-projection-plane-angles").hidden = true;
                document.getElementById("axo-rotation-angles").hidden = false;
                break;
            default:
                alert("You should not be seeing this. You should reload the page.");
                break;
        }
        
        axo_projection_mode = event.target.value;
    });

    document.getElementById("isometric_btn").addEventListener("click", function() {
        changeA(30);
        changeB(30);
    });
    
    document.getElementById("dimetric_btn").addEventListener("click", function() {
        changeA(42);
        changeB(7);
    });
    
    //Convert the minutes to degrees
    var t_a = 23 + (16/60);
    var t_b = 12 + (28/60);
    document.getElementById("trimetric_btn").addEventListener("click", function() {        
        changeA(t_a);
        changeB(t_b);
    });
}

/*
* Converts projection plane angles to
* angles in model coordinates rotations
*/
//Returns [Theta, Gamma] and guarantees that
//Gamma will not be NaN (given that A and B aren't NaN)
function axonometric_ABtoTG_converter(A, B) {    
    var rA = radians(A);
    var rB = radians(B);
    
    var tg_A = Math.tan(rA);
    var tg_B = Math.tan(rB);    
    var rT = Math.atan(Math.sqrt(tg_A/tg_B)) - (Math.PI/2);
    
    //This guarantees that gamma will never be NaN
    var asin_arg = Math.sqrt(tg_A*tg_B);
    if(asin_arg < -1) {
        asin_arg = -1;
    } else if(asin_arg > 1) {
        asin_arg = 1;
    }
    
    var rG = Math.asin(asin_arg);
    
    var t = degrees(rT);
    var g = degrees(rG);
    
    return [t, g];
}

/*
* Converts model coordinates rotation
* angles to projection plane angles
*/
//Returns [A, B]
function axonometric_TGtoAB_converter(theta, gamma) {
    rT = radians(theta);
    rG = radians(gamma);
    
    tg_T_sq = Math.pow(Math.tan(rT + Math.PI/2), 2);
    sin_G_sq = Math.pow(Math.sin(rG), 2);

    var rA = Math.atan(Math.sqrt(tg_T_sq * sin_G_sq));
    var rB = Math.atan(Math.sqrt(sin_G_sq/tg_T_sq));
    
    var a = degrees(rA);
    var b = degrees(rB);
    
    return [a, b];
}

/************************************************
Interface > Projection parameters
************************************************/
//Oblique Projection
var alpha;
var beta;
var l;

//Perspective Projection
var d;

//Axonometric Projection
var A;
var B;
var theta;
var gamma;

/***************************+
Functions
****************************/
function changeAlpha(val) {
    alpha = val;
    document.getElementById("alpha").value = alpha;
    document.getElementById("alpha-display").innerHTML = alpha;
}

function changeBeta(val, called_recursively) {
    beta = val;
    document.getElementById("beta").value = beta;
    document.getElementById("beta-display").innerHTML = use_precision(beta, 2);
    
    if(called_recursively !== true) {
        changeL(1/Math.tan(radians(beta)), true);
    }
}

function changeL(val, called_recursively) {
    l = val;
    document.getElementById("l").value = l;
    document.getElementById("l-display").innerHTML = use_precision(l, 2);
    
    if(called_recursively !== true) {
        changeBeta(degrees(Math.atan(1/l)), true);
    }
}

function changeD(val) {
    d = val;
    document.getElementById("d").value = d;
    document.getElementById("d-display").innerHTML = d;
}

/************************************************
Interface > Projection parameters > Axonometric
************************************************/

/***************************+
Functions
****************************/
function changeA(val, called_recursively) {
    A = use_precision(val, 2);
    document.getElementById("A").value = A;
    document.getElementById("A-display").innerHTML = A;
    
    //To ensure A + B <= 90 deg
    var max_B = use_precision(90 - A, 2);
    document.getElementById("B").max = max_B;
    document.getElementById("B-max").innerHTML = max_B;
    
    blockChange();
    
    var res = axonometric_ABtoTG_converter(A, B);  //[theta, gamma]
    document.getElementById("projection_mode_current_theta").innerHTML = use_precision(res[0], 2);
    document.getElementById("projection_mode_current_gamma").innerHTML = use_precision(res[1], 2);
    
    if(called_recursively !== true) {        
        changeTheta(res[0], true);
        changeGamma(res[1], true);
        
        updateFactors();
    }
}

function changeB(val, called_recursively) {
    B = use_precision(val, 2);
    document.getElementById("B").value = B;
    document.getElementById("B-display").innerHTML = B;
    
    //To ensure A + B <= 90 deg
    var max_A = use_precision(90 - B, 2);
    document.getElementById("A").max = max_A;
    document.getElementById("A-max").innerHTML = max_A;
    
    blockChange();
    
    var res = axonometric_ABtoTG_converter(A, B);  //[theta, gamma]
    document.getElementById("projection_mode_current_theta").innerHTML = use_precision(res[0], 2);
    document.getElementById("projection_mode_current_gamma").innerHTML = use_precision(res[1], 2);
    
    if(called_recursively !== true) {
        changeTheta(res[0], true);
        changeGamma(res[1], true);
        
        updateFactors();
    }
}

function changeTheta(val, called_recursively) {
    theta = use_precision(val, 2);
    document.getElementById("theta").value = theta;
    document.getElementById("theta-display").innerHTML = use_precision(theta, 2);
    
    blockChange();
    
    var res = axonometric_TGtoAB_converter(theta, gamma);  //[A, B]
    document.getElementById("rotation_mode_current_A").innerHTML = use_precision(res[0], 2);
    document.getElementById("rotation_mode_current_B").innerHTML = use_precision(res[1], 2);

    if(called_recursively !== true) {
        changeA(res[0], true);
        changeB(res[1], true);
        
        updateFactors();
    }
}

function changeGamma(val, called_recursively) {
    gamma = use_precision(val, 2);
    document.getElementById("gamma").value = gamma;
    document.getElementById("gamma-display").innerHTML = gamma;
    
    blockChange();
    
    var res = axonometric_TGtoAB_converter(theta, gamma);  //[A, B]
    document.getElementById("rotation_mode_current_A").innerHTML = use_precision(res[0], 2);
    document.getElementById("rotation_mode_current_B").innerHTML = use_precision(res[1], 2);

    if(called_recursively !== true) {
        changeA(res[0], true);
        changeB(res[1], true);
        
        updateFactors();
    }
}

//Prevents the user from changing between
//the different angle interfaces (submitting
//angles in terms of A and B or Theta and Gamma)
//when the currently unused angles are taking
//invalid values
/****************************
/!\ DIRTY /!\:
  - axo_projection_mode
****************************/
function blockChange() {
    var block;
    
    if(axo_projection_mode == "projection") {
        block = isNaN(theta) || isNaN(gamma);
    } else if(axo_projection_mode = "rotation") {
        block = isNaN(A) || isNaN(B);
    } else {
        alert("You should not be seeing this. You should reload the page.");
        return;
    }
    
    var buttons = document.getElementById("axonometric-form").children;
    if(block) {        
        document.getElementById("axonometric-warning").style.visibility = "visible";
        
        for(var i = 0; i < buttons.length; ++i) {
            buttons[i].disabled = true;
        }
    } else {
        document.getElementById("axonometric-warning").style.visibility = "hidden";
        
        for(var i = 0; i < buttons.length; ++i) {
            buttons[i].disabled = false;
        }
    }
}

function updateFactors() {
    var g = radians(gamma);
    var t = radians(theta);
    var b = radians(B);
    var a = radians(A);
    
    var r1 = use_precision(Math.cos(g), 4);
    var r2 = use_precision(Math.cos(t)/Math.cos(b), 4);
    var r3 = use_precision(-Math.sin(t)/Math.cos(a), 4);

    document.getElementById("table-r1").innerHTML = r1;
    document.getElementById("table-r2").innerHTML = r2;
    document.getElementById("table-r3").innerHTML = r3;
    
    var projection_type = document.getElementById("table-projection");
    var projection = "";
    
    if(isNaN(r1) || isNaN(r2) || isNaN(r3)) {
        projection = "inexistente (factores NaN)";
    } else {
        if(factors_are_close(r1, r2, 2) && factors_are_close(r2, r3, 2)) {
            if(r1 == r2 && r2 == r3) {
                projection += "exactamente";
            } else {
                projection += "aproximadamente";
            }

            projection += " isom&eacute;trica";
        } else if(factors_are_close(r1, r2, 2) ||
                  factors_are_close(r2, r3, 2) ||
                  factors_are_close(r3, r1, 2)) {

            if(r1 == r2 || r2 == r3 || r3 == r1) {
                projection += "exactamente";
            } else {
                projection += "aproximadamente";
            }

            projection += " dim&eacute;trica";
        } else {
            projection = "exactamente trim&eacute;trica";
        }
    }
    
    projection_type.innerHTML = projection;
}

/*
* Determines whether two numbers (f1, f2) are at most
* separated by 10^(-p). Used to tell when two
* axonometric scale ratios are close enough to
* each other to be considered "equal".
*/
function factors_are_close(f1, f2, p) {
    var s = Math.pow(10, p);
    
    var lower_bound = f1 - (1/s);
    var upper_bound = f1 + (1/s);
    
    return (lower_bound <= f2) && (f2 <= upper_bound);
}

/****************************
Matrices
****************************/

/***************************+
Functions
****************************/
function frontView() {
    return mat4();
}

function plantView() {
    return rotateX(90);
}

function leftSideView() {
    return rotateY(90);
}

function axonometric(theta, gamma) {
    return mult(rotateX(gamma), rotateY(theta));
}

function oblique(alpha, l) {
	var result = mat4();
    
	result[0][2] = -l*Math.cos(radians(alpha));
	result[1][2] = -l*Math.sin(radians(alpha));
	
	return result;
}

function perspect(d) {
    var result = mat4();
    
    result[3][2] = -1/d;
    
    return result;
}

/************************************************
Auxiliary functions
************************************************/

/***************************+
Functions
****************************/
/*
 * Rounds a number (n) to (p) decimal places
 */
function use_precision(n, p) {
    return Math.round(n*Math.pow(10, p))/Math.pow(10, p);
}

function degrees(r) {
    return 180.0 * r/Math.PI;
}
