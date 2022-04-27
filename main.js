/*
 * File: main.js
 * Author: Nathan Hunter
 * Date: April 27, 2022
 *
 * Purpose: Sets up a template for a WebGL renderer with
 * shader, camera, and mesh basics.
 */

// Globals
const { mat4, mat3, vec2, vec3, vec4, quat } = glMatrix;
const M_RAD = (Math.PI / 180.0);
const viewWidth = 800, viewHeight = 800;
const repeat = (a, n) => Array(n).fill(a).flat(1);

let canvas = null;
let GL = null;

// Setup GUI
const controls = {
    animateOn    : true,
    animateSpeed: 1,

    cameraX: 0,
    cameraY: 0,
    cameraZoom: 1,
}

const gui = new dat.GUI();

const folderAnimate = gui.addFolder('Animation');
folderAnimate.add(controls, 'animateOn').name('On');
folderAnimate.add(controls, 'animateSpeed', 0.1, 4.0).name('Speed');
folderAnimate.open();

const folderCamera = gui.addFolder('Camera');
folderCamera.add(controls, 'cameraX', -viewWidth/2, viewWidth/2).name('X');
folderCamera.add(controls, 'cameraY', -viewHeight / 2, viewHeight / 2).name('Y');
folderCamera.add(controls, 'cameraZoom', 0.25, 4).name('Zoom');
folderCamera.open();

// Classes
class Renderer {
    
    constructor() {

        // Setup WebGL context
        canvas = document.createElement('canvas');
        document.body.appendChild(canvas);

        this.attributes = {};

        try {

            GL = canvas.getContext('webgl2');
            this.onWindowResize();

        } catch (e) {
            alert('WebGL not available');
        }

        // Shaders, camera, and meshes
        this.triBase  = new Tri(1, 1);
        this.quadBase = new Quad(1, 1);
        this.initShaders();
        this.initMeshList();
        this.camera = new OrthographicCamera(viewWidth, viewHeight);
        this.camera.update(this.attributes);

        window.addEventListener('resize', () => {
            this.onWindowResize();
            this.camera.onWindowResize(); // Different cameras handle resizing differently
        }, false);

    }

    onWindowResize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        GL.viewport(0, 0, canvas.width, canvas.height);
    }

    initShaders() {

        this.shaders = {
            default: new GLShader(GL, passthrough.vertex, passthrough.fragment),
        }

    }

    initMeshList() {

        // Creates three tris and three quads of red, green, and blue respectively

        var triMesh  = this.triBase;
        var quadMesh = this.quadBase;

        var redTri = new MeshInstance(triMesh, this.shaders.default);
        redTri.setColour(1, 0, 0, 0.8);
        redTri.setScale(50, 50, 50);
        redTri.tick = function (delta) {
            this.theta += delta;
            var rot = this.theta, dist = 120;
            this.setPosition(Math.cos(rot) * dist, Math.sin(rot) * dist, 0);
            this.rotateZ(delta);
        };

        var greenTri = new MeshInstance(triMesh, this.shaders.default);
        greenTri.setColour(0, 1, 0, 0.8);
        greenTri.setScale(50, 50, 50);
        greenTri.tick = function (delta) {
            this.theta += delta;
            var rot = this.theta + 2.094, dist = 120;
            this.setPosition(Math.cos(rot) * dist, Math.sin(rot) * dist, 0);
            this.rotateZ(-delta);
        };

        var blueTri = new MeshInstance(triMesh, this.shaders.default);
        blueTri.setColour(0, 0, 1, 0.8);
        blueTri.setScale(50, 50, 50);
        blueTri.tick = function (delta) {
            this.theta += delta;
            var rot = this.theta - 2.094, dist = 120;
            this.setPosition(Math.cos(rot) * dist, Math.sin(rot) * dist, 0);
            this.rotateZ(delta * 2);
        };

        var redQuad = new MeshInstance(quadMesh, this.shaders.default);
        redQuad.setColour(1, 0, 0, 0.4);
        redQuad.setScale(300, 100, 1);
        redQuad.setPosition(0, 100, 0);
        redQuad.tick = function (delta) {
            this.theta += delta;
            this.setScale(300 + 100 * Math.cos(this.theta), 100, 1);
        }

        var greenQuad = new MeshInstance(quadMesh, this.shaders.default);
        greenQuad.setColour(0, 1, 0, 0.4);
        greenQuad.setScale(300, 100, 1);
        greenQuad.tick = function (delta) {
            this.theta += delta;
            this.setScale(300 + 100 * Math.cos(this.theta - 2.094), 100, 1);
        }
        
        var blueQuad = new MeshInstance(quadMesh, this.shaders.default);
        blueQuad.setColour(0, 0, 1, 0.4);
        blueQuad.setScale(300, 100, 1);
        blueQuad.setPosition(0, -100, 0);
        blueQuad.tick = function (delta) {
            this.theta += delta;
            this.setScale(300 + 100 * Math.cos(this.theta + 2.094), 100, 1);
        }

        var background = new MeshInstance(quadMesh, this.shaders.default);
        background.setColour(0, 0, 0, 1);
        background.setScale(viewWidth, viewHeight, 1);

        this.meshList = [background, redTri, greenTri, blueTri, redQuad, greenQuad, blueQuad];

    }

    renderScene(delta) {

        delta *= controls.animateSpeed * controls.animateOn;

        // Clear and set scene
        GL.clearColor(0.2, 0.2, 0.2, 1.0);
        GL.cullFace(GL.BACK);
        GL.enable(GL.BLEND);
        GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        // Set camera from GUI controls
        this.camera.setPosition(controls.cameraX, controls.cameraY, 0);
        this.camera.zoom = controls.cameraZoom;
        this.camera.update(this.attributes);

        // Iterate over meshes and draw
        for (var i = 0, len = this.meshList.length; i < len; i++) {
            var m = this.meshList[i];
            m.tick(delta);
            m.bind(this.attributes);
            m.draw();
        }

    }
    
}

class Mesh {

    // Container for vertex buffers

    constructor() {
        this.buffers = {};
    }

    addBuffer(vertices, name, size) {

        var buff = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, buff);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
        buff.itemSize = size;
        buff.numItems = vertices.length / size;
        this.buffers[name] = buff;

    }

    draw() {
        GL.drawArrays(GL.TRIANGLES, 0, this.buffers.position.numItems);
    }

}

class Tri extends Mesh {

    // Simple triangle mesh

    constructor(height, width) {

        super();

        height *= 0.5;
        width  *= 0.5;

        var positions = [
            0.0, height, 0.0,
            width, -height, 0.0,
            -width, -width, 0.0
        ];

        var normals = repeat([0, 0, 1], 3);
        var colours = repeat([1, 1, 1, 1], 3);

        this.addBuffer(positions, 'position', 3);
        this.addBuffer(normals, 'normal', 3);
        this.addBuffer(colours, 'colour', 4);

    }

}

class Quad extends Mesh {

    // Simple rectangle mesh

    constructor(width, height) {

        super();

        width  *= 0.5;
        height *= 0.5;

        var positions = [
            -width, height, 0.0,
            width, -height, 0.0,
            -width, -height, 0.0,
            -width, height, 0.0,
            width, height, 0.0,
            width, -height, 0.0
        ];

        var normals = repeat([0, 0, 1], 6);
        var colours = repeat([1, 1, 1, 1], 6);

        this.addBuffer(positions, 'position', 3);
        this.addBuffer(normals, 'normal', 3);
        this.addBuffer(colours, 'colour', 4);

    }

}

class MeshInstance {

    // Enables one mesh component to take on various transforms, shader, and color

    constructor(mesh, shader) {

        this.shader   = shader;
        this.position = vec3.create();
        this.scale    = vec3.fromValues(1, 1, 1);
        this.rotation = quat.create();
        this.mesh     = mesh;
        this.theta    = 0;
        this.colour   = [1, 1, 1, 1];
    }

    tick(delta) {
        // Optional animation definition
    }

    setColour(red, green, blue, alpha) {
        this.colour = [red, green, blue, alpha];
    }

    setPosition(x, y, z) {
        vec3.set(this.position, x, y, z);
    }

    translate(x, y, z) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;
    }

    translateX(x) {
        this.position[0] += x;
    }

    translateY(y) {
        this.position[1] += y;
    }

    translateX(z) {
        this.position[2] += z;
    }

    rotateX(rad) {
        quat.rotateX(this.rotation, this.rotation, rad);
    }

    rotateY(rad) {
        quat.rotateY(this.rotation, this.rotation, rad);
    }

    rotateZ(rad) {
        quat.rotateZ(this.rotation, this.rotation, rad);
    }

    setScale(x, y, z) {
        vec3.set(this.scale, x, y, z);
    }

    bind(attributes) {

        // Calculate model view matrix
        const modelMatrix = mat4.create();
        mat4.fromRotationTranslationScale(modelMatrix, this.rotation, this.position, this.scale);
        const viewMatrix = attributes.viewMatrix;
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

        // Set shader and uniforms
        this.shader.bind(this.mesh.buffers);
        this.shader.setMatrices(attributes.projectionMatrix, modelViewMatrix);
        this.shader.setUniformFloat4(this.colour, 'colour');

    }

    draw() {
        this.mesh.draw();
    }

}

class Camera {

    // Abstract camera object

    constructor() {

        this.position         = vec3.create();
        this.lookAt           = vec3.create();
        this.viewMatrix       = mat4.create();
        this.cameraMatrix     = mat4.create();
        this.projectionMatrix = mat4.create();

    }

    setPosition(x, y, z) {
        vec3.set(this.position, x, y, z);
    }

    setLookAt(x, y, z) {
        vec3.set(this.lookAt, x, y, z);
    }

    update(attributes) {

        mat4.lookAt(this.viewMatrix, this.position, this.lookAt, vec3.fromValues(0, 1, 0));
        mat4.invert(this.cameraMatrix, this.viewMatrix);

        attributes['projectionMatrix'] = this.projectionMatrix;
        attributes['viewMatrix']       = this.viewMatrix;
        attributes['cameraMatrix']     = this.cameraMatrix;
        attributes['cameraPosition']   = this.position;

    }

}

class OrthographicCamera extends Camera {

    // Ortho camera that scales to window resizing and can zoom/move 

    constructor(width, height) {

        super();
        this.zoom = 1;
        this.position[2] = 1;
        this.setOrthographic(width, height);

    }

    setOrthographic(width, height) {

        this.width  = width;
        this.height = height;

        var winW = window.innerWidth, winH = window.innerHeight, aspect = 1;

        if (winW > winH) {
            aspect = winH / winW;
            height = width * aspect;
        } else {
            aspect = winW / winH;
            width  = height * aspect;
        }

        width  *= 0.5;
        height *= 0.5;

        this.left   = -width;
        this.right  =  width;
        this.bottom = -height;
        this.top    =  height;

    }

    setPosition(x, y, z) {
        vec3.set(this.position, x, y, 1);
        this.setLookAt(x, y, z);
    }

    onWindowResize() {
        this.setOrthographic(this.width, this.height);
    }

    update(attributes) {
        var pos = this.position, zm = this.zoom;
        mat4.ortho(this.projectionMatrix,
            pos[0] + this.left   * zm,
            pos[0] + this.right  * zm,
            pos[1] + this.bottom * zm,
            pos[1] + this.top    * zm,
            0.1, 1000
        );
        super.update(attributes);

    }

}

class PerspectiveCamera extends Camera {

    // Simple camera that uses a perspective projection

    constructor(fov, zNear, zFar) {

        super();
        this.aspect = window.innerWidth / window.innerHeight;
        this.setPerspective(fov, zNear, zFar)

    }

    setPerspective(fov, zNear, zFar) {

        this.fov   = fov;
        this.zNear = zNear;
        this.zFar  = zFar;
        mat4.perspective(this.projectionMatrix, fov * M_RAD, this.aspect, zNear, zFar);

    }

    onWindowResize() {
        this.aspect = window.innerWidth / window.innerHeight;
        mat4.perspective(this.projectionMatrix, this.fov * M_RAD, this.aspect, this.zNear, this.zFar);
    }

    getUpVector() {

        const up = vec4.fromValues(0, 0, 1, 0);
        vec4.transformMat4(up, up, this.cameraMatrix);
        return up;
    }

    getRightVector() {

        const right = vec4.fromValues(1, 0, 0, 0);
        vec4.transformMat4(right, right, this.cameraMatrix);
        return right;

    }

}

class Animator {

    // Creates the render instance and set up animation frame calls to window

    constructor() {

        this.renderer = new Renderer();
        this.deltaPrev = 0;
        this.animate(0);

    }

    animate(timeStamp) {

        const delta = (timeStamp - this.deltaPrev) * 0.001;
        this.renderer.renderScene(delta);
        this.deltaPrev = timeStamp;
        requestAnimationFrame(this.animate.bind(this));

    }

}

let run = null;
window.addEventListener('DOMContentLoaded', () => {
    run = new Animator();
});