uniform float uTime;
attribute float aTimeOffset;
varying vec2 vUv;
varying float vTimeOffset;

void main() {
    vUv = uv;
    vTimeOffset = aTimeOffset;
    vec3 p = position;
    float localTime = uTime + vTimeOffset;
    p.z += sin(p.x * 1.0 + localTime * 3.0) * 0.2;
    p.y += sin(p.x * 1.0 + localTime * 6.0) * 0.02;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
