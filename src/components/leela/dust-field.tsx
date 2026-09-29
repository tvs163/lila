import { useEffect, useRef } from "react";
import * as THREE from "three";

const NEBULA_VERT = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const NEBULA_FRAG = `
precision mediump float;
in vec2 vUv;
out vec4 fragColor;
uniform float u_time;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 p = vUv * 2.2;
  float t = u_time * 0.045;
  float n = fbm(p + vec2(t, -t * 0.6));
  float m = fbm(p * 1.4 - vec2(-t * 0.4, t));
  vec3 indigo = vec3(0.04, 0.03, 0.09);
  vec3 violet = vec3(0.23, 0.10, 0.36);
  vec3 gold = vec3(0.62, 0.46, 0.22);
  vec3 col = mix(indigo, violet, smoothstep(0.25, 0.85, n));
  col = mix(col, gold, smoothstep(0.62, 0.92, m) * 0.55);
  float alpha = smoothstep(0.18, 0.75, n) * 0.72;
  fragColor = vec4(col, alpha);
}
`;

const POINT_VERT = `
uniform float u_time;
void main() {
  vec3 p = position;
  p.x += sin(u_time * 0.12 + position.y * 5.0) * 0.05;
  p.y += cos(u_time * 0.1 + position.x * 4.0) * 0.04;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = 90.0;
  gl_Position = projectionMatrix * mv;
}
`;

const POINT_FRAG = `
precision mediump float;
out vec4 fragColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  fragColor = vec4(0.86, 0.72, 0.46, a * a * 0.28);
}
`;

export function DustField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);

    const nebula = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      transparent: true,
      depthWrite: false,
      uniforms: { u_time: { value: 0 } },
      vertexShader: NEBULA_VERT,
      fragmentShader: NEBULA_FRAG,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), nebula));

    const count = 36;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 1.8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      positions[i * 3 + 2] = 0.1;
    }
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { u_time: { value: 0 } },
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
    });
    scene.add(new THREE.Points(pointsGeo, pointsMat));

    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const started = performance.now();
    const draw = (now: number) => {
      const t = (now - started) / 1000;
      nebula.uniforms.u_time.value = t;
      pointsMat.uniforms.u_time.value = t;
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      pointsGeo.dispose();
      pointsMat.dispose();
      nebula.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 h-dvh w-full" aria-hidden />;
}
