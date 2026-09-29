import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
float speckle(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
  float t = u_time * 0.07;
  float n = sin(p.x * 2.4 + t) * sin(p.y * 1.8 - t * 0.8);
  n += sin(p.x * 6.5 - t) * sin(p.y * 5.2 + t * 1.2) * 0.35;
  vec2 cell = floor(p * 28.0 + vec2(t * 4.0, -t * 2.0));
  float dust = smoothstep(0.86, 1.0, speckle(cell));
  vec3 indigo = vec3(0.05, 0.04, 0.12);
  vec3 violet = vec3(0.28, 0.14, 0.42);
  vec3 gold = vec3(0.78, 0.62, 0.34);
  vec3 col = mix(indigo, violet, clamp(n * 0.5 + 0.45, 0.0, 1.0));
  col += gold * dust * 0.7;
  float vig = smoothstep(1.15, 0.15, length(p));
  gl_FragColor = vec4(col * vig, 1.0);
}
`;

function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const item = gl.createShader(type);
  if (!item) return null;
  gl.shaderSource(item, source);
  gl.compileShader(item);
  return gl.getShaderParameter(item, gl.COMPILE_STATUS) ? item : null;
}

export function DustField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;
    const vs = shader(gl, gl.VERTEX_SHADER, VERT);
    const fs = shader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const res = gl.getUniformLocation(program, "u_res");
    const time = gl.getUniformLocation(program, "u_time");
    let frame = 0;
    const draw = (now: number) => {
      const width = Math.max(1, Math.floor(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 1.25)));
      const height = Math.max(1, Math.floor(canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 1.25)));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(res, width, height);
      gl.uniform1f(time, now / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0 h-dvh w-full" aria-hidden />;
}
