import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { VoiceState } from './VoiceInterface';
import LowSpecVisualizer, { computeFrequencyValue } from './AudioVisualizerLowSpec';

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


const detectFallbackPreference = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const hardwareCores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : undefined;
  const lowCpu = typeof hardwareCores === 'number' && hardwareCores <= 6;

  const navWithMemory = navigator as Navigator & { deviceMemory?: number };
  const deviceMemory = navWithMemory.deviceMemory;
  const lowMemory = typeof deviceMemory === 'number' && deviceMemory <= 4;

  const hasCoarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(any-pointer: coarse)').matches;
  const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallViewport = window.innerWidth <= 900;

  return lowCpu || lowMemory || hasCoarsePointer || prefersReducedMotion || smallViewport;
};

const resolveStateFloat = (state: VoiceState) => {
  switch (state) {
    case 'listening':
      return 1.0;
    case 'thinking':
      return 2.0;
    case 'speaking':
      return 3.0;
    default:
      return 0.0;
  }
};

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
  const latestPropsRef = useRef({ frequencyData, interactionState });

  const [useFallback, setUseFallback] = useState(() => detectFallbackPreference());

  useEffect(() => {
    latestPropsRef.current = { frequencyData, interactionState };
  }, [frequencyData, interactionState]);

  useEffect(() => {
    if (!useFallback && detectFallbackPreference()) {
      setUseFallback(true);
    }
  }, [useFallback]);

  useEffect(() => {
    if (useFallback) {
      return;
    }

    const currentMount = mountRef.current;
    if (!currentMount) {
      return;
    }

    let animationFrameId: number | null = null;

    const disposeScene = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (rendererRef.current) {
        const dom = rendererRef.current.domElement;
        if (dom.parentElement === currentMount) {
          currentMount.removeChild(dom);
        }
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        const material = meshRef.current.material;
        if (Array.isArray(material)) {
          material.forEach(mat => mat.dispose());
        } else {
          material.dispose();
        }
        meshRef.current = null;
      }
      controlsRef.current?.dispose();
      controlsRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      isInitializedRef.current = false;
    };

    const init = (width: number, height: number): boolean => {
      try {
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 3;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const handleContextLost = (event: Event) => {
          event.preventDefault();
          disposeScene();
          setUseFallback(true);
        };
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost, { once: true });

        const gl = renderer.getContext();
        const hasWebGLContext = (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) ||
          (typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext);
        if (!hasWebGLContext) {
          throw new Error('WebGL not supported on this device');
        }

        const detailLevel = typeof window !== 'undefined' && window.innerWidth < 1024 ? 3 : 5;
        const geometry = new THREE.IcosahedronGeometry(1.5, detailLevel);
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            u_time: { value: 0 },
            u_frequency: { value: 0 },
            u_state_float: { value: 0 },
          },
          transparent: true,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.rotateSpeed = 0.4;
        controlsRef.current = controls;

        const animate = (time: number) => {
          const timeSeconds = time * 0.001;
          const { interactionState: currentState, frequencyData: currentFrequencyData } = latestPropsRef.current;
          const currentMesh = meshRef.current;
          const materialRef = currentMesh?.material as THREE.ShaderMaterial | undefined;

          if (materialRef) {
            const targetFrequency = computeFrequencyValue(currentState, currentFrequencyData, timeSeconds);
            const targetStateFloat = resolveStateFloat(currentState);
            materialRef.uniforms.u_time.value = timeSeconds;
            materialRef.uniforms.u_frequency.value = THREE.MathUtils.lerp(materialRef.uniforms.u_frequency.value, targetFrequency, 0.1);
            materialRef.uniforms.u_state_float.value = THREE.MathUtils.lerp(materialRef.uniforms.u_state_float.value, targetStateFloat, 0.1);
          }

          controlsRef.current?.update();

          const activeRenderer = rendererRef.current;
          const activeScene = sceneRef.current;
          const activeCamera = cameraRef.current;
          if (activeRenderer && activeScene && activeCamera) {
            activeRenderer.render(activeScene, activeCamera);
          }

          animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return true;
      } catch (error) {
        console.warn('3D audio visualizer failed to initialise:', error);
        disposeScene();
        return false;
      }
    };

    const handleResize = (width: number, height: number) => {
      if (width <= 0 || height <= 0) {
        return;
      }

      if (!isInitializedRef.current) {
        const initialized = init(width, height);
        if (initialized) {
          isInitializedRef.current = true;
        } else {
          setUseFallback(true);
        }
      } else if (rendererRef.current && cameraRef.current) {
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    const updateFromElement = () => {
      const rect = currentMount.getBoundingClientRect();
      handleResize(rect.width, rect.height);
    };

    let resizeObserver: ResizeObserver | null = null;
    let detachListeners: (() => void) | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        const width = entry?.contentRect?.width ?? currentMount.clientWidth;
        const height = entry?.contentRect?.height ?? currentMount.clientHeight;
        handleResize(width, height);
      });
      resizeObserver.observe(currentMount);
      updateFromElement();
    } else {
      const listener = () => window.requestAnimationFrame(updateFromElement);
      window.addEventListener('resize', listener);
      window.addEventListener('orientationchange', listener);
      detachListeners = () => {
        window.removeEventListener('resize', listener);
        window.removeEventListener('orientationchange', listener);
      };
      updateFromElement();
    }

    return () => {
      resizeObserver?.disconnect();
      detachListeners?.();
      disposeScene();
    };
  }, [useFallback]);

  if (useFallback) {
    return (
      <LowSpecVisualizer
        frequencyData={frequencyData}
        interactionState={interactionState}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      onClick={onClick}
      className="w-full h-full cursor-pointer"
      aria-label="Visualizador de audio interativo"
      role="button"
      tabIndex={0}
    />
  );
};

export default AudioVisualizer;
