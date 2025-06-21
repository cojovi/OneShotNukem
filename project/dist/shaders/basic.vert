attribute vec3 a_position;
attribute vec2 a_texCoord;
attribute vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_worldPos;

void main() {
    vec4 worldPos = u_modelMatrix * vec4(a_position, 1.0);
    v_worldPos = worldPos.xyz;
    v_texCoord = a_texCoord;
    v_normal = normalize((u_modelMatrix * vec4(a_normal, 0.0)).xyz);
    
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
}