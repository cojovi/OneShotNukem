// OneShot Predator Nukem - Skybox Fragment Shader
// Renders skybox with vertex colors and retro aesthetic

precision mediump float;

varying vec4 v_color;

void main() {
    // Use vertex color directly for retro look
    gl_FragColor = v_color;
    
    // Ensure alpha is properly handled
    if (gl_FragColor.a < 0.01) {
        discard;
    }
}