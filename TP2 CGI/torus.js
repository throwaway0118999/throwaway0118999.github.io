var torus_points = [];
var torus_normals = [];
var torus_faces = [];
var torus_edges = [];

var torus_points_buffer;
var torus_normals_buffer;
var torus_faces_buffer;
var torus_edges_buffer;

var SMALL_CIRCLES = 60;
var BIG_RADIUS = 0.5;

var POINTS_PER_SMALL_CIRCLE = 30;
var SMALL_RADIUS = 0.25;

function torusInit(gl) {
    torusBuild(SMALL_CIRCLES, BIG_RADIUS, POINTS_PER_SMALL_CIRCLE, SMALL_RADIUS);
    torusUploadData(gl);
}

/*
* phi - angle of the big circle
* theta - angle of the small circle
* both in radians
*/
function torusNormal(phi, theta) {
    var tg_1_x = -Math.sin(phi);
    var tg_1_y = Math.cos(phi);
    var tg_1_z = 0;
        
    var tg_2_x = -Math.sin(theta) * Math.cos(phi);
    var tg_2_y = -Math.sin(theta) * Math.sin(phi);
    var tg_2_z = Math.cos(theta);
        
    var tg1 = vec3(tg_1_x, tg_1_y, tg_1_z);
    var tg2 = vec3(tg_2_x, tg_2_y, tg_2_z);
    
    return cross(tg1, tg2);
}

/*
* phi - angle of the big circle
* theta - angle of the small circle
* both in radians
*/
function torusPoint(big_radius, phi, small_radius, theta) {
    var x = (big_radius + small_radius * Math.cos(theta)) * Math.cos(phi);
    var y = (big_radius + small_radius * Math.cos(theta)) * Math.sin(phi);
    var z = small_radius * Math.sin(theta);
    
    return vec3(x, y, z);
}

function torusBuild(small_circles_amount, torus_radius, points_per_circle, tube_radius) {    
    for(var i = 0; i < small_circles_amount; ++i) {
        for(var j = 0; j < points_per_circle; ++j) {
            var phi = i * 2 * Math.PI/small_circles_amount;
            var theta = j * 2 * Math.PI/points_per_circle;
            
            torus_points.push(torusPoint(torus_radius, phi, tube_radius, theta));
            torus_normals.push(normalize(torusNormal(phi, theta)));
        }
    }
    
    // Generate the faces
    for(var i = 0; i < small_circles_amount; ++i) {    //i -> small circle at
        for(var j = 0; j < points_per_circle; ++j) {  //j -> small circle's point at
            var TL_corner = j + i*points_per_circle;
            var BL_corner = ((j+1)%points_per_circle) + i*points_per_circle;
            var TR_corner = j + ((i+1)%small_circles_amount)*points_per_circle;  //to handle the case where we're at the last circle
                                                                                //and want to loop around
            var BR_corner = ((j+1)%points_per_circle) + ((i+1)%small_circles_amount)*points_per_circle;
            
            //first triangle
            torus_faces.push(TL_corner);
            torus_faces.push(TR_corner);
            torus_faces.push(BR_corner);
        
            //second triangle
            torus_faces.push(TL_corner);
            torus_faces.push(BR_corner);
            torus_faces.push(BL_corner);
            
            //vertical edge
            torus_edges.push(TL_corner);
            torus_edges.push(BL_corner);
            
            //horizontal edge
            torus_edges.push(TL_corner);
            torus_edges.push(TR_corner);
        }
    }
}

function torusUploadData(gl)
{
    torus_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, torus_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(torus_points), gl.STATIC_DRAW);
    
    torus_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, torus_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(torus_normals), gl.STATIC_DRAW);
    
    torus_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, torus_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(torus_faces), gl.STATIC_DRAW);
    
    torus_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, torus_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(torus_edges), gl.STATIC_DRAW);
}

function torusDrawWireFrame(gl, program) {    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, torus_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, torus_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, torus_edges_buffer);
    gl.drawElements(gl.LINES, torus_edges.length, gl.UNSIGNED_SHORT, 0);
}

function torusDrawFilled(gl, program) {
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, torus_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, torus_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, torus_faces_buffer);
    gl.drawElements(gl.TRIANGLES, torus_faces.length, gl.UNSIGNED_SHORT, 0);
}
