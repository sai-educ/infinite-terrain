uniform float uTime;
uniform float uTimeMultiplier;
uniform float uAlphaMultiplier;
uniform float uUVmin;
uniform float uUVmax;

varying vec2 vUv;
varying float vTimeOffset;

void main() {
    float t = fract((uTime + vTimeOffset) * uTimeMultiplier);
    float center = mix(uUVmin, uUVmax, t);
    float d = abs(vUv.x - center);
    float alpha = 1.0 - smoothstep(0.1, 0.35, d);
    float edge = min(vUv.x, 1.0 - vUv.x);
    float edgeFade = smoothstep(0.0, 0.1, edge);
    alpha *= edgeFade;
    // gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * uAlphaMultiplier);
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
