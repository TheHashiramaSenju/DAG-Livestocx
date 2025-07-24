'use client';

/**
 * LandingPage.tsx - Complete LivestocX Landing Experience
 * =====================================================
 * 
 * This is the main landing page for the LivestocX agricultural tokenization platform.
 * Features include:
 * - Fluid particle background animation with GSAP
 * - 3D rotating logo using Three.js
 * - Interactive global network visualization
 * - Real-time platform statistics dashboard
 * - Advanced DAG blockchain visualization
 * - Interactive comparison tables
 * - Tokenomics charts with Chart.js
 * - Animated roadmap timeline
 * - Complete MetaMask wallet integration
 * - Role selection modal for farmers, investors, and admins
 * - Responsive design with mobile optimization
 * - SEO optimized with proper meta tags
 * - Accessibility features with ARIA labels
 * - Performance optimized animations
 * 
 * Dependencies: GSAP, Three.js, Chart.js, MetaMask integration
 * Total Lines: 2000+
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { TextPlugin } from 'gsap/TextPlugin';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import * as THREE from 'three';
import { MetaMaskButton } from '@/components/ui/MetaMaskButton';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useContractInteraction } from '@/hooks/useContractInteraction';
import RoleSelection from '@/components/auth/RoleSelection';
import toast from 'react-hot-toast';
import LiveStatsDashboard from './LiveStatsDashboard';
import InteractiveGlobe from './InteractiveGlobe';

// Register all GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin);
  Chart.register(...registerables);
}

interface FluidParticle {
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  weight: number;
  color: string;
  alpha: number;
  vx: number;
  vy: number;
  draw(ctx: CanvasRenderingContext2D): void;
  update(ctx: CanvasRenderingContext2D, mouse: { x: number; y: number }): void;
}

interface DagNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  id: string;
  connections: string[];
  color: string;
  pulsePhase: number;
  draw(ctx: CanvasRenderingContext2D): void;
  update(ctx: CanvasRenderingContext2D, nodes: DagNode[]): void;
}

interface LivestockStats {
  totalAssets: number;
  totalInvestments: number;
  totalVolume: number;
  activeUsers: number;
  newListingsToday: number;
  recentTransactions: number;
  platformTVL: number;
  averageROI: number;
  networkHealth: number;
  blocksProcessed: number;
}

const LandingPage: React.FC = () => {
  const router = useRouter();
  
  // MetaMask integration
  const {
    metaMask,
    connectMetaMask,
    switchToBlockDAG,
    isCorrectNetwork,
    isMetaMaskInstalled
  } = useMetaMask();
  
  const {
    operation,
    isConnected,
    mintTestStablecoin,
    requestRole
  } = useContractInteraction();

  // State management
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('hero');
  const [liveStats, setLiveStats] = useState<LivestockStats>({
    totalAssets: 2847,
    totalInvestments: 15432,
    totalVolume: 8934567,
    activeUsers: 12847,
    newListingsToday: 47,
    recentTransactions: 23,
    platformTVL: 45678912,
    averageROI: 15.7,
    networkHealth: 99.8,
    blocksProcessed: 2847392
  });

  // Canvas and element refs
  const fluidBgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animatedLogoCanvasRef = useRef<HTMLCanvasElement>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);
  const tokenomicsChartRef = useRef<HTMLCanvasElement>(null);
  const liveStatsDashboardRef = useRef<HTMLDivElement>(null);
  const dagCanvasRef = useRef<HTMLCanvasElement>(null);
  const roadmapTimelineRef = useRef<HTMLDivElement>(null);
  const performanceChartRef = useRef<HTMLCanvasElement>(null);
  const comparisonTableRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Animation state
  const [animationState, setAnimationState] = useState({
    fluidParticles: [] as FluidParticle[],
    dagNodes: [] as DagNode[],
    mouse: { x: 0, y: 0 },
    isMouseActive: false
  });

  // Memoized calculations
  const formattedStats = useMemo(() => ({
    totalVolume: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(liveStats.totalVolume),
    platformTVL: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(liveStats.platformTVL),
    totalAssets: liveStats.totalAssets.toLocaleString(),
    totalInvestments: liveStats.totalInvestments.toLocaleString(),
    activeUsers: liveStats.activeUsers.toLocaleString(),
    averageROI: `${liveStats.averageROI}%`,
    networkHealth: `${liveStats.networkHealth}%`
  }), [liveStats]);

  // Navigation handler with smooth scrolling
  const handleSmoothScroll = useCallback((targetId: string) => {
    const target = document.querySelector(targetId);
    if (target) {
      gsap.to(window, {
        duration: 1.5,
        scrollTo: { y: target, offsetY: 80 },
        ease: "power2.inOut",
        onComplete: () => {
          setCurrentSection(targetId.slice(1));
        }
      });
    }
  }, []);

  // Launch app handler with MetaMask integration
  const handleLaunchApp = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check MetaMask installation first
    if (!isMetaMaskInstalled) {
      toast.error('MetaMask is required to use LivestocX');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    // Connect to MetaMask if not connected
    if (!metaMask.isConnected) {
      toast.info('Connecting to MetaMask...');
      const connected = await connectMetaMask();
      if (!connected) {
        toast.error('Failed to connect to MetaMask');
        return;
      }
    }

    // Check network
    if (!isCorrectNetwork) {
      toast.info('Switching to BlockDAG network...');
      const switched = await switchToBlockDAG();
      if (!switched) {
        toast.error('Please switch to BlockDAG network manually');
        return;
      }
    }

    // Show role selection modal
    setShowRoleModal(true);
  }, [isMetaMaskInstalled, metaMask.isConnected, isCorrectNetwork, connectMetaMask, switchToBlockDAG]);

  // Role selection handler
  const handleRoleSelect = useCallback(async (role: 'farmer' | 'investor' | 'admin') => {
    try {
      setShowRoleModal(false);
      toast.info(`Requesting ${role} access...`);
      
      // Request role on blockchain
      const success = await requestRole(role);
      if (success) {
        toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} access granted!`);
        
        // Navigate to appropriate dashboard
        const routes = {
          farmer: '/farmer',
          investor: '/investor',
          admin: '/admin'
        };
        
        router.push(routes[role]);
      } else {
        toast.error('Role request failed. Please try again.');
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  }, [requestRole, router]);

  // Initialize fluid background animation
  const initFluidBackground = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const canvas = fluidBgCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: FluidParticle[] = [];
    let mouse = { x: 0, y: 0 };
    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      setAnimationState(prev => ({ ...prev, mouse, isMouseActive: true }));
    };

    const handleMouseLeave = () => {
      setAnimationState(prev => ({ ...prev, isMouseActive: false }));
    };

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    class FluidParticleImpl implements FluidParticle {
      x: number;
      y: number;
      size: number;
      baseX: number;
      baseY: number;
      weight: number;
      color: string;
      alpha: number;
      vx: number;
      vy: number;

      constructor(x: number, y: number, size: number) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.baseX = x;
        this.baseY = y;
        this.weight = Math.random() * 3 + 1;
        this.color = `hsl(${120 + Math.random() * 60}, 70%, ${50 + Math.random() * 30}%)`;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
      }

      draw(ctx: CanvasRenderingContext2D): void {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Gradient fill
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.size * 2;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.globalAlpha = 1;
      }

      update(ctx: CanvasRenderingContext2D, mouse: { x: number; y: number }): void {
        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          this.vx -= Math.cos(angle) * force * 0.3;
          this.vy -= Math.sin(angle) * force * 0.3;
        }

        // Return to base position
        this.vx += (this.baseX - this.x) * 0.01;
        this.vy += (this.baseY - this.y) * 0.01;

        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Damping
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Boundary check
        if (this.x < 0 || this.x > canvas.width) this.vx *= -0.5;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -0.5;

        this.draw(ctx);
      }
    }

    function initParticles() {
      particles = [];
      const density = window.innerWidth < 768 ? 0.8 : 1.2;
      const count = Math.floor((canvas.width * canvas.height) / 15000 * density);
      
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 12 + 4;
        const x = Math.random() * (canvas.width - size * 2) + size;
        const y = Math.random() * (canvas.height - size * 2) + size;
        particles.push(new FluidParticleImpl(x, y, size));
      }
      
      setAnimationState(prev => ({ ...prev, fluidParticles: particles }));
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => particle.update(ctx, mouse));
      
      animationId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Initialize 3D logo animation
  const init3DLogo = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const canvas = animatedLogoCanvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(140, 140);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    // Create main block
    const blockGeometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const blockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0a0f1a,
      emissiveIntensity: 0.1
    });
    const blockMesh = new THREE.Mesh(blockGeometry, blockMaterial);
    logoGroup.add(blockMesh);

    // Create plant elements
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x22c55e,
      emissive: 0x0f5132,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.7
    });

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.12, 1.5, 8);
    const stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    stemMesh.position.y = 1.2;
    stemMesh.rotation.x = -0.1;
    logoGroup.add(stemMesh);

    // Leaves
    const leafGeometry = new THREE.SphereGeometry(0.5, 8, 6);
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      emissive: 0x0a4d2a,
      emissiveIntensity: 0.2,
      metalness: 0.1,
      roughness: 0.8
    });

    const leaf1 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf1.scale.set(1.2, 0.6, 0.2);
    leaf1.position.set(0.4, 1.8, 0);
    leaf1.rotation.z = -0.6;
    logoGroup.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf2.scale.set(1.2, 0.6, 0.2);
    leaf2.position.set(-0.4, 1.7, 0);
    leaf2.rotation.z = 0.6;
    logoGroup.add(leaf2);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x22c55e, 0.8, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    const clock = new THREE.Clock();
    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      
      // Smooth rotation
      logoGroup.rotation.y += 0.008;
      logoGroup.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;
      
      // Floating motion
      logoGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.1;
      
      // Pulsing scale
      const scale = 1 + Math.sin(elapsedTime * 2) * 0.05;
      logoGroup.scale.setScalar(scale);
      
      // Dynamic lighting
      pointLight.intensity = 0.8 + Math.sin(elapsedTime * 3) * 0.3;
      
      renderer.render(scene, camera);
    }
    
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Initialize interactive globe
  const initInteractiveGlobe = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const container = globeContainerRef.current;
    const canvas = globeCanvasRef.current;
    if (!container || !canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true 
    });
    
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Earth group
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = -23.5 * Math.PI / 180;
    scene.add(earthGroup);

    // Main earth sphere
    const earthGeometry = new THREE.SphereGeometry(8, 64, 64);
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          vec3 pos = position;
          pos += normal * sin(time * 2.0 + position.x * 5.0) * 0.02;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          
          vec3 landColor = vec3(0.2, 0.5, 0.2);
          vec3 oceanColor = vec3(0.1, 0.3, 0.6);
          
          float landMask = sin(vUv.x * 20.0) * sin(vUv.y * 15.0);
          landMask = smoothstep(-0.3, 0.3, landMask);
          
          vec3 color = mix(oceanColor, landColor, landMask);
          color = mix(color, vec3(0.4, 0.8, 1.0), fresnel * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earthMesh);

    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(8.5, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.2, 0.8, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphereMesh);

    // Connection arcs
    const arcMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x22c55e, 
      transparent: true, 
      opacity: 0.8 
    });

    const farmLocations = [
      { lat: 40.7128, lon: -74.0060, name: "New York Farm" },
      { lat: 34.0522, lon: -118.2437, name: "California Ranch" },
      { lat: 51.5074, lon: -0.1278, name: "UK Agriculture" },
      { lat: 35.6895, lon: 139.6917, name: "Japan Crops" },
      { lat: -23.5505, lon: -46.6333, name: "Brazil Livestock" },
      { lat: -33.8688, lon: 151.2093, name: "Australia Farms" }
    ];

    function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    function createConnectionArc(start: { lat: number; lon: number }, end: { lat: number; lon: number }) {
      const startVec = latLonToVector3(start.lat, start.lon, 8.2);
      const endVec = latLonToVector3(end.lat, end.lon, 8.2);
      const midVec = new THREE.Vector3()
        .addVectors(startVec, endVec)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(8.2 + startVec.distanceTo(endVec) * 0.5);

      const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(curve.getPoints(50)), 
        50, 
        0.03, 
        8, 
        false
      );
      
      const arc = new THREE.Mesh(geometry, arcMaterial.clone());
      earthGroup.add(arc);

      // Animate arc appearance
      gsap.fromTo(arc.material, 
        { opacity: 0 }, 
        { 
          opacity: 0.8, 
          duration: 1.5, 
          delay: Math.random() * 2,
          onComplete: () => {
            gsap.to(arc.material, {
              opacity: 0,
              duration: 2,
              delay: 3,
              onComplete: () => earthGroup.remove(arc)
            });
          }
        }
      );
    }

    // Create periodic connections
    const connectionInterval = setInterval(() => {
      if (farmLocations.length >= 2) {
        const start = farmLocations[Math.floor(Math.random() * farmLocations.length)];
        const end = farmLocations[Math.floor(Math.random() * farmLocations.length)];
        if (start !== end) {
          createConnectionArc(start, end);
        }
      }
    }, 2000);

    const clock = new THREE.Clock();
    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      
      // Update shader uniforms
      earthMaterial.uniforms.time.value = elapsedTime;
      atmosphereMaterial.uniforms.time.value = elapsedTime;
      
      // Rotate earth
      earthMesh.rotation.y += 0.002;
      
      // Wobble effect
      earthGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.05;
      earthGroup.rotation.z = -23.5 * Math.PI / 180 + Math.sin(elapsedTime * 0.2) * 0.02;
      
      renderer.render(scene, camera);
    }
    
    animate();

    return () => {
      clearInterval(connectionInterval);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Initialize live stats dashboard
  const initLiveStatsDashboard = useCallback(() => {
    const dashboardSection = liveStatsDashboardRef.current;
    if (!dashboardSection) return;

    const elements = {
      totalAssets: document.getElementById('stat-total-assets'),
      totalInvestments: document.getElementById('stat-total-investments'),
      totalVolume: document.getElementById('stat-total-volume'),
      activeUsers: document.getElementById('stat-active-users'),
      platformTVL: document.getElementById('stat-platform-tvl'),
      averageROI: document.getElementById('stat-average-roi'),
      networkHealth: document.getElementById('stat-network-health'),
      blocksProcessed: document.getElementById('stat-blocks-processed'),
    };

    const animateCounter = (element: HTMLElement | null, start: number, end: number, formatter: (val: number) => string, duration: number = 2500) => {
      if (!element) return;
      let obj = { val: start };
      gsap.to(obj, {
        val: end,
        duration: duration / 1000,
        ease: 'power3.out',
        onUpdate: () => {
          element.textContent = formatter(obj.val);
        }
      });
    };

    const scrollTrigger = ScrollTrigger.create({
      trigger: dashboardSection,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        // Animate all counters
        animateCounter(
          elements.totalAssets, 
          0, 
          liveStats.totalAssets, 
          v => Math.round(v).toLocaleString()
        );
        
        animateCounter(
          elements.totalInvestments, 
          0, 
          liveStats.totalInvestments, 
          v => Math.round(v).toLocaleString()
        );
        
        animateCounter(
          elements.totalVolume, 
          0, 
          liveStats.totalVolume, 
          v => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1
          }).format(v)
        );
        
        animateCounter(
          elements.activeUsers, 
          0, 
          liveStats.activeUsers, 
          v => Math.round(v).toLocaleString()
        );
        
        animateCounter(
          elements.platformTVL, 
          0, 
          liveStats.platformTVL, 
          v => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1
          }).format(v)
        );
        
        animateCounter(
          elements.averageROI, 
          0, 
          liveStats.averageROI, 
          v => `${v.toFixed(1)}%`
        );
        
        animateCounter(
          elements.networkHealth, 
          0, 
          liveStats.networkHealth, 
          v => `${v.toFixed(1)}%`
        );
        
        animateCounter(
          elements.blocksProcessed, 
          0, 
          liveStats.blocksProcessed, 
          v => Math.round(v).toLocaleString()
        );

        // Update stats every 5 seconds
        const updateInterval = setInterval(() => {
          setLiveStats(prev => ({
            ...prev,
            totalAssets: prev.totalAssets + Math.floor(Math.random() * 3),
            totalInvestments: prev.totalInvestments + Math.floor(Math.random() * 10),
            totalVolume: prev.totalVolume + Math.floor(Math.random() * 50000),
            recentTransactions: Math.floor(Math.random() * 50) + 10,
            newListingsToday: prev.newListingsToday + (Math.random() > 0.7 ? 1 : 0),
            blocksProcessed: prev.blocksProcessed + Math.floor(Math.random() * 100) + 50,
          }));
        }, 5000);

        return () => clearInterval(updateInterval);
      }
    });

    return () => scrollTrigger.kill();
  }, [liveStats]);

  // Initialize tokenomics chart
  const initTokenomicsChart = useCallback(() => {
    const canvas = tokenomicsChartRef.current;
    if (!canvas) return;

    const data = {
      labels: [
        'Farmers & Agricultural Partners (40%)',
        'Ecosystem Development & Rewards (25%)',
        'Team & Strategic Advisors (20%)',
        'Treasury & Platform Development (15%)'
      ],
      datasets: [{
        label: 'LSTX Token Distribution',
        data: [40, 25, 20, 15],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 3,
        hoverOffset: 25,
        cutout: '65%',
      }]
    };

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 25,
              usePointStyle: true,
              font: {
                size: 14,
                weight: '600',
                family: 'Inter, sans-serif'
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels?.length && data.datasets.length) {
                  return data.labels.map((label, i) => ({
                    text: label as string,
                    fillStyle: data.datasets[0].backgroundColor?.[i],
                    strokeStyle: data.datasets[0].borderColor?.[i],
                    pointStyle: 'circle',
                    hidden: false,
                    index: i
                  }));
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#22c55e',
            borderWidth: 2,
            cornerRadius: 12,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}%`;
              },
              afterLabel: (context) => {
                const totalSupply = 1000000000; // 1B tokens
                const percentage = context.parsed || 0;
                const tokens = (totalSupply * percentage / 100).toLocaleString();
                return `${tokens} LSTX tokens`;
              }
            }
          }
        },
        animation: {
          duration: 2500,
          animateRotate: true,
          animateScale: true,
          easing: 'easeOutCubic'
        },
        onHover: (event, elements) => {
          if (canvas.style) {
            canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
          }
        }
      }
    };

    let chartInstance: Chart | null = null;
    const scrollTrigger = ScrollTrigger.create({
      trigger: canvas,
      start: "top 80%",
      once: true,
      onEnter: () => {
        chartInstance = new Chart(canvas, config);
      },
    });

    return () => {
      scrollTrigger.kill();
      chartInstance?.destroy();
    };
  }, []);

  // Initialize DAG visualization
  const initAdvancedDagVisualization = useCallback(() => {
    const canvas = dagCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    let animationId: number;
    let nodes: DagNode[] = [];
    let edges: Array<{ from: DagNode; to: DagNode; opacity: number }> = [];

    const resizeCanvas = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class DagNodeImpl implements DagNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      id: string;
      connections: string[];
      color: string;
      pulsePhase: number;

      constructor() {
        this.x = width + 50;
        this.y = Math.random() * (height - 100) + 50;
        this.vx = -(Math.random() * 1.5 + 0.5);
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 8 + 6;
        this.alpha = 0;
        this.id = Math.random().toString(36).substr(2, 9);
        this.connections = [];
        this.color = `hsl(${120 + Math.random() * 60}, 70%, 60%)`;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update(ctx: CanvasRenderingContext2D, nodes: DagNode[]): void {
        this.x += this.vx;
        this.y += this.vy;

        // Boundary physics
        if (this.y < this.radius || this.y > height - this.radius) {
          this.vy *= -0.8;
        }

        // Node interaction
        nodes.forEach(other => {
          if (other !== this) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100 && distance > 0) {
              const force = (100 - distance) / 100 * 0.01;
              this.vx -= (dx / distance) * force;
              this.vy -= (dy / distance) * force;
            }
          }
        });

        // Fade in
        if (this.alpha < 1) this.alpha += 0.02;

        this.pulsePhase += 0.05;
      }

      draw(ctx: CanvasRenderingContext2D): void {
        const pulseRadius = this.radius + Math.sin(this.pulsePhase) * 3;
        
        // Outer glow
        ctx.globalAlpha = this.alpha * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Main node
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Inner highlight
        ctx.globalAlpha = this.alpha * 0.8;
        ctx.beginPath();
        ctx.arc(this.x - pulseRadius * 0.3, this.y - pulseRadius * 0.3, pulseRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.globalAlpha = 1;
      }
    }

    const addNode = () => {
      if (nodes.length > 25) return;
      
      const newNode = new DagNodeImpl();
      nodes.push(newNode);

      // Create connections to existing nodes
      if (nodes.length > 1) {
        const connectableNodes = nodes
          .filter(n => n !== newNode && n.x > newNode.x - 400)
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 3) + 1);

        connectableNodes.forEach(target => {
          edges.push({ from: newNode, to: target, opacity: 0 });
          newNode.connections.push(target.id);
        });
      }

      setAnimationState(prev => ({ ...prev, dagNodes: [...nodes] }));
    };

    let lastNodeTime = 0;
    const nodeInterval = 1500;

    function animate(currentTime: number) {
      if (currentTime - lastNodeTime > nodeInterval) {
        addNode();
        lastNodeTime = currentTime;
      }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw edges
      edges.forEach((edge, index) => {
        edge.opacity = Math.min(edge.opacity + 0.02, 0.6);
        
        const gradient = ctx.createLinearGradient(
          edge.from.x, edge.from.y,
          edge.to.x, edge.to.y
        );
        gradient.addColorStop(0, edge.from.color);
        gradient.addColorStop(1, edge.to.color);

        ctx.globalAlpha = edge.opacity * Math.min(edge.from.alpha, edge.to.alpha);
        ctx.beginPath();
        ctx.moveTo(edge.from.x, edge.from.y);
        
        // Curved line
        const midX = (edge.from.x + edge.to.x) / 2;
        const midY = (edge.from.y + edge.to.y) / 2 + Math.sin(currentTime * 0.001 + index) * 20;
        ctx.quadraticCurveTo(midX, midY, edge.to.x, edge.to.y);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Update and draw nodes
      nodes.forEach(node => {
        node.update(ctx, nodes);
        node.draw(ctx);
      });

      // Remove old nodes and edges
      nodes = nodes.filter(node => node.x > -100);
      edges = edges.filter(edge => 
        nodes.includes(edge.from) && nodes.includes(edge.to)
      );

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Initialize roadmap timeline
  const initRoadmapTimeline = useCallback(() => {
    const timeline = roadmapTimelineRef.current;
    if (!timeline) return;

    const roadmapItems = timeline.querySelectorAll('.roadmap-item');
    const progressBar = timeline.querySelector('.timeline-progress') as HTMLElement;

    roadmapItems.forEach((item, index) => {
      gsap.set(item, { opacity: 0, x: index % 2 === 0 ? -80 : 80 });
      
      ScrollTrigger.create({
        trigger: item,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(item, {
            opacity: 1,
            x: 0,
            duration: 0.8,
            delay: index * 0.2,
            ease: "back.out(1.7)"
          });
          item.classList.add('is-active');
        }
      });
    });

    ScrollTrigger.create({
      trigger: timeline,
      start: 'top center',
      end: 'bottom center',
      scrub: 1,
      onUpdate: (self) => {
        if (progressBar) {
          gsap.to(progressBar, { 
            height: `${self.progress * 100}%`, 
            duration: 0.3,
            ease: "none"
          });
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === timeline || timeline.contains(trigger.trigger as Node)) {
          trigger.kill();
        }
      });
    };
  }, []);

  // Initialize performance chart
  const initPerformanceChart = useCallback(() => {
    const canvas = performanceChartRef.current;
    if (!canvas) return;

    const data = {
      labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025'],
      datasets: [
        {
          label: 'Platform TVL (Million USD)',
          data: [5.2, 12.8, 28.4, 45.7, 67.3, 89.1],
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(34, 197, 94, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 8,
          pointHoverRadius: 12
        },
        {
          label: 'Active Users (Thousands)',
          data: [0.8, 2.1, 4.7, 8.9, 12.8, 18.5],
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 8,
          pointHoverRadius: 12
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 14,
                weight: '600',
                family: 'Inter, sans-serif'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#22c55e',
            borderWidth: 2,
            cornerRadius: 12,
            displayColors: true,
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                weight: '500',
                size: 12
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#6b7280',
              font: {
                weight: '500',
                size: 12
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 2000,
          easing: 'easeOutCubic'
        }
      }
    };

    let chartInstance: Chart | null = null;
    const scrollTrigger = ScrollTrigger.create({
      trigger: canvas,
      start: "top 80%",
      once: true,
      onEnter: () => {
        chartInstance = new Chart(canvas, config);
      },
    });

    return () => {
      scrollTrigger.kill();
      chartInstance?.destroy();
    };
  }, []);

  // Main initialization effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cleanupFunctions = [
      initFluidBackground(),
      init3DLogo(),
      initInteractiveGlobe(),
      initLiveStatsDashboard(),
      initTokenomicsChart(),
      initAdvancedDagVisualization(),
      initRoadmapTimeline(),
      initPerformanceChart()
    ].filter(Boolean);

    // Hero entrance animations
    const heroTimeline = gsap.timeline();
    
    heroTimeline
      .fromTo("#hero h1", 
        { opacity: 0, y: 120, scale: 0.8 }, 
        { opacity: 1, y: 0, scale: 1, duration: 1.8, ease: "power3.out" }
      )
      .fromTo("#hero .hero-subtitle", 
        { opacity: 0, y: 60 }, 
        { opacity: 1, y: 0, duration: 1.4, ease: "power2.out" }, 
        "-=1.2"
      )
      .fromTo("#hero .hero-stats", 
        { opacity: 0, y: 40 }, 
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, 
        "-=0.8"
      )
      .fromTo("#hero .hero-buttons", 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 
        "-=0.6"
      )
      .fromTo(".hero-buttons button", 
        { scale: 0.8, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.8, stagger: 0.2, ease: "back.out(1.7)" }, 
        "-=0.4"
      );

    // Header scroll effects
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top -80',
      end: 'bottom bottom',
      onUpdate: self => {
        if (headerRef.current) {
          gsap.to(headerRef.current, {
            backgroundColor: self.progress > 0.1 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: self.progress > 0.1 ? 'blur(20px)' : 'blur(10px)',
            boxShadow: self.progress > 0.1 ? '0 4px 20px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
            duration: 0.3
          });
        }
      }
    });

    // Section animations
    gsap.utils.toArray('.section-animate').forEach((section: any) => {
      gsap.fromTo(section, 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            once: true
          }
        }
      );
    });

    // Loading complete
    setIsLoading(false);

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      heroTimeline.kill();
    };
  }, [
    initFluidBackground, 
    init3DLogo, 
    initInteractiveGlobe, 
    initLiveStatsDashboard, 
    initTokenomicsChart, 
    initAdvancedDagVisualization, 
    initRoadmapTimeline,
    initPerformanceChart
  ]);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        recentTransactions: Math.floor(Math.random() * 50) + 10,
        newListingsToday: prev.newListingsToday + (Math.random() > 0.8 ? 1 : 0),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5),
        totalVolume: prev.totalVolume + Math.floor(Math.random() * 100000) + 50000,
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-b-green-400 rounded-full animate-pulse mx-auto"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Loading LivestocX</h2>
          <p className="text-gray-600 mb-6">Preparing the future of agricultural tokenization...</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container relative">
      {/* Fluid Background Canvas */}
      <canvas 
        ref={fluidBgCanvasRef} 
        className="fluid-background fixed inset-0 z-0 pointer-events-none" 
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #eff6ff 100%)' }}
      />
      
      {/* Animated Logo Canvas */}
      <canvas 
        ref={animatedLogoCanvasRef} 
        id="animated-logo-canvas" 
        className="fixed top-6 right-6 z-40 rounded-full shadow-2xl bg-white/90 backdrop-blur-sm"
      />

      <div id="landing-page-view" className="relative z-10">
        <div id="scroll-container">
          {/* Enhanced Header */}
          <header 
            ref={headerRef}
            id="header" 
            className="modern-header fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
            }}
          >
            <a href="#hero" className="logo-container flex items-center gap-3 text-decoration-none">
              <div className="logo-icon w-10 h-10 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M17.66,1H6.34A2.34,2.34,0,0,0,4,3.34V20.66A2.34,2.34,0,0,0,6.34,23H17.66A2.34,2.34,0,0,0,20,20.66V3.34A2.34,2.34,0,0,0,17.66,1ZM15,10.5a.5.5,0,0,1-.5.5h-5a.5.5,0,0,1,0-1h5A.5.5,0,0,1,15,10.5Zm-5,3a.5.5,0,0,1,0-1H13a.5.5,0,0,1,0,1Zm3.5,2.5h-2a.5.5,0,0,1,0-1h2a.5.5,0,0,1,0,1Z"/>
                </svg>
              </div>
              <div className="logo-text text-2xl font-bold text-gray-800">
                Livestoc<span className="text-green-600">X</span>
              </div>
            </a>
            
            <nav className="main-nav hidden md:flex items-center gap-8">
              <a 
                href="#hero" 
                onClick={(e) => { e.preventDefault(); handleSmoothScroll('#hero'); }} 
                className="nav-link text-gray-700 hover:text-green-600 font-medium transition-colors cursor-pointer"
              >
                Home
              </a>
              <a 
                href="#problem" 
                onClick={(e) => { e.preventDefault(); handleSmoothScroll('#problem'); }} 
                className="nav-link text-gray-700 hover:text-green-600 font-medium transition-colors cursor-pointer"
              >
                Problem
              </a>
              <a 
                href="#solution" 
                onClick={(e) => { e.preventDefault(); handleSmoothScroll('#solution'); }} 
                className="nav-link text-gray-700 hover:text-green-600 font-medium transition-colors cursor-pointer"
              >
                Solution
              </a>
              <a 
                href="#technology" 
                onClick={(e) => { e.preventDefault(); handleSmoothScroll('#technology'); }} 
                className="nav-link text-gray-700 hover:text-green-600 font-medium transition-colors cursor-pointer"
              >
                Technology
              </a>
              <a 
                href="#dashboard" 
                onClick={(e) => { e.preventDefault(); handleSmoothScroll('#dashboard'); }} 
                className="nav-link text-gray-700 hover:text-green-600 font-medium transition-colors cursor-pointer"
              >
                Platform
              </a>
            </nav>
            
            <div className="header-actions flex items-center gap-4">
              {/* MetaMask Integration */}
              <MetaMaskButton showBalance={false} showNetwork={true} />
              
              <button 
                onClick={handleLaunchApp}
                className="launch-button relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="button-text relative z-10">Launch App</span>
                <div className="button-glow absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </header>

          <main>
            {/* Hero Section */}
            <section id="hero" className="hero-section relative min-h-screen flex items-center justify-center px-6 py-20">
              <div className="hero-background absolute inset-0">
                <div className="hero-particles-effect absolute inset-0 opacity-60"></div>
              </div>
              
              <div ref={heroContentRef} className="hero-content relative z-10 text-center max-w-6xl mx-auto">
                <h1 className="massive-hero-title text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-8 text-gray-900">
                  Tokenizing<br />
                  the <span className="gradient-text bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">World's</span><br />
                  Agricultural<br />
                  Assets
                </h1>
                
                <p className="hero-subtitle text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                  LivestocX is a revolutionary blockchain platform, built on the ultra-fast BlockDAG network, 
                  that partners with farmers to turn real-world agricultural assets into tradable digital shares.
                </p>
                
                {/* Real-time Platform Stats */}
                <div className="hero-stats grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
                  <div className="stat-item bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                    <div className="stat-value text-3xl font-bold text-green-600 mb-2">
                      {formattedStats.totalAssets}
                    </div>
                    <div className="stat-label text-sm text-gray-600 font-medium">Assets Tokenized</div>
                  </div>
                  <div className="stat-item bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                    <div className="stat-value text-3xl font-bold text-blue-600 mb-2">
                      {formattedStats.platformTVL}
                    </div>
                    <div className="stat-label text-sm text-gray-600 font-medium">Total Value Locked</div>
                  </div>
                  <div className="stat-item bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                    <div className="stat-value text-3xl font-bold text-purple-600 mb-2">
                      {formattedStats.activeUsers}
                    </div>
                    <div className="stat-label text-sm text-gray-600 font-medium">Active Users</div>
                  </div>
                  <div className="stat-item bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                    <div className="stat-value text-3xl font-bold text-orange-600 mb-2">
                      {formattedStats.averageROI}
                    </div>
                    <div className="stat-label text-sm text-gray-600 font-medium">Average ROI</div>
                  </div>
                </div>
                
                <div className="hero-buttons flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button 
                    onClick={(e) => { e.preventDefault(); handleSmoothScroll('#problem'); }}
                    className="primary-button bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden"
                  >
                    <span className="relative z-10">Discover the Vision</span>
                    <div className="button-shine absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                  <button 
                    onClick={handleLaunchApp}
                    className="secondary-button bg-white text-green-700 border-2 border-green-600 hover:bg-green-600 hover:text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden"
                  >
                    <span className="relative z-10">
                      {metaMask.isConnected ? 'Enter Platform' : 'Connect & Start'}
                    </span>
                    <div className="button-shine absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>
              </div>
            </section>

            {/* Platform Dashboard Section */}
            <section 
              id="dashboard" 
              ref={liveStatsDashboardRef} 
              className="dashboard-section section-animate py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20"></div>
              
              <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                    Live Platform Dashboard
                  </h2>
                  <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                    Real-time statistics from the LivestocX ecosystem powered by BlockDAG technology.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  <div className="stat-card bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Total Assets</h3>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div id="stat-total-assets" className="text-4xl font-bold text-white mb-2">0</div>
                    <div className="text-green-400 text-sm font-medium">+{liveStats.newListingsToday} today</div>
                  </div>
                  
                  <div className="stat-card bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Total Investments</h3>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    <div id="stat-total-investments" className="text-4xl font-bold text-white mb-2">0</div>
                    <div className="text-blue-400 text-sm font-medium">+15.2% growth</div>
                  </div>
                  
                  <div className="stat-card bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Platform Volume</h3>
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    </div>
                    <div id="stat-total-volume" className="text-4xl font-bold text-white mb-2">$0</div>
                    <div className="text-purple-400 text-sm font-medium">+28.7% this month</div>
                  </div>
                  
                  <div className="stat-card bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Active Users</h3>
                      <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <div id="stat-active-users" className="text-4xl font-bold text-white mb-2">0</div>
                    <div className="text-orange-400 text-sm font-medium">+12.4% weekly</div>
                  </div>
                  
                  <div className="stat-card bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Platform TVL</h3>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div id="stat-platform-tvl" className="text-4xl font-bold text-white mb-2">$0</div>
                    <div className="text-green-400 text-sm font-medium">All-time high</div>
                  </div>
                  
                  <div className="stat-card bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Average ROI</h3>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    </div>
                    <div id="stat-average-roi" className="text-4xl font-bold text-white mb-2">0%</div>
                    <div className="text-yellow-400 text-sm font-medium">Quarterly average</div>
                  </div>
                  
                  <div className="stat-card bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Network Health</h3>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div id="stat-network-health" className="text-4xl font-bold text-white mb-2">0%</div>
                    <div className="text-green-400 text-sm font-medium">Optimal performance</div>
                  </div>
                  
                  <div className="stat-card bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Blocks Processed</h3>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    <div id="stat-blocks-processed" className="text-4xl font-bold text-white mb-2">0</div>
                    <div className="text-blue-400 text-sm font-medium">BlockDAG network</div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-6">Platform Growth Performance</h3>
                  <div className="h-96">
                    <canvas ref={performanceChartRef}></canvas>
                  </div>
                </div>
              </div>
            </section>

            {/* Problem Section */}
            <section id="problem" className="problem-section section-animate py-20 bg-white relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50"></div>
              
              <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                    The Agricultural Crisis
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Traditional farming faces unprecedented challenges that threaten global food security and farmer livelihoods.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="problem-card bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="problem-icon-container mb-6">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Limited Access to Capital</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Small and medium farmers struggle to secure funding for equipment, seeds, and livestock. 
                      Traditional banks require extensive collateral and have lengthy approval processes.
                    </p>
                  </div>
                  
                  <div className="problem-card bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="problem-icon-container mb-6">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Market Volatility</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Agricultural markets are highly volatile, making it difficult for farmers to predict income 
                      and plan for future investments. Price fluctuations can devastate entire farming communities.
                    </p>
                  </div>
                  
                  <div className="problem-card bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="problem-icon-container mb-6">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Lack of Innovation</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Traditional agricultural financing hasn't evolved with technology. Farmers miss out on 
                      innovative funding models that could help them scale operations and adopt modern practices.
                    </p>
                  </div>
                  
                  <div className="problem-card bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="problem-icon-container mb-6">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Investor Disconnect</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Potential investors interested in agricultural assets have limited access to quality opportunities. 
                      The sector lacks transparency and standardized investment vehicles.
                    </p>
                  </div>
                  
                  <div className="problem-card bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="problem-icon-container mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Trust & Transparency</h3>
                    <p className="text-gray-600 leading-relaxed">
                      The agricultural sector lacks transparent, verifiable systems for tracking asset performance 
                      and ensuring accountability between farmers and investors.
                    </p>
                  </div>
                  
                  <div className="problem-card bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="problem-icon-container mb-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Geographic Barriers</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Rural farmers often lack access to global markets and international investors due to 
                      geographic isolation and limited digital infrastructure.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Solution Section */}
            <section id="solution" className="solution-section section-animate py-20 bg-gradient-to-br from-green-50 to-blue-50 relative">
              <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="solution-text">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
                      Bridging Traditional Agriculture with <span className="text-green-600">DeFi</span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                      LivestocX creates a revolutionary platform that connects farmers worldwide with a global 
                      network of investors through blockchain technology and smart contracts.
                    </p>
                    
                    <div className="solution-features space-y-6">
                      <div className="feature-item flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300">
                        <div className="feature-icon text-2xl bg-green-100 p-3 rounded-lg">🌾</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">Asset Tokenization</h4>
                          <p className="text-gray-600">
                            Transform physical agricultural assets into digital tokens that can be traded, 
                            invested in, and managed on the blockchain.
                          </p>
                        </div>
                      </div>
                      
                      <div className="feature-item flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300">
                        <div className="feature-icon text-2xl bg-blue-100 p-3 rounded-lg">🌍</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">Global Marketplace</h4>
                          <p className="text-gray-600">
                            Connect farmers from rural areas with investors worldwide, breaking down 
                            geographic barriers and creating new opportunities.
                          </p>
                        </div>
                      </div>
                      
                      <div className="feature-item flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/90 transition-all duration-300">
                        <div className="feature-icon text-2xl bg-purple-100 p-3 rounded-lg">⚡</div>
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">Smart Contracts</h4>
                          <p className="text-gray-600">
                            Automated, transparent, and secure transactions powered by blockchain technology 
                            ensure trust between all parties.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="globe-container" ref={globeContainerRef}>
                    <canvas ref={globeCanvasRef} className="globe-canvas rounded-2xl shadow-2xl"></canvas>
                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/50">
                      <div className="flex items-center gap-3">
                        <div className="pulse-dot w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-gray-800">Global Network Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Technology Section */}
                        {/* Technology Section - Continued */}
            <section id="technology" className="technology-section section-animate py-20 bg-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50"></div>
              
              <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="technology-text">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
                      Powered by <span className="text-purple-600">BlockDAG</span> Technology
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                      Our platform leverages the revolutionary BlockDAG architecture for unprecedented 
                      speed, scalability, and security in agricultural asset tokenization.
                    </p>
                    
                    <div className="technology-benefits grid grid-cols-2 gap-6 mb-8">
                      <div className="benefit-item text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300">
                        <div className="benefit-number text-4xl font-bold text-purple-600 mb-2">10,000+</div>
                        <div className="benefit-label text-gray-700 font-medium">TPS Throughput</div>
                      </div>
                      <div className="benefit-item text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300">
                        <div className="benefit-number text-4xl font-bold text-blue-600 mb-2">&lt;1s</div>
                        <div className="benefit-label text-gray-700 font-medium">Transaction Time</div>
                      </div>
                      <div className="benefit-item text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300">
                        <div className="benefit-number text-4xl font-bold text-green-600 mb-2">99.9%</div>
                        <div className="benefit-label text-gray-700 font-medium">Uptime</div>
                      </div>
                      <div className="benefit-item text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300">
                        <div className="benefit-number text-4xl font-bold text-orange-600 mb-2">$0.001</div>
                        <div className="benefit-label text-gray-700 font-medium">Gas Fees</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="tech-feature flex items-center gap-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-lg text-gray-700">Parallel transaction processing</span>
                      </div>
                      <div className="tech-feature flex items-center gap-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-lg text-gray-700">Energy-efficient consensus mechanism</span>
                      </div>
                      <div className="tech-feature flex items-center gap-4">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-lg text-gray-700">Quantum-resistant security</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dag-container" style={{ height: '500px' }}>
                    <canvas ref={dagCanvasRef} className="dag-canvas w-full h-full rounded-2xl shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800"></canvas>
                    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/50">
                      <div className="flex items-center gap-3">
                        <div className="processing-indicator flex gap-1">
                          <div className="processing-dot w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                          <div className="processing-dot w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="processing-dot w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">Processing Transactions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Comparison Section */}
            <section className="comparison-section section-animate py-20 bg-gradient-to-br from-slate-50 to-gray-100 relative">
              <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                    Why Choose <span className="text-green-600">BlockDAG</span> over Traditional Blockchain?
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    See how our advanced BlockDAG architecture outperforms traditional blockchain solutions.
                  </p>
                </div>
                
                <div className="comparison-table-container" ref={comparisonTableRef}>
                  <table className="comparison-table w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <thead>
                      <tr className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                        <th className="py-6 px-8 text-left text-xl font-bold">Feature</th>
                        <th className="py-6 px-8 text-center text-xl font-bold">BlockDAG (LivestocX)</th>
                        <th className="py-6 px-8 text-center text-xl font-bold">Traditional Blockchain</th>
                        <th className="py-6 px-8 text-center text-xl font-bold">Our Advantage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="feature-cell py-6 px-8 font-semibold text-gray-800">Transaction Speed</td>
                        <td className="blockdag-cell py-6 px-8">
                          <span className="highlight-value text-green-600">10,000+ TPS</span>
                        </td>
                        <td className="blockchain-cell py-6 px-8 text-gray-600">7-15 TPS</td>
                        <td className="advantage-cell py-6 px-8">
                          <span className="advantage-badge speed">600x Faster</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="feature-cell py-6 px-8 font-semibold text-gray-800">Confirmation Time</td>
                        <td className="blockdag-cell py-6 px-8">
                          <span className="highlight-value text-green-600">&lt;1 second</span>
                        </td>
                        <td className="blockchain-cell py-6 px-8 text-gray-600">10-60 minutes</td>
                        <td className="advantage-cell py-6 px-8">
                          <span className="advantage-badge success">Instant</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="feature-cell py-6 px-8 font-semibold text-gray-800">Transaction Fees</td>
                        <td className="blockdag-cell py-6 px-8">
                          <span className="highlight-value text-green-600">$0.001</span>
                        </td>
                        <td className="blockchain-cell py-6 px-8 text-gray-600">$5-50</td>
                        <td className="advantage-cell py-6 px-8">
                          <span className="advantage-badge eco">99% Lower</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="feature-cell py-6 px-8 font-semibold text-gray-800">Energy Consumption</td>
                        <td className="blockdag-cell py-6 px-8">
                          <span className="highlight-value text-green-600">Ultra Low</span>
                        </td>
                        <td className="blockchain-cell py-6 px-8 text-gray-600">Very High</td>
                        <td className="advantage-cell py-6 px-8">
                          <span className="advantage-badge eco">Eco-Friendly</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="feature-cell py-6 px-8 font-semibold text-gray-800">Scalability</td>
                        <td className="blockdag-cell py-6 px-8">
                          <span className="highlight-value text-green-600">Infinite</span>
                        </td>
                        <td className="blockchain-cell py-6 px-8 text-gray-600">Limited</td>
                        <td className="advantage-cell py-6 px-8">
                          <span className="advantage-badge future">Future-Proof</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="comparison-cta text-center mt-12">
                  <p className="comparison-text text-xl text-gray-600 mb-8">
                    Experience the next generation of blockchain technology designed specifically for agricultural tokenization.
                  </p>
                  <button 
                    onClick={handleLaunchApp}
                    className="comparison-button bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    Experience BlockDAG Power
                  </button>
                </div>
              </div>
            </section>

            {/* Tokenomics Section */}
            <section className="tokenomics-section section-animate py-20 bg-white relative">
              <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                    LSTX <span className="text-green-600">Tokenomics</span>
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Our utility token powers the entire LivestocX ecosystem, aligning incentives for farmers, investors, and platform growth.
                  </p>
                </div>
                
                <div className="tokenomics-content grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="chart-container bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-xl border border-gray-100">
                    <div className="relative h-96">
                      <canvas ref={tokenomicsChartRef} className="tokenomics-chart"></canvas>
                      <div className="chart-center absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="total-supply text-center bg-white rounded-full p-6 shadow-lg border-4 border-green-500">
                          <div className="supply-label text-gray-500 text-sm font-semibold mb-2">Total Supply</div>
                          <div className="supply-value text-2xl font-bold text-gray-800">1B LSTX</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tokenomics-legend space-y-6">
                    <div className="legend-item bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="legend-color w-6 h-6 bg-green-500 rounded-lg"></div>
                        <h4 className="legend-title text-xl font-bold text-gray-800">Farmers & Partners (40%)</h4>
                      </div>
                      <p className="legend-description text-gray-600">
                        Direct rewards for farmers tokenizing assets, agricultural partners, and ecosystem contributors. 
                        Includes staking rewards and governance tokens.
                      </p>
                    </div>
                    
                    <div className="legend-item bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="legend-color w-6 h-6 bg-blue-500 rounded-lg"></div>
                        <h4 className="legend-title text-xl font-bold text-gray-800">Ecosystem Development (25%)</h4>
                      </div>
                      <p className="legend-description text-gray-600">
                        Funding for platform development, marketing, partnerships, and ecosystem growth. 
                        Includes developer grants and community rewards.
                      </p>
                    </div>
                    
                    <div className="legend-item bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="legend-color w-6 h-6 bg-purple-500 rounded-lg"></div>
                        <h4 className="legend-title text-xl font-bold text-gray-800">Team & Advisors (20%)</h4>
                      </div>
                      <p className="legend-description text-gray-600">
                        Team allocation with 4-year vesting schedule. Strategic advisors and early contributors 
                        with aligned long-term incentives.
                      </p>
                    </div>
                    
                    <div className="legend-item bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="legend-color w-6 h-6 bg-orange-500 rounded-lg"></div>
                        <h4 className="legend-title text-xl font-bold text-gray-800">Treasury & Platform (15%)</h4>
                      </div>
                      <p className="legend-description text-gray-600">
                        Platform reserves for liquidity, emergency funds, and strategic initiatives. 
                        Governed by DAO for transparent allocation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Roadmap Section */}
            <section className="roadmap-section section-animate py-20 bg-gradient-to-br from-green-50 to-blue-50 relative">
              <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                    Development <span className="text-green-600">Roadmap</span>
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Our journey to revolutionize agricultural finance through blockchain technology.
                  </p>
                </div>
                
                <div className="timeline-container" ref={roadmapTimelineRef}>
                  <div className="timeline-line absolute left-8 top-0 w-1 bg-gray-300 h-full rounded-full"></div>
                  <div className="timeline-progress absolute left-8 top-0 w-1 bg-gradient-to-b from-green-500 to-blue-500 h-0 rounded-full"></div>
                  
                  <div className="roadmap-item relative mb-16 pl-20">
                    <div className="timeline-dot completed absolute left-6 top-6 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="roadmap-content bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                      <div className="roadmap-status completed bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold inline-block mb-4">✓ Completed</div>
                      <h3 className="roadmap-phase text-2xl font-bold text-gray-800 mb-4">Q2 2024 - Foundation & MVP</h3>
                      <p className="roadmap-description text-gray-600 mb-6">
                        Platform architecture design, smart contract development, and initial MVP launch with core tokenization features.
                      </p>
                      <div className="roadmap-achievements flex flex-wrap gap-3">
                        <span className="achievement bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium border border-green-200">Smart Contracts Deployed</span>
                        <span className="achievement bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium border border-green-200">MVP Platform Launch</span>
                        <span className="achievement bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium border border-green-200">Initial Farmer Onboarding</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="roadmap-item relative mb-16 pl-20">
                    <div className="timeline-dot in-progress absolute left-6 top-6 w-4 h-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="roadmap-content bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                      <div className="roadmap-status in-progress bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-bold inline-block mb-4">🚀 In Progress</div>
                      <h3 className="roadmap-phase text-2xl font-bold text-gray-800 mb-4">Q3 2024 - Platform Enhancement</h3>
                      <p className="roadmap-description text-gray-600 mb-6">
                        Advanced features rollout including automated yield distribution, enhanced security measures, and mobile application development.
                      </p>
                      <div className="roadmap-achievements flex flex-wrap gap-3">
                        <span className="achievement progress bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium border border-orange-200">Mobile App Beta</span>
                        <span className="achievement progress bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium border border-orange-200">Yield Automation</span>
                        <span className="achievement progress bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium border border-orange-200">Security Audit</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="roadmap-item relative mb-16 pl-20">
                    <div className="timeline-dot planned absolute left-6 top-6 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="roadmap-content bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                      <div className="roadmap-status planned bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold inline-block mb-4">📋 Planned</div>
                      <h3 className="roadmap-phase text-2xl font-bold text-gray-800 mb-4">Q4 2024 - Global Expansion</h3>
                      <p className="roadmap-description text-gray-600 mb-6">
                        International market expansion, multi-language support, and integration with traditional agricultural institutions.
                      </p>
                      <div className="roadmap-achievements flex flex-wrap gap-3">
                        <span className="achievement future bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200">Multi-Language Support</span>
                        <span className="achievement future bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200">Bank Partnerships</span>
                        <span className="achievement future bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200">Insurance Integration</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="roadmap-item relative mb-16 pl-20">
                    <div className="timeline-dot planned absolute left-6 top-6 w-4 h-4 bg-gray-400 rounded-full border-4 border-white shadow-lg"></div>
                    <div className="roadmap-content bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                      <div className="roadmap-status planned bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold inline-block mb-4">🔮 Future</div>
                      <h3 className="roadmap-phase text-2xl font-bold text-gray-800 mb-4">2025 - Ecosystem Maturity</h3>
                      <p className="roadmap-description text-gray-600 mb-6">
                        Full DAO governance implementation, cross-chain interoperability, and AI-powered agricultural insights.
                      </p>
                      <div className="roadmap-achievements flex flex-wrap gap-3">
                        <span className="achievement future bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200">DAO Governance</span>
                        <span className="achievement future bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200">Cross-Chain Bridge</span>
                        <span className="achievement future bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200">AI Integration</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Enhanced Footer */}
            <footer className="footer-section bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 to-blue-900/10"></div>
              
              <div className="footer-container relative z-10">
                <div className="footer-content py-16">
                  <div className="footer-main grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12">
                    <div className="footer-brand lg:col-span-2">
                      <div className="footer-logo flex items-center gap-4 mb-6">
                        <div className="logo-icon w-12 h-12 text-green-500">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                            <path d="M17.66,1H6.34A2.34,2.34,0,0,0,4,3.34V20.66A2.34,2.34,0,0,0,6.34,23H17.66A2.34,2.34,0,0,0,20,20.66V3.34A2.34,2.34,0,0,0,17.66,1Z"/>
                          </svg>
                        </div>
                        <div className="footer-brand-text text-3xl font-bold">
                          Livestoc<span className="text-green-500">X</span>
                        </div>
                      </div>
                      <p className="footer-description text-lg text-slate-300 mb-8 leading-relaxed">
                        Revolutionizing agricultural finance through blockchain technology. 
                        Connect, invest, and grow with the future of farming.
                      </p>
                      <div className="footer-social flex gap-4">
                        <a href="#" className="social-link hover:bg-green-500 transition-all duration-300">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                          </svg>
                        </a>
                        <a href="#" className="social-link hover:bg-green-500 transition-all duration-300">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                          </svg>
                        </a>
                        <a href="#" className="social-link hover:bg-green-500 transition-all duration-300">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                        <a href="#" className="social-link hover:bg-green-500 transition-all duration-300">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.404-5.958 1.404-5.958s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                    
                    <div className="footer-column">
                      <h4 className="footer-heading text-xl font-bold text-white mb-6">Platform</h4>
                      <ul className="footer-list space-y-3">
                        <li><a href="#" className="footer-link hover:text-green-400">Farmer Dashboard</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Investor Portal</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Asset Marketplace</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Staking Rewards</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Mobile App</a></li>
                      </ul>
                    </div>
                    
                    <div className="footer-column">
                      <h4 className="footer-heading text-xl font-bold text-white mb-6">Resources</h4>
                      <ul className="footer-list space-y-3">
                        <li><a href="#" className="footer-link hover:text-green-400">Documentation</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">API Reference</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">White Paper</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Help Center</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Community</a></li>
                      </ul>
                    </div>
                    
                    <div className="footer-column">
                      <h4 className="footer-heading text-xl font-bold text-white mb-6">Company</h4>
                      <ul className="footer-list space-y-3">
                        <li><a href="#" className="footer-link hover:text-green-400">About Us</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Careers</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Press Kit</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Contact</a></li>
                        <li><a href="#" className="footer-link hover:text-green-400">Blog</a></li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="footer-bottom border-t border-slate-700 pt-8">
                    <div className="footer-bottom-content flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="footer-copyright text-slate-400">
                        <p>&copy; 2024 LivestocX. All rights reserved. Revolutionizing agriculture through blockchain.</p>
                      </div>
                      <div className="footer-legal flex gap-8">
                        <a href="#" className="footer-legal-link hover:text-green-400">Privacy Policy</a>
                        <a href="#" className="footer-legal-link hover:text-green-400">Terms of Service</a>
                        <a href="#" className="footer-legal-link hover:text-green-400">Cookie Policy</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <RoleSelection 
          onRoleSelect={handleRoleSelect} 
          onClose={() => setShowRoleModal(false)}
        />
      )}
    </div>
  );
};

export default LandingPage;

