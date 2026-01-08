import React, { useRef, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

function RobotInner({ mouse }) {
  const ref = useRef();
  const { scene } = useGLTF("/robot.glb");

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.material = new THREE.MeshPhysicalMaterial({
          color: "#eeeeee",
          roughness: 0.25,
          metalness: 0.55,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          reflectivity: 0.8,
        });
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (ref.current) {
      // Floating idle animation
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.04 - 0.5;
      
      // Smooth cursor tracking
      ref.current.rotation.y = THREE.MathUtils.lerp(
        ref.current.rotation.y,
        mouse.current.x * 0.6,
        0.08
      );
      ref.current.rotation.x = THREE.MathUtils.lerp(
        ref.current.rotation.x,
        mouse.current.y * 0.4,
        0.08
      );
    }
  });

  return <primitive ref={ref} object={scene} scale={1.3} position={[0, -0.5, 0]} />;
}

function RobotContent({ mouse }) {
  return (
    <Suspense fallback={null}>
      <>
        <RobotInner mouse={mouse} />
        <Environment preset="city" />
        
        {/* Ground plane for shadows */}
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -1.2, 0]}>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.25} />
        </mesh>
      </>
      
      {/* Cinematic lighting setup */}
      <ambientLight intensity={0.25} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 3, 2]} intensity={1.2} />
      <spotLight
        position={[0, 6, 4]}
        intensity={1.4}
        angle={0.35}
        penumbra={1}
      />
      
      {/* Premium bloom */}
      <EffectComposer>
        <Bloom intensity={0.4} luminanceThreshold={0.3} />
      </EffectComposer>
    </Suspense>
  );
}

export default function Robot3D() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      onMouseMove={(e) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas 
        shadows
        camera={{ position: [0, 1.5, 4], fov: 40 }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <RobotContent mouse={mouse} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/robot.glb");
