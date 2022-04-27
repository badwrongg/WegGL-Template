/*
 * File: passthrough.js
 * Author: Nathan Hunter
 * Date: April 27, 2022
 *
 * Purpose:
 */

passthrough = {

    vertex: `#version 300 es
    precision highp float;

    uniform mat4 projection;
    uniform mat4 modelView;

    layout(location = 0) in vec3 aPosition;
    layout(location = 1) in vec3 aNormal;
    layout(location = 2) in vec4 aTangent;
    layout(location = 3) in vec4 aUV;
    layout(location = 4) in vec4 aColour;

    out vec4 vColour; 

    void main(void) {
        vColour = aColour;
        gl_Position = projection * modelView * vec4(aPosition, 1.0);
    }
    `,

    fragment: `#version 300 es
    precision highp float;

    uniform vec4 colour;

    in vec4 vColour;

    layout(location = 0) out vec4 out_FragColour;

    void main(void) {
        out_FragColour = vColour * colour;
    }
    `
}