attribute vec3 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform vec3 u_spritePos;
uniform vec2 u_spriteSize;
uniform vec3 u_cameraRight;
uniform vec3 u_cameraUp;

varying vec2 v_texCoord;

void main() {
    // Billboard calculation - sprite always faces camera
    vec3 worldPos = u_spritePos + 
                   u_cameraRight * a_position.x * u_spriteSize.x +
                   u_cameraUp * a_position.y * u_spriteSize.y;
    
    v_texCoord = a_texCoord;
    gl_Position = u_projectionMatrix * u_viewMatrix * vec4(worldPos, 1.0);
}