"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ════════════════════════════════════════════════════════════════════════
// Visualização 3D do corpo — análise 3D (pós-MVP)
//
// Constrói um avatar paramétrico a partir das medidas estimadas do scan
// (circunferências → raios elípticos, alturas por proporções antropométricas).
// Quando o serviço SMPL retorna uma malha real (.glb), ela substitui o avatar.
// O scan anterior pode ser sobreposto em wireframe para comparação visual.
// ════════════════════════════════════════════════════════════════════════

export interface BodyMeasures {
  waistCm: number | null;
  hipCm: number | null;
  chestCm: number | null;
  neckCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  shoulderWidthCm?: number | null;
}

interface Props {
  heightCm: number;
  current: BodyMeasures;
  previous?: BodyMeasures | null;
  meshUrl?: string | null; // .glb do serviço SMPL (URL assinada)
  className?: string;
}

const DEPTH_RATIO = 0.72; // profundidade/largura típica do tronco

// circunferência (cm) → raio (unidades de cena; 1 unidade = 1m)
const circToR = (cm: number | null, fallback: number) =>
  cm ? cm / (2 * Math.PI) / 100 : fallback;

function buildParametricBody(heightCm: number, m: BodyMeasures): THREE.Group {
  const H = heightCm / 100; // metros
  const g = new THREE.Group();

  const neckR = circToR(m.neckCm, 0.06);
  const chestR = circToR(m.chestCm, 0.15);
  const waistR = circToR(m.waistCm, 0.14);
  const hipR = circToR(m.hipCm, 0.16);
  const armR = circToR(m.armCm, 0.05);
  const thighR = circToR(m.thighCm, 0.085);
  const shoulderHalf = m.shoulderWidthCm ? (m.shoulderWidthCm / 100) / 2 : chestR * 1.35;

  // tronco: perfil lateral (raio, altura) suavizado por lathe + achatamento em Z
  const profile: [number, number][] = [
    [neckR * 0.9, 0.875 * H],
    [shoulderHalf * 0.92, 0.815 * H],
    [chestR, 0.73 * H],
    [waistR, 0.62 * H],
    [hipR, 0.53 * H],
    [hipR * 0.82, 0.475 * H],
  ];
  const torso = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    32
  );
  const torsoMesh = new THREE.Mesh(torso);
  torsoMesh.scale.z = DEPTH_RATIO;
  g.add(torsoMesh);

  // cabeça + pescoço
  const headR = 0.0655 * H;
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 24, 18));
  head.position.y = 0.93 * H;
  head.scale.z = 0.9;
  g.add(head);
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckR * 0.85, neckR * 0.95, 0.05 * H, 20)
  );
  neck.position.y = 0.875 * H;
  g.add(neck);

  // braços (cilindros afunilados, ao longo do corpo)
  const armLen = 0.34 * H;
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(armR * 0.8, armR, armLen, 16)
    );
    arm.position.set(side * (shoulderHalf + armR * 0.7), 0.8 * H - armLen / 2, 0);
    g.add(arm);
  }

  // pernas (afunilam até o tornozelo)
  const legLen = 0.5 * H;
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(thighR, thighR * 0.42, legLen, 16)
    );
    leg.position.set(side * hipR * 0.52, legLen / 2, 0);
    leg.scale.z = 0.9;
    g.add(leg);
  }

  return g;
}

function applyMaterial(group: THREE.Group, material: THREE.Material) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.material = material;
  });
}

export function Body3DViewer({ heightCm, current, previous, meshUrl, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const H = heightCm / 100;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, H * 0.55, H * 2.1);
    camera.lookAt(0, H * 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(2, 4, 3);
    scene.add(dir);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // corpo atual — sólido
    const currentMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6, roughness: 0.55, metalness: 0.08,
    });
    const currentBody = buildParametricBody(heightCm, current);
    applyMaterial(currentBody, currentMat);
    pivot.add(currentBody);

    // scan anterior — wireframe sobreposto para comparação
    if (previous) {
      const prevMat = new THREE.MeshBasicMaterial({
        color: 0x94a3b8, wireframe: true, transparent: true, opacity: 0.42,
      });
      const prevBody = buildParametricBody(heightCm, previous);
      applyMaterial(prevBody, prevMat);
      pivot.add(prevBody);
    }

    // malha SMPL real substitui o avatar paramétrico quando disponível
    if (meshUrl) {
      import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
        new GLTFLoader().load(meshUrl, (gltf) => {
          pivot.remove(currentBody);
          const smplMesh = gltf.scene;
          applyMaterial(smplMesh as THREE.Group, currentMat);
          // normaliza a escala da malha para a altura do paciente
          const box = new THREE.Box3().setFromObject(smplMesh);
          const meshH = box.max.y - box.min.y;
          if (meshH > 0) smplMesh.scale.setScalar(H / meshH);
          smplMesh.position.y = -box.min.y * (H / Math.max(meshH, 1e-6));
          pivot.add(smplMesh);
        });
      });
    }

    // interação: arrastar para girar; rotação automática quando parado
    let dragging = false;
    let lastX = 0;
    let idleSpin = true;
    const onDown = (e: PointerEvent) => { dragging = true; idleSpin = false; lastX = e.clientX; };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      pivot.rotation.y += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    };
    const onUp = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.style.cursor = "grab";

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight || 380;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (idleSpin) pivot.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      mount.removeChild(renderer.domElement);
    };
  }, [heightCm, current, previous, meshUrl]);

  return (
    <div className={className}>
      <div ref={mountRef} className="h-[380px] w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900" />
      <p className="mt-1.5 text-center text-xs text-ink-mute">
        Arraste para girar · avatar gerado a partir das medidas estimadas
        {previous ? " · cinza = scan anterior" : ""}
      </p>
    </div>
  );
}
