var gl;

var canvas;

// GLSL programs
var program;

// Render Mode
var WIREFRAME=1;
var FILLED=2;
var renderMode = WIREFRAME;

var projection;
var modelView;
var view;

matrixStack = [];

function pushMatrix()
{
    matrixStack.push(mat4(modelView[0], modelView[1], modelView[2], modelView[3]));
}

function popMatrix() 
{
    modelView = matrixStack.pop();
}

function multTranslation(t) {
    modelView = mult(modelView, translate(t));
}

function multRotX(angle) {
    modelView = mult(modelView, rotateX(angle));
}

function multRotY(angle) {
    modelView = mult(modelView, rotateY(angle));
}

function multRotZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
}

function multMatrix(m) {
    modelView = mult(modelView, m);
}

function multScale(s) {
    modelView = mult(modelView, scalem(s));
}

function initialize() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    
    program = initShaders(gl, "vertex-shader-2", "fragment-shader-2");
    
    cubeInit(gl);
    sphereInit(gl);
    cylinderInit(gl);
    
    setupProjection();
    setupView();
    setupListeners();
    setupDefaults();
}

function setupProjection() {
    projection = mult(ortho(-1, 1,-1, 1, -1, 1), mult(rotateX(gamma), rotateY(theta)));
}

function setupView() {
	view = lookAt([0,0,0], [0,0,0], [0,1,0]);
    modelView = mat4(view[0], view[1], view[2], view[3]);
}

function setMaterialColor(color) {
    var uColor = gl.getUniformLocation(program, "color");
    gl.uniform3fv(uColor, color);
}

function sendMatrices()
{
    // Send the current model view matrix
    var mView = gl.getUniformLocation(program, "mView");
    gl.uniformMatrix4fv(mView, false, flatten(view));
    
    // Send the normals transformation matrix
    var mViewVectors = gl.getUniformLocation(program, "mViewVectors");
    gl.uniformMatrix4fv(mViewVectors, false, flatten(normalMatrix(view, false)));  

    // Send the current model view matrix
    var mModelView = gl.getUniformLocation(program, "mModelView");
    gl.uniformMatrix4fv(mModelView, false, flatten(modelView));
    
    // Send the normals transformation matrix
    var mNormals = gl.getUniformLocation(program, "mNormals");
    gl.uniformMatrix4fv(mNormals, false, flatten(normalMatrix(modelView, false)));  
}

function draw_sphere(color)
{
    setMaterialColor(color);
    sendMatrices();
    sphereDrawFilled(gl, program);
}

function draw_cube(color)
{
    setMaterialColor(color);
    sendMatrices();
    cubeDrawFilled(gl, program);
}

function draw_cylinder(color)
{
    setMaterialColor(color);
    sendMatrices();
    cylinderDrawFilled(gl, program);
}

function setupDefaults() {
    document.getElementById("theta").value = theta;
    document.getElementById("gamma").value = gamma;
    
    document.getElementById("theta-display").value = theta;
    document.getElementById("gamma-display").value = gamma;
}

//basta um ângulo (desde que funcione para o lado esquerdo do mundo, funciona para o direito por simetria)
//os thresholds definem ângulos a partir dos quais restringimos o movimento do outro braço
//(e os ângulos até que os braços podem ir ao ser restringidos)
var upper_arm_max_angle = 90;
var upper_arm_threshold = 45;
var lower_arm_max_angle = 85;
var lower_arm_threshold = 55;

function setupListeners() {
    document.getElementById("theta").addEventListener("input", function(event) {
        changeTheta(event.target.value);
    });
    
    document.getElementById("gamma").addEventListener("input", function(event) {
        changeGamma(event.target.value);
    });
    
    window.addEventListener("keydown", function(event) {
        if(event.keyCode <= 40) {
            switch(event.keyCode) {
                case 37:    //left arrow key - move car left
					if(!(car_h - 0.01 < -plane_side/2 + car_width/2)) {
						car_h -= 0.01;
					}
                    break;
                case 38:    //up arrow key - move car away
                    if(!(car_d - 0.01 < -plane_side/2 + car_length/2)) {
						car_d -= 0.01;
					}
                    break;
                case 39:    //right arrow key - move car right
                    if(!(car_h + 0.01 > plane_side/2 - car_width/2)) {
						car_h += 0.01;
					}
                    break;
                case 40:    //down arrow key - move car closer
                    if(!(car_d + 0.01 > plane_side/2 - car_length/2)) {
						car_d += 0.01;
					}
                    break;
            }
        } else {
            var key = String.fromCharCode(event.keyCode);

            switch(key) {
                case 'Q':   //rotate base counter-clockwise
                    base_r += 0.5;
                    break;
                case 'W':   //rotate base clockwise
                    base_r -= 0.5;
                    break;
                case 'Z':   //rotate upper arm counter-clockwise
                    if(d_arm_r <= lower_arm_threshold) { //braço de baixo já atingiu o threshold?
                        if(u_arm_r < upper_arm_max_angle) {    //não -> rodar o braço de cima até ao seu máximo
                            u_arm_r += 0.5;
                        }
                    } else {
                        if(u_arm_r < upper_arm_threshold) { //sim -> restringir o movimento do braço de cima
                            u_arm_r += 0.5;
                        }
                    }
                    break;
                case 'X':   //rotate upper arm clockwise
                    if(d_arm_r >= -lower_arm_threshold) {
                        if(u_arm_r > -upper_arm_max_angle) {
                            u_arm_r -= 0.5;
                        }
                    } else {
                        if(u_arm_r > -upper_arm_threshold) {
                            u_arm_r -= 0.5;
                        }
                    }
					break;
                case 'A':   //rotate lower arm counter-clockwise
                    if(u_arm_r <= upper_arm_threshold) {
                        if(d_arm_r < lower_arm_max_angle) {
                            d_arm_r += 0.5;
                        }
                    } else {
                        if(d_arm_r < lower_arm_threshold) {
                            d_arm_r += 0.5;
                        }
                    }
                    break;
                case 'S':   //rotate lower arm clockwise
                    if(u_arm_r >= -upper_arm_threshold) {
                        if(d_arm_r > -lower_arm_max_angle) {
                            d_arm_r -= 0.5;
                        }
                    } else {
                        if(d_arm_r > -lower_arm_threshold) {
                            d_arm_r -= 0.5;
                        }
                    }
                    break;
                case 'O':   //close claw
					if(!(finger_t - 0.001 < 0)) {
						finger_t -= 0.001;
					}
                    break;
                case 'P':   //open claw
					if(!(finger_t + 0.001 > wrist_radius - finger_side)) {
						finger_t += 0.001;
					}
                    break;
                case 'K':   //rotate fist counter-clockwise
                    wrist_r += 0.5;
                    break;
                case 'L':   //rotate fist clockwise
                    wrist_r -= 0.5;
                    break;
            }
        }
    });
}

function use_precision(n, p) {
    return Math.round(n*Math.pow(10, p))/Math.pow(10, p);
}

//uma dimetria
var theta = -20.27;
var gamma = 19.42;

function changeTheta(val) {
    theta = use_precision(val, 2);
    document.getElementById("theta").value = theta;
    document.getElementById("theta-display").innerHTML = use_precision(theta, 2);
}

function changeGamma(val) {
    gamma = use_precision(val, 2);
    document.getElementById("gamma").value = gamma;
    document.getElementById("gamma-display").innerHTML = gamma;
}

//width - x axis
//height - y axis
//length - z axis
function draw_cuboid_size(color, width, height, length) {
    multScale([width, height, length]);
    draw_cube(color);
}

function draw_cylinder_size(color, radius, height) {
    multScale([2*radius, height, 2*radius]);
    draw_cylinder(color);
}

var car_h = 0;
var car_d = 0;
var base_r = 0;
var d_arm_r = 0;
var u_arm_r = 0;
var wrist_r = 0;
var finger_t = 0;

var plane_height = 0.05;
var plane_side = 1;
var car_height = 0.075;
var car_width = 0.35;
var car_length = 0.2;
var base_cylinder_height = 0.03;
var base_cylinder_radius = Math.min(car_width, car_length)/3;   //só porque fica giro e consistente de mudarmos o carro
var base_stick_height = 0.1;
var base_stick_side = base_cylinder_radius/2;
var lower_joint_radius = 0.025;
var lower_joint_height = base_stick_side * 1.01;
var lower_arm_height = 0.20;
var lower_arm_side = base_stick_side;
var upper_joint_radius = lower_joint_radius;
var upper_joint_height = lower_joint_height;
var upper_arm_height = 0.15;
var upper_arm_side = base_stick_side;
var wrist_height = 0.020;
var wrist_radius = base_cylinder_radius*1.25;
var finger_height = 0.075;
var finger_side = 0.015;

function draw_scene() {
    pushMatrix();
        draw_cuboid_size([0.5, 0.5, 0.5], plane_side, plane_height, plane_side);   //mesa
    popMatrix();
    //pushMatrix();
        multTranslation([car_h, plane_height/2 + car_height/2, car_d]);
        
        pushMatrix();
            draw_cuboid_size([0.8, 0, 0], car_width, car_height, car_length);   //carro
        popMatrix();
        //pushMatrix();
            multTranslation([0, car_height/2 + base_cylinder_height/2, 0]);
            multRotY(base_r);
    
            pushMatrix();
                draw_cylinder_size([0, 0, 0.9], base_cylinder_radius, base_cylinder_height);    //cilindro da base
            popMatrix();
            //pushMatrix();
                multTranslation([0, base_cylinder_height/2 + base_stick_height/2, 0]);
    
                pushMatrix();
                    draw_cuboid_size([0, 0.9, 0], base_stick_side, base_stick_height, base_stick_side); //cubóide da base
                popMatrix();
                //pushMatrix();
                    multTranslation([0, base_stick_height/2, 0]);

                    pushMatrix();
                        multRotX(90);
                        draw_cylinder_size([0, 0, 1], lower_joint_radius, lower_joint_height); //articulação inferior
                    popMatrix();
                    //pushMatrix();
                        multRotZ(d_arm_r);
                        multTranslation([0, lower_arm_height/2, 0]);

                        pushMatrix();
                            draw_cuboid_size([0.8, 0, 0.8], lower_arm_side, lower_arm_height, lower_arm_side);  //braço inferior
                        popMatrix();
                        
                        //pushMatrix();
                        multTranslation([0, lower_arm_height/2, 0]);
                        
                            pushMatrix();
                                multRotX(90);
                                draw_cylinder_size([0, 1, 0], upper_joint_radius, upper_joint_height);    //articulação superior
                            popMatrix();
                            //pushMatrix();
                                multRotZ(u_arm_r);
                                multTranslation([0, upper_arm_height/2, 0]);

                                pushMatrix();
                                    draw_cuboid_size([1, 1, 0], upper_arm_side, upper_arm_height, upper_arm_side);  //braço superior
                                popMatrix();
                                //pushMatrix();
                                    multTranslation([0, wrist_height/2 + upper_arm_height/2, 0], 0);
                                    multRotY(wrist_r);

                                    pushMatrix();
                                        draw_cylinder_size([0, 1, 1], wrist_radius, wrist_height);    //pulso
                                    popMatrix();
                                    pushMatrix();
                                        multTranslation([-finger_t - finger_side/2, wrist_height/2 + finger_height/2, 0]);

                                        //pushMatrix();
                                            draw_cuboid_size([1, 0.5, 0.3], finger_side, finger_height, finger_side);   //um dedo
                                        //popMatrix();
                                    popMatrix();
                                    //pushMatrix();
                                        multTranslation([finger_t + finger_side/2, wrist_height/2 + finger_height/2, 0]);

                                        //pushMatrix();
                                            draw_cuboid_size([0.3, 0, 1], finger_side, finger_height, finger_side); //outro dedo
                                        //popMatrix();
                                    //popMatrix();
                                //popMatrix();
                            //popMatrix();
                        //popMatrix();
                    //popMatrix();
                //popMatrix();
            //popMatrix();
        //popMatrix();
    //popMatrix();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    
    setupView();
    setupProjection();
    
    // Send the current projection matrix
    var mProjection = gl.getUniformLocation(program, "mProjection");
    gl.uniformMatrix4fv(mProjection, false, flatten(projection));
        
    draw_scene();
    
    requestAnimFrame(render);
}


window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    initialize();
            
    render();
}
