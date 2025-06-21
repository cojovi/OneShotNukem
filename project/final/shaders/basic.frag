precision mediump float;

uniform sampler2D u_texture;
uniform vec3 u_lightDir;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;

varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_worldPos;

void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    
    // Simple directional lighting for retro aesthetic
    float lightIntensity = max(dot(normalize(v_normal), normalize(-u_lightDir)), 0.0);
    vec3 lighting = u_ambientColor + u_lightColor * lightIntensity;
    
    // Apply 256-color palette effect by quantizing colors
    vec3 finalColor = texColor.rgb * lighting;
    finalColor = floor(finalColor * 32.0) / 32.0; // Quantize to retro palette
    
    gl_FragColor = vec4(finalColor, texColor.a);
}