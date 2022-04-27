/*
 * File: GLShader.js
 * Author: Nathan Hunter
 * Date: April 27, 2022
 *
 * Purpose:
 */

let GL = null;

class GLShader {

    constructor(glContext, vertSource, fragSource) {

        GL = glContext;
        this.init(vertSource, fragSource);

    }

    init(vertSource, fragSource) {

        // Compile the shaders and create program

        const vertShader = this.load(vertSource, GL.VERTEX_SHADER);
        const fragShader = this.load(fragSource, GL.FRAGMENT_SHADER);

        this.program = GL.createProgram();
        GL.attachShader(this.program, vertShader);
        GL.attachShader(this.program, fragShader);
        GL.linkProgram(this.program);

        if (!GL.getProgramParameter(this.program, GL.LINK_STATUS)) {
            console.log("Failed to compile shader");
        }

        // Gets locations and uniforms, those not existing return -1

        this.locations = {

            position:  GL.getAttribLocation(this.program, 'aPosition'),
            normal:    GL.getAttribLocation(this.program, 'aNormal'),
            tangent:   GL.getAttribLocation(this.program, 'aTangent'),
            uv:        GL.getAttribLocation(this.program, 'aUV'),
            colour:    GL.getAttribLocation(this.program, 'aColour'),

        }

        this.uniforms = {

            projectionMatrix: GL.getUniformLocation(this.program, 'projection'),
            modelViewMatrix:  GL.getUniformLocation(this.program, 'modelView'),
            colour:           GL.getUniformLocation(this.program, 'colour'),
        }

    }

    load(source, type) {

        // Compiles the shader source code
        const shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);

        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            console.log(GL.getShaderInfoLog(shader));
            GL.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setMatrices(projection, modelView) {
        GL.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projection);
        GL.uniformMatrix4fv(this.uniforms.modelViewMatrix, false, modelView);
    }

    setUniformFloat4(value, name) {
        GL.uniform4fv(this.uniforms[name], value);
    }

    bind(buffers) {

        // Bind buffers and set uniforms before the owning instance draws

        for (const b in buffers) {

            var loc = this.locations[b];
            if (loc == -1) continue;

            var buff = buffers[b];
            GL.bindBuffer(GL.ARRAY_BUFFER, buff);
            GL.vertexAttribPointer(loc, buff.itemSize, GL.FLOAT, false, 0, 0);
            GL.enableVertexAttribArray(loc);

        }

        GL.useProgram(this.program);

    }

}