import type React from "react";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  useMemo,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Placeholder brand logo; replace with your asset loader integration as needed
const brandLogo = '' as unknown as string;

// Audio context for sharing between components
const AudioContextProvider = createContext<{
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  gainNode: GainNode | null;
  synthParams: {
    attack: number;
    filter: number;
    distortion: number;
    pitchBend: number;
  };
  setSynthParams: (params: any) => void;
}>({
  audioContext: null,
  analyser: null,
  gainNode: null,
  synthParams: {
    attack: 0.1,
    filter: 0.3,
    distortion: 0.3,
    pitchBend: 0.5,
  },
  setSynthParams: () => {},
});

// Piano key configuration - now with 8 white keys
const whiteKeys = ["C", "D", "E", "F", "G", "A", "B", "C2"];
const blackKeys = ["C#", "D#", null, "F#", "G#", "A#", null];

// Task prompts for each white key (1-8)
const taskPrompts = {
  C: {
    title: "Task 1: Foundation",
    content:
      "Establish your base rhythm and core melody structure. Focus on creating a steady foundation that will support your musical journey.",
  },
  D: {
    title: "Task 2: Harmony",
    content:
      "Layer in harmonic elements. Experiment with chord progressions and find the perfect complement to your foundation melody.",
  },
  E: {
    title: "Task 3: Dynamics",
    content:
      "Play with volume and intensity variations. Use the attack knob to create crescendos and diminuendos in your performance.",
  },
  F: {
    title: "Task 4: Texture",
    content:
      "Explore the filter controls to add texture and movement. Shape your sound with the filter knob to create evolving timbres.",
  },
  G: {
    title: "Task 5: Color",
    content:
      "Add character with the distortion control. Find the sweet spot between clean tones and gritty textures to color your music.",
  },
  A: {
    title: "Task 6: Expression",
    content:
      "Use the pitch bend slider to add expressive elements. Bend notes and create smooth transitions between musical phrases.",
  },
  B: {
    title: "Task 7: Integration",
    content:
      "Combine all elements into a cohesive performance. Layer your techniques and create a complete musical expression.",
  },
  C2: {
    title: "Task 8: Mastery",
    content:
      "Demonstrate complete mastery by creating a full composition. Combine all previous techniques into an original musical piece that showcases your skills.",
  },
};

interface PianoKeyProps {
  note: string;
  isBlack?: boolean;
  isPressed?: boolean;
  onPress: (note: string) => void;
  onRelease: (note: string) => void;
}

function PianoKey({
  note,
  isBlack = false,
  isPressed = false,
  onPress,
  onRelease,
}: PianoKeyProps) {
  const handleStart = () => onPress(note);
  const handleEnd = () => onRelease(note);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  const handleMouseDown = () => handleStart();
  const handleMouseUp = () => handleEnd();
  const handleMouseLeave = () => handleEnd();

  if (isBlack) {
    const blackKeyPositions: { [key: string]: number } = {
      "C#": 53,
      "D#": 105,
      "F#": 209,
      "G#": 261,
      "A#": 313,
    };

    const leftPosition = blackKeyPositions[note];

    return (
      <button
        className={`
          absolute top-0 w-[35px] h-[120px] bg-black border-2 border-white rounded-[10px] z-10
          transition-all duration-75 select-none touch-none
          ${isPressed ? "bg-gray-800 scale-95" : "hover:bg-gray-900"}
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          left: `${leftPosition}px`,
          transform: "translateX(-50%)",
          touchAction: "none",
        }}
      />
    );
  }

  return (
    <button
      className={`
        w-[54px] h-[200px] bg-black border-2 border-white rounded-[12px] -ml-[2px] first:ml-0
        transition-all duration-75 select-none touch-none
        ${isPressed ? "bg-gray-800 scale-95" : "hover:bg-gray-900"}
      `}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "none" }}
    />
  );
}

function TaskPromptCard({ note }: { note: string }) {
  const prompt = taskPrompts[note as keyof typeof taskPrompts];
  if (!prompt) return null;
  return (
    <div className="mt-8 w-full max-w-md mx-auto">
      <div className="bg-black border-2 border-white rounded-lg p-4 animate-in fade-in duration-200">
        <h3 className="text-white font-mono tracking-wider mb-2">{prompt.title}</h3>
        <p className="text-gray-300 font-mono text-sm leading-relaxed">{prompt.content}</p>
      </div>
    </div>
  );
}

function CloudFBM() {
  const mesh = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const { analyser } = useContext(AudioContextProvider);
  const dataArray = useRef<Uint8Array | null>(null);

  const uniforms = useMemo(
    () => ({
      u_resolution: { value: new THREE.Vector2() },
      u_pixelRatio: {
        value: typeof window !== "undefined" ? window.devicePixelRatio : 1,
      },
      u_time: { value: 0.1 },
      u_scale: { value: 2.5 },
      u_color1: { value: new THREE.Vector3(0.08, 0.12, 0.24) },
      u_color2: { value: new THREE.Vector3(0.25, 0.35, 0.65) },
      u_color3: { value: new THREE.Vector3(0.55, 0.75, 0.95) },
      u_color4: { value: new THREE.Vector3(0.9, 0.95, 1.0) },
      u_octaves: { value: 6.0 },
      u_persistence: { value: 0.5 },
      u_lacunarity: { value: 2.0 },
      u_volume: { value: 0.0 },
      u_frequency: { value: 0.0 },
      u_bass: { value: 0.0 },
      u_mid: { value: 0.0 },
      u_treble: { value: 0.0 },
    }),
    []
  );

  useEffect(() => {
    if (analyser) {
      dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, [analyser]);

  useFrame((state) => {
    const { clock } = state;
    if (mesh.current) {
      let currentVolume = 0;

      if (analyser && dataArray.current) {
        const spectrum = dataArray.current as Uint8Array;
        (analyser as any).getByteFrequencyData(spectrum);
        const volume =
          spectrum.reduce((sum, value) => sum + value, 0) /
          spectrum.length /
          255;

        currentVolume = volume;

        const bassEnd = Math.floor(spectrum.length * 0.1);
        const midEnd = Math.floor(spectrum.length * 0.4);

        const bass =
          spectrum.slice(0, bassEnd).reduce((sum, value) => sum + value, 0) /
          bassEnd /
          255;
        const mid =
          spectrum
            .slice(bassEnd, midEnd)
            .reduce((sum, value) => sum + value, 0) /
          (midEnd - bassEnd) /
          255;
        const treble =
          spectrum.slice(midEnd).reduce((sum, value) => sum + value, 0) /
          (spectrum.length - midEnd) /
          255;

        const maxIndex = spectrum.indexOf(Math.max(...spectrum));
        const frequency = maxIndex / spectrum.length;

        const uniforms = (mesh.current.material as THREE.ShaderMaterial).uniforms as any;
        uniforms.u_volume.value = THREE.MathUtils.lerp(uniforms.u_volume.value, volume, 0.1);
        uniforms.u_frequency.value = THREE.MathUtils.lerp(uniforms.u_frequency.value, frequency, 0.1);
        uniforms.u_bass.value = THREE.MathUtils.lerp(uniforms.u_bass.value, bass, 0.1);
        uniforms.u_mid.value = THREE.MathUtils.lerp(uniforms.u_mid.value, mid, 0.1);
        uniforms.u_treble.value = THREE.MathUtils.lerp(uniforms.u_treble.value, treble, 0.1);

        const intensity = volume * 1.5;

        (uniforms.u_color1.value as THREE.Vector3).set(0.08 + bass * 0.15, 0.12 + bass * 0.2, 0.24 + bass * 0.3);
        (uniforms.u_color2.value as THREE.Vector3).set(0.25 + mid * 0.2, 0.35 + mid * 0.25, 0.65 + mid * 0.2);
        (uniforms.u_color3.value as THREE.Vector3).set(0.55 + treble * 0.25, 0.75 + treble * 0.15, 0.95 + treble * 0.05);
        (uniforms.u_color4.value as THREE.Vector3).set(0.9 + intensity * 0.1, 0.95 + intensity * 0.05, 1.0);

        uniforms.u_scale.value = 2.5 + volume * 1.0;
        uniforms.u_octaves.value = 6.0 + bass * 1.0;
        uniforms.u_persistence.value = 0.5 + treble * 0.3;
        uniforms.u_lacunarity.value = 2.0 + mid * 0.5;
      }

      const baseSpeed = 0.2;
      const audioSpeedMultiplier = 1 + currentVolume * 5;
      const finalSpeed = baseSpeed * audioSpeedMultiplier;

      const uniforms = (mesh.current.material as THREE.ShaderMaterial).uniforms as any;
      uniforms.u_time.value = clock.getElapsedTime() * finalSpeed;
      (uniforms.u_resolution.value as THREE.Vector2).set(
        200 * (typeof window !== "undefined" ? window.devicePixelRatio : 1),
        200 * (typeof window !== "undefined" ? window.devicePixelRatio : 1)
      );
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_scale;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;
    uniform vec3 u_color4;
    uniform float u_octaves;
    uniform float u_persistence;
    uniform float u_lacunarity;
    uniform float u_pixelRatio;
    uniform float u_volume;
    uniform float u_frequency;
    uniform float u_bass;
    uniform float u_mid;
    uniform float u_treble;
    varying vec2 vUv;

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}    
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}    
    float cnoise(vec3 P){
      vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
      Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
      vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
      vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);
      vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);
      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
      vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
      vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
      vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
      vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);
      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.18 * n_xyz;
    }

    float fbm(vec3 p) {
      float value = 0.0; float amplitude = 0.5; float frequency = 1.0;
      for (float i = 0.0; i < u_octaves; i++) {
        value += amplitude * cnoise(p * frequency);
        frequency *= u_lacunarity; amplitude *= u_persistence;
      }
      return value;
    }
    float ridgedNoise(vec3 p) { return 1.0 - abs(cnoise(p)); }
    float ridgedFBM(vec3 p) {
      float value = 0.0; float amplitude = 0.5; float frequency = 1.0;
      for (float i = 0.0; i < u_octaves * 0.5; i++) {
        value += amplitude * ridgedNoise(p * frequency);
        frequency *= u_lacunarity; amplitude *= u_persistence;
      }
      return value;
    }
    void main() {
      vec2 screenCoord = gl_FragCoord.xy / u_resolution.xy;
      float audioWarp = u_volume * 0.3;
      float frequencyShift = u_frequency * 1.2;
      vec3 fbmCoords = vec3(screenCoord * u_scale, u_time * 0.5);
      fbmCoords.xy += audioWarp; fbmCoords.z += frequencyShift;
      fbmCoords.y += sin(screenCoord.x * 4.0 + u_time * 2.0) * u_bass * 0.5;
      fbmCoords += vec3(
        sin(screenCoord.y * 20.0 + u_time * 3.0) * u_treble * 0.15,
        cos(screenCoord.x * 16.0 + u_time * 2.5) * u_treble * 0.15,
        0.0);
      float angle = u_time * 1.5 + length(screenCoord - 0.5) * 8.0;
      fbmCoords.xy += vec2(cos(angle), sin(angle)) * u_mid * 0.4;
      float fbm1 = fbm(fbmCoords);
      float fbm2 = fbm(fbmCoords * 2.1 + vec3(100.0, 50.0, 25.0));
      float fbm3 = ridgedFBM(fbmCoords * 0.8 + vec3(200.0, 100.0, 50.0));
      float cloudDensity = fbm1 * 0.5 + fbm2 * 0.3 + fbm3 * 0.2;
      cloudDensity = (cloudDensity + 1.0) * 0.5;
      cloudDensity = smoothstep(0.1, 0.9, cloudDensity);
      float densityModulation = 1.0 + sin(u_time * 3.0) * u_volume * 0.4;
      cloudDensity *= densityModulation;
      vec3 finalColor;
      if (cloudDensity < 0.25) {
        finalColor = mix(u_color1, u_color2, smoothstep(0.0, 0.25, cloudDensity));
      } else if (cloudDensity < 0.5) {
        finalColor = mix(u_color2, u_color3, smoothstep(0.25, 0.5, cloudDensity));
      } else if (cloudDensity < 0.75) {
        finalColor = mix(u_color3, u_color4, smoothstep(0.5, 0.75, cloudDensity));
      } else {
        finalColor = u_color4;
      }
      float shimmer = sin(screenCoord.x * 20.0 + u_time * 8.0) * sin(screenCoord.y * 15.0 + u_time * 6.0);
      finalColor += shimmer * u_treble * 0.1 * cloudDensity;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return (
    <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      {/* Use args to satisfy R3F types */}
      <shaderMaterial args={[{ fragmentShader, vertexShader, uniforms }]} />
    </mesh>
  );
}

function Visualizer() {
  return (
    <div className="w-[200px] h-[200px] border-2 border-white rounded-lg overflow-hidden touch-none">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <CloudFBM />
      </Canvas>
    </div>
  );
}

function Controls() {
  const { synthParams, setSynthParams } = useContext(AudioContextProvider);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [isSliderDragging, setIsSliderDragging] = useState(false);

  const getEventCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in event && event.touches.length > 0) {
      return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
    } else if ("changedTouches" in event && event.changedTouches.length > 0) {
      return { clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY };
    } else {
      return { clientX: (event as React.MouseEvent).clientX, clientY: (event as React.MouseEvent).clientY };
    }
  };

  const handleKnobChange = (index: number, event: React.MouseEvent | React.TouchEvent) => {
    if (isDragging === index) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const coords = getEventCoordinates(event);
      const angle = Math.atan2(coords.clientY - centerY, coords.clientX - centerX);
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
      const value = Math.max(0, Math.min(1, normalizedAngle));
      const paramNames = ["attack", "filter", "distortion"] as const;
      setSynthParams({ ...synthParams, [paramNames[index]]: value } as any);
    }
  };

  const handleKnobStart = (index: number) => { setIsDragging(index); };
  const handleKnobEnd = () => { setIsDragging(null); };

  const handleSliderChange = (event: React.MouseEvent | React.TouchEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const coords = getEventCoordinates(event);
    const x = coords.clientX - rect.left;
    const value = Math.max(0, Math.min(1, x / rect.width));
    setSynthParams({ ...synthParams, pitchBend: value });
  };

  const handleSliderStart = (event: React.MouseEvent | React.TouchEvent) => {
    if ("preventDefault" in event) { event.preventDefault(); }
    setIsSliderDragging(true);
    handleSliderChange(event);
  };
  const handleSliderMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (isSliderDragging) { if ("preventDefault" in event) { event.preventDefault(); } handleSliderChange(event); }
  };
  const handleSliderEnd = (event?: React.MouseEvent | React.TouchEvent) => {
    if (event && "preventDefault" in event) { event.preventDefault(); }
    setIsSliderDragging(false);
  };

  useEffect(() => {
    const handleGlobalMove = (event: MouseEvent | TouchEvent) => {
      if (isSliderDragging) {
        event.preventDefault();
        const sliderElement = document.querySelector("[data-slider]") as HTMLElement;
        if (sliderElement) {
          const rect = sliderElement.getBoundingClientRect();
          let x: number;
          if ("touches" in event && (event as TouchEvent).touches.length > 0) {
            x = (event as TouchEvent).touches[0].clientX - rect.left;
          } else if ("changedTouches" in event && (event as TouchEvent).changedTouches.length > 0) {
            x = (event as TouchEvent).changedTouches[0].clientX - rect.left;
          } else {
            x = (event as MouseEvent).clientX - rect.left;
          }
          const value = Math.max(0, Math.min(1, x / rect.width));
          setSynthParams({ ...synthParams, pitchBend: value });
        }
      }
    };

    const handleGlobalEnd = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      setIsSliderDragging(false);
    };

    if (isSliderDragging) {
      document.addEventListener("mousemove", handleGlobalMove, { passive: false });
      document.addEventListener("mouseup", handleGlobalEnd, { passive: false });
      document.addEventListener("touchmove", handleGlobalMove, { passive: false });
      document.addEventListener("touchend", handleGlobalEnd, { passive: false });
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMove as any);
      document.removeEventListener("mouseup", handleGlobalEnd as any);
      document.removeEventListener("touchmove", handleGlobalMove as any);
      document.removeEventListener("touchend", handleGlobalEnd as any);
    };
  }, [isSliderDragging, synthParams, setSynthParams]);

  const knobValues = [synthParams.attack, synthParams.filter, synthParams.distortion];

  return (
    <div className="w-[200px] h-[200px] flex flex-col justify-between touch-none">
      <div className="h-[100px] bg-black border-2 border-white rounded-lg p-2 flex justify-between items-center">
        {knobValues.map((value, index) => (
          <div key={index} className="relative flex items-center justify-center">
            <div
              className="w-16 h-16 cursor-pointer select-none flex items-center justify-center touch-none"
              onMouseDown={() => handleKnobStart(index)}
              onMouseMove={(e) => handleKnobChange(index, e)}
              onMouseUp={handleKnobEnd}
              onMouseLeave={handleKnobEnd}
              onTouchStart={(e) => { e.preventDefault(); handleKnobStart(index); }}
              onTouchMove={(e) => { e.preventDefault(); handleKnobChange(index, e); }}
              onTouchEnd={(e) => { e.preventDefault(); handleKnobEnd(); }}
              style={{ touchAction: "none" }}
            >
              <div className="w-12 h-12 border-2 border-white rounded-full bg-black relative">
                <div
                  className="absolute top-1 left-1/2 w-0.5 h-4 bg-white origin-bottom transform -translate-x-1/2"
                  style={{ transform: `translateX(-50%) rotate(${(value - 0.5) * 270}deg)` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-[64px] bg-black border-2 border-white rounded-lg p-2 flex items-center">
        <div
          className="w-full relative cursor-pointer select-none py-4 touch-none"
          data-slider
          onMouseDown={handleSliderStart}
          onMouseMove={handleSliderMove}
          onMouseUp={handleSliderEnd}
          onMouseLeave={() => handleSliderEnd()}
          onTouchStart={handleSliderStart}
          onTouchMove={handleSliderMove}
          onTouchEnd={handleSliderEnd}
          style={{ touchAction: "none" }}
        >
          <div className="w-full h-1 bg-white rounded-full relative">
            <div
              className="absolute top-1/2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2 -translate-x-1/2 cursor-pointer border border-gray-300 shadow-sm"
              style={{ left: `${synthParams.pitchBend * 100}%`, touchAction: "none" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MidiPianoApp() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [synthParams, setSynthParams] = useState({ attack: 0.25, filter: 0.3, distortion: 0.7, pitchBend: 0.6 });

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => { e.preventDefault(); };
    const preventPullToRefresh = (e: TouchEvent) => { if (e.touches.length === 1) { e.preventDefault(); } };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.touchAction = "none";
    document.addEventListener("touchstart", preventPullToRefresh, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
      document.removeEventListener("touchstart", preventPullToRefresh);
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).AudioContext) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new Ctx();
      const analyserNode = ctx.createAnalyser();
      const gain = ctx.createGain();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      gain.connect(analyserNode);
      analyserNode.connect(ctx.destination);
      setAudioContext(ctx);
      setAnalyser(analyserNode);
      setGainNode(gain);
    }
  }, []);

  const playNote = useCallback(
    (note: string) => {
      if (audioContext && gainNode) {
        const oscillator = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const distortion = audioContext.createWaveShaper();

        const noteFrequencies: { [key: string]: number } = {
          C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13, E: 329.63,
          F: 349.23, "F#": 369.99, G: 392.0, "G#": 415.3, A: 440.0, "A#": 466.16, B: 493.88, C2: 523.25,
        };

        const pitchMultiplier = Math.pow(2, (synthParams.pitchBend - 0.5) * 2);
        const frequency = (noteFrequencies[note] || 440) * pitchMultiplier;

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(200 + synthParams.filter * 8000, audioContext.currentTime);
        filter.Q.setValueAtTime(1 + synthParams.distortion * 10, audioContext.currentTime);

        const makeDistortionCurve = (amount: number) => {
          const samples = 44100;
          const curve = new Float32Array(samples);
          const deg = Math.PI / 180;
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = (((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x)));
          }
          return curve;
        };
        distortion.curve = makeDistortionCurve(synthParams.distortion * 50);
        distortion.oversample = "4x";

        oscillator.connect(filter);
        filter.connect(distortion);
        distortion.connect(noteGain);
        noteGain.connect(gainNode);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = "square";

        const attackTime = 0.01 + synthParams.attack * 0.3;
        noteGain.gain.setValueAtTime(0, audioContext.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + attackTime);
        noteGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    },
    [audioContext, gainNode, synthParams]
  );

  const handleKeyPress = useCallback(
    (note: string) => {
      setPressedKeys((prev) => new Set(prev).add(note));
      playNote(note);
      if (whiteKeys.includes(note)) { setActivePrompt(note); }
    },
    [playNote]
  );

  const handleKeyRelease = useCallback(
    (note: string) => {
      setPressedKeys((prev) => { const next = new Set(prev); next.delete(note); return next; });
      if (whiteKeys.includes(note) && activePrompt === note) { setActivePrompt(null); }
    },
    [activePrompt]
  );

  useEffect(() => {
    const keyMap: { [key: string]: string } = { a: "C", w: "C#", s: "D", e: "D#", d: "E", f: "F", t: "F#", g: "G", y: "G#", h: "A", u: "A#", j: "B", k: "C2" };
    const handleKeyDown = (event: KeyboardEvent) => {
      const note = keyMap[event.key.toLowerCase()];
      if (note && !pressedKeys.has(note)) { handleKeyPress(note); }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const note = keyMap[event.key.toLowerCase()];
      if (note) { handleKeyRelease(note); }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pressedKeys, handleKeyPress, handleKeyRelease]);

  return (
    <AudioContextProvider.Provider value={{ audioContext, analyser, gainNode, synthParams, setSynthParams }}>
      <div
        className="min-h-screen bg-black flex flex-col items-center justify-center relative touch-none select-none"
        style={{
          backgroundImage:
            `radial-gradient(circle at 1.5px 1.5px, rgba(255, 255, 255, 0.2) 1.5px, transparent 0)`,
          backgroundSize: "32px 32px",
          touchAction: "none",
          overflow: "hidden",
          position: "fixed",
          width: "100%",
          height: "100%",
        }}
      >
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          {brandLogo ? (
            <img src={brandLogo} alt="Group Notes by The Janie Group" className="h-16 w-auto object-contain filter invert" />
          ) : (
            <div className="h-16 w-48 border-2 border-white rounded grid place-items-center text-white font-mono">
              LOGO
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-8 scale-115">
          <div className="text-white font-mono tracking-wider">PLAY</div>
          <div className="flex items-center gap-8">
            <Visualizer />
            <div className="relative touch-none">
              <div className="flex">
                {whiteKeys.map((note) => (
                  <PianoKey key={note} note={note} isPressed={pressedKeys.has(note)} onPress={handleKeyPress} onRelease={handleKeyRelease} />
                ))}
              </div>
              <div className="absolute top-0 left-0">
                {["C#", "D#", "F#", "G#", "A#"].map((note) => (
                  <PianoKey key={note} note={note} isBlack isPressed={pressedKeys.has(note)} onPress={handleKeyPress} onRelease={handleKeyRelease} />
                ))}
              </div>
            </div>
            <Controls />
          </div>
          {activePrompt && <TaskPromptCard note={activePrompt} />}
        </div>
      </div>
    </AudioContextProvider.Provider>
  );
}

