pyramid_vertices = [
    vec3(0.0, +0.5, 0.0),
    vec3(-0.5, -0.5, +0.5),
    vec3(+0.5, -0.5, +0.5),
    vec3(-0.5, -0.5, -0.5),
    vec3(+0.5, -0.5, -0.5)
];

var pyramid_points = [];
var pyramid_normals = [];
var pyramid_faces = [];
var pyramid_edges = [];

var pyramid_points_buffer;
var pyramid_normals_buffer;
var pyramid_faces_buffer;
var pyramid_edges_buffer;

function pyramidInit(gl) {
    pyramidBuild();
    pyramidUploadData(gl);
}

function calculateNormalToTriangle(a, b, c) {
    var v1 = pyramid_vertices[a];
    var v2 = pyramid_vertices[b];
    var v3 = pyramid_vertices[c];
    
    var u = subtract(v2, v1);
    var v = subtract(v3, v1);
    
    return cross(u, v);
}

function pyramidBuild()
{
    var N1, N2, N3, N4, N5;
    
    N1 = normalize(calculateNormalToTriangle(1, 3, 4));
    N2 = normalize(calculateNormalToTriangle(0, 1, 2));
    N3 = normalize(calculateNormalToTriangle(0, 2, 4));
    N4 = normalize(calculateNormalToTriangle(0, 4, 3));
    N5 = normalize(calculateNormalToTriangle(0, 3, 1));    
    
    pyramidAddSquareFace(1, 3, 4, 2, N1);
    pyramidAddTriangleFace(0, 1, 2, N2);
    pyramidAddTriangleFace(0, 2, 4, N3)
    pyramidAddTriangleFace(0, 4, 3, N4);
    pyramidAddTriangleFace(0, 3, 1, N5);
}

function pyramidUploadData(gl) {
    pyramid_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pyramid_points), gl.STATIC_DRAW);
    
    pyramid_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pyramid_normals), gl.STATIC_DRAW);
    
    pyramid_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramid_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(pyramid_faces), gl.STATIC_DRAW);
    
    pyramid_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramid_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(pyramid_edges), gl.STATIC_DRAW);
}

function pyramidDrawWireFrame(gl, program) {    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramid_edges_buffer);
    gl.drawElements(gl.LINES, pyramid_edges.length, gl.UNSIGNED_BYTE, 0);
}

function pyramidDrawFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramid_faces_buffer);
    gl.drawElements(gl.TRIANGLES, pyramid_faces.length, gl.UNSIGNED_BYTE, 0);
}

function pyramidAddSquareFace(a, b, c, d, n) {
    var offset = pyramid_points.length;
    
    pyramid_points.push(pyramid_vertices[a]);
    pyramid_points.push(pyramid_vertices[b]);
    pyramid_points.push(pyramid_vertices[c]);
    pyramid_points.push(pyramid_vertices[d]);
    for(var i=0; i<4; i++) {
        pyramid_normals.push(n);
    }
        
    // Add 2 triangular faces (a,b,c) and (a,c,d)
    pyramid_faces.push(offset);
    pyramid_faces.push(offset+1);
    pyramid_faces.push(offset+2);
    
    pyramid_faces.push(offset);
    pyramid_faces.push(offset+2);
    pyramid_faces.push(offset+3);
        
}

function pyramidAddTriangleFace(a, b, c, n) {
    var offset = pyramid_points.length;
    
    pyramid_points.push(pyramid_vertices[a]);
    pyramid_points.push(pyramid_vertices[b]);
    pyramid_points.push(pyramid_vertices[c]);
    for(var i=0; i<3; i++) {
        pyramid_normals.push(n);
    }
    
    // Add the face
    pyramid_faces.push(offset);
    pyramid_faces.push(offset+1);
    pyramid_faces.push(offset+2);
    
    // Add first edge (a,b)
    pyramid_edges.push(offset);
    pyramid_edges.push(offset+1);
    
    // Add second edge (b,c)
    pyramid_edges.push(offset+1);
    pyramid_edges.push(offset+2);
}
