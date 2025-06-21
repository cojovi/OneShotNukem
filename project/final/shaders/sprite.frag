precision mediump float;

uniform sampler2D u_texture;
uniform float u_alpha;

varying vec2 v_texCoord;

void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    
    // Discard transparent pixels for retro pixelated look
    if (texColor.a < 0.1) {
        discard;
    }
    
    // Apply 256-color palette quantization for retro aesthetic
    vec3 quantizedColor = floor(texColor.rgb * 32.0) / 32.0;
    
    gl_FragColor = vec4(quantizedColor, texColor.a * u_alpha);
}