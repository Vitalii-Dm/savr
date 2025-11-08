import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";

function Liquid({ percent = 0.62 }: { percent?: number }) {
  const ref = useRef<any>(null);
  const { y } = useSpring({ y: percent, config: { tension: 120, friction: 18 } });
  
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.material.opacity = 0.9;
    ref.current.position.y = y.get() * 0.9 - 0.45;
    ref.current.material.color.set("#22d3ee");
    ref.current.rotation.z = Math.sin(t * 0.3) * 0.03;
  });

  return (
    <a.mesh ref={ref} castShadow receiveShadow>
      <cylinderGeometry args={[0.42, 0.42, 0.9, 64]} />
      <meshPhysicalMaterial 
        transparent 
        roughness={0.15} 
        metalness={0.1} 
        clearcoat={1} 
        clearcoatRoughness={0.2} 
      />
    </a.mesh>
  );
}

function Jar({ spin = true, percent = 0.62 }: { spin?: boolean; percent?: number }) {
  const group = useRef<any>(null);
  
  useFrame(() => {
    if (spin && group.current) group.current.rotation.y += 0.004;
  });

  return (
    <group ref={group}>
      {/* Glass body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.2, 96]} />
        <meshPhysicalMaterial 
          transparent 
          opacity={0.25} 
          roughness={0} 
          transmission={0.95} 
          thickness={0.5} 
          ior={1.45} 
          color="#bfffe8" 
        />
      </mesh>

      {/* Lid ring */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <torusGeometry args={[0.42, 0.05, 32, 120]} />
        <meshStandardMaterial metalness={1} roughness={0.2} color="#d4af37" />
      </mesh>

      {/* Base */}
      <mesh position={[0, -0.65, 0]} receiveShadow>
        <cylinderGeometry args={[0.52, 0.52, 0.04, 64]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
      </mesh>

      <Liquid percent={percent} />
    </group>
  );
}

export function SavingsPot3D({ percent = 0.62 }: { percent?: number }) {
  return (
    <div className="relative w-full h-[460px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent overflow-hidden">
      <Canvas shadows camera={{ position: [2.2, 1.6, 2.6], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
        <group position={[0, 0, 0]}>
          <Jar spin percent={percent} />
        </group>
        <ContactShadows 
          position={[0, -0.7, 0]} 
          opacity={0.35} 
          scale={6} 
          blur={2.5} 
          far={1.2} 
        />
        <Environment preset="city" />
        <OrbitControls 
          enablePan={false} 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={0.6} 
        />
      </Canvas>

      {/* Overlay metrics */}
      <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/40 to-transparent">
        <div className="text-sm text-white/70">Savings Pot</div>
        <div className="text-right">
          <div className="text-2xl font-bold">{Math.round(percent * 100)}%</div>
          <div className="text-xs text-white/70">filled</div>
        </div>
      </div>
    </div>
  );
}
