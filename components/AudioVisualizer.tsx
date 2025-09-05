import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { VoiceState } from './VoiceInterface';

const vertexShader = `
  precision mediump float;

  uniform float u_time;
  uniform float u_frequency;
  
  varying float v_noise;
  varying vec3 v_position;

  // 3D Simplex Noise function
  // https://github.com/stegu/webgl-noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    v_position = position;
    float noise = snoise(position * 2.5 + u_time * 0.2);
    float displacement = (u_frequency * 0.5 + noise * 0.15) * (1.0 + u_frequency * 0.2);
    vec3 newPosition = position + normal * displacement;
    
    v_noise = noise;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;

  uniform float u_time;
  uniform float u_state_float; // 0:idle, 1:listening, 2:thinking, 3:speaking

  varying float v_noise;
  varying vec3 v_position;
  
  void main() {
    // Colors
    vec3 color_idle = vec3(0.3, 0.1, 0.6); // Purple
    vec3 color_listening = vec3(0.2, 0.3, 0.9); // Blue
    vec3 color_thinking = vec3(0.8, 0.2, 0.6); // Magenta
    vec3 color_speaking = vec3(1.0, 0.3, 0.5); // Pink
    
    // State interpolation
    vec3 color1 = mix(color_idle, color_listening, smoothstep(0.0, 1.0, u_state_float));
    vec3 color2 = mix(color1, color_thinking, smoothstep(1.0, 2.0, u_state_float));
    vec3 final_color = mix(color2, color_speaking, smoothstep(2.0, 3.0, u_state_float));

    // Fresnel effect for glow
    vec3 view_direction = normalize(-v_position);
    vec3 normal_direction = normalize(v_position);
    float fresnel = 1.0 - dot(view_direction, normal_direction);
    fresnel = fresnel * fresnel; // Using multiply instead of pow for compatibility and performance

    // Pulse effect for thinking and speaking (branchless)
    float thinking_pulse = (sin(u_time * 3.0) * 0.5 + 0.5) * 0.2;
    float is_thinking = step(1.5, u_state_float) * (1.0 - step(2.5, u_state_float));

    float speaking_pulse = (sin(u_time * 2.0) * 0.5 + 0.5) * 0.3;
    float is_speaking = step(2.5, u_state_float);

    float pulse = thinking_pulse * is_thinking + speaking_pulse * is_speaking;

    vec3 base_color = final_color + v_noise * 0.1 + pulse;
    vec3 glow_color = final_color * 1.5;

    gl_FragColor = vec4(mix(base_color, glow_color, fresnel), 1.0);
  }
`;


interface AudioVisualizerProps {
  frequencyData: Uint8Array;
  interactionState: VoiceState;
  onClick: () => void;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ frequencyData, interactionState, onClick }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const isInitializedRef = useRef(false);

  // Use a ref to pass the latest props to the animation loop without re-triggering the setup effect
  const latestPropsRef = useRef({ frequencyData, interactionState });
  useEffect(() => {
    latestPropsRef.current = { frequencyData, interactionState };
  }, [frequencyData, interactionState]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    let animationFrameId: number;

    const init = (width: number, height: number) => {
      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      // Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 3;
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      currentMount.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Geometry & Material
      const geometry = new THREE.IcosahedronGeometry(1.5, 64);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_frequency: { value: 0 },
          u_state_float: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      meshRef.current = mesh;
      
      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.enableZoom = false;
      controlsRef.current = controls;

      // Animation loop
      const animate = (time: number) => {
        const timeSeconds = time * 0.001;
        const { interactionState: currentState, frequencyData: currentFreqData } = latestPropsRef.current;
        
        if (material) {
            // 1. Update frequency for distortion
            let frequencyValue = 0;
            if (currentState === 'listening' && currentFreqData.length > 0) {
                // Use real microphone data when listening
                frequencyValue = currentFreqData.reduce((a, b) => a + b) / currentFreqData.length / 128;
            } else if (currentState === 'speaking') {
                // Generate a simulated, organic-looking frequency when the bot is speaking
                const slowPulse = (Math.sin(timeSeconds * 4) * 0.5 + 0.5) * 0.6;
                const fastJitter = (Math.sin(timeSeconds * 18) * 0.5 + 0.5) * 0.4;
                frequencyValue = ((slowPulse + fastJitter) / 2) * 0.4;
            }
            
            // 2. Update state for color and other time-based effects in the shader
            let stateFloat = 0;
            switch(currentState) {
                case 'listening': stateFloat = 1.0; break;
                case 'thinking': stateFloat = 2.0; break;
                case 'speaking': stateFloat = 3.0; break;
                default: stateFloat = 0.0; // idle or error
            }

            // Apply updates to material uniforms
            material.uniforms.u_time.value = timeSeconds;
            // Smoothly interpolate values for softer visual transitions
            material.uniforms.u_frequency.value = THREE.MathUtils.lerp(material.uniforms.u_frequency.value, frequencyValue, 0.1);
            material.uniforms.u_state_float.value = THREE.MathUtils.lerp(material.uniforms.u_state_float.value, stateFloat, 0.1);
        }

        controls.update();
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };
      animate(0);
    };
    
    const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
            const { width, height } = entry.contentRect;
            if (!isInitializedRef.current && width > 0 && height > 0) {
                init(width, height);
                isInitializedRef.current = true;
            } else if (isInitializedRef.current) {
                // Handle resize for already initialized scene
                if (rendererRef.current && cameraRef.current) {
                    rendererRef.current.setSize(width, height);
                    cameraRef.current.aspect = width / height;
                    cameraRef.current.updateProjectionMatrix();
                }
            }
        }
    });

    resizeObserver.observe(currentMount);

    // Cleanup
    return () => {
      resizeObserver.unobserve(currentMount);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
      // Dispose Three.js objects
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach(m => m.dispose());
        } else {
            meshRef.current.material.dispose();
        }
      }
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
      isInitializedRef.current = false;
    };
  }, []);

  return <div ref={mountRef} onClick={onClick} className="w-full h-full cursor-pointer" aria-label="Visualizador de áudio interativo" role="button" tabIndex={0} />;
};

export default AudioVisualizer;