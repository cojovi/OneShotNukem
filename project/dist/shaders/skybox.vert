// OneShot Predator Nukem - Skybox Vertex Shader
// Renders skybox geometry with vertex colors

attribute vec3 a_position;
attribute vec4 a_color;

uniform mat4 u_mvpMatrix;

varying vec4 v_color;

void main() {
    // Transform vertex position
    gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
    
    // Pass color to fragment shader
    v_color = a_color;
}