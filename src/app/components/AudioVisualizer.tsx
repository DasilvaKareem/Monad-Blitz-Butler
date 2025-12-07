'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

interface AudioVisualizerProps {
  isExpanded: boolean;
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

function AudioVisualizer({ isExpanded, audioElement, isPlaying }: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  const BAR_COUNT = 64;
  const BAR_WIDTH = 0.15;
  const BAR_GAP = 0.08;
  const MAX_HEIGHT = 4;

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!containerRef.current || sceneRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 2, 12);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Point lights for glow effect
    const pointLight1 = new THREE.PointLight(0xd4af37, 1, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b0000, 0.8, 20);
    pointLight2.position.set(-5, 3, 5);
    scene.add(pointLight2);

    // Create bars
    const totalWidth = BAR_COUNT * (BAR_WIDTH + BAR_GAP);
    const startX = -totalWidth / 2;

    for (let i = 0; i < BAR_COUNT; i++) {
      const geometry = new THREE.BoxGeometry(BAR_WIDTH, 0.1, BAR_WIDTH);

      // Gradient color from gold to bordeaux
      const t = i / BAR_COUNT;
      const color = new THREE.Color();
      color.setHSL(0.12 - t * 0.12, 0.8, 0.5 + t * 0.1);

      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.7,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.2,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.x = startX + i * (BAR_WIDTH + BAR_GAP);
      bar.position.y = 0.05;
      bar.position.z = 0;

      scene.add(bar);
      barsRef.current.push(bar);
    }

    // Add a reflective floor
    const floorGeometry = new THREE.PlaneGeometry(20, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    // Add particles for atmosphere
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = Math.random() * 8;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

  }, []);

  // Setup audio analyser
  const setupAudioAnalyser = useCallback(() => {
    if (!audioElement || analyserRef.current) return;

    try {
      // Get or create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect audio source
      if (audioElement.srcObject) {
        // If it's a MediaStream
        const stream = audioElement.srcObject as MediaStream;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;
      } else if (audioElement.src) {
        // If it's a regular audio element
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        source.connect(audioContext.destination);
        sourceRef.current = source;
      }

    } catch (error) {
      console.error('Error setting up audio analyser:', error);
    }
  }, [audioElement]);

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    animationIdRef.current = requestAnimationFrame(animate);
    timeRef.current += 0.016;

    const bars = barsRef.current;

    if (analyserRef.current && isPlaying) {
      // Get frequency data
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Update bars based on frequency data
      for (let i = 0; i < bars.length; i++) {
        const dataIndex = Math.floor(i * bufferLength / bars.length);
        const value = dataArray[dataIndex] / 255;
        const targetHeight = Math.max(0.1, value * MAX_HEIGHT);

        // Smooth transition
        const currentHeight = bars[i].scale.y;
        const newHeight = currentHeight + (targetHeight - currentHeight) * 0.3;

        bars[i].scale.y = newHeight;
        bars[i].position.y = newHeight / 2;

        // Update emissive intensity based on volume
        const material = bars[i].material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.2 + value * 0.5;
      }
    } else {
      // Idle animation when not playing
      for (let i = 0; i < bars.length; i++) {
        const wave = Math.sin(timeRef.current * 2 + i * 0.2) * 0.3 + 0.4;
        const targetHeight = wave;

        const currentHeight = bars[i].scale.y;
        const newHeight = currentHeight + (targetHeight - currentHeight) * 0.1;

        bars[i].scale.y = newHeight;
        bars[i].position.y = newHeight / 2;

        const material = bars[i].material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0.1 + wave * 0.1;
      }
    }

    // Subtle camera movement
    cameraRef.current.position.x = Math.sin(timeRef.current * 0.2) * 0.5;
    cameraRef.current.lookAt(0, 1, 0);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [isPlaying]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Initialize scene when expanded
  useEffect(() => {
    if (isExpanded) {
      // Small delay to allow container to render
      const timer = setTimeout(() => {
        initScene();
        animate();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, initScene, animate]);

  // Setup audio analyser when audio element is available
  useEffect(() => {
    if (audioElement && isExpanded) {
      setupAudioAnalyser();
    }
  }, [audioElement, isExpanded, setupAudioAnalyser]);

  // Handle resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      barsRef.current = [];
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  return (
    <div
      className={
        (isExpanded ? "w-80 min-w-[320px]" : "w-0 min-w-0 overflow-hidden opacity-0") +
        " transition-all duration-300 ease-in-out flex flex-col bg-charcoal border border-border rounded-xl"
      }
    >
      {isExpanded && (
        <>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-gold">Audio Visualizer</span>
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-text-secondary'}`} />
          </div>
          <div
            ref={containerRef}
            className="flex-1 min-h-[300px]"
            style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)' }}
          />
        </>
      )}
    </div>
  );
}

export default AudioVisualizer;
