'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo
} from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MetaMaskButton } from '@/components/ui/MetaMaskButton';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useContractInteraction } from '@/hooks/useContractInteraction';
import RoleSelection from '@/components/auth/RoleSelection';

// Safe dynamic imports
let gsap: any = null;
let ScrollTrigger: any = null;
let Chart: any = null;
let THREE: any = null;

if (typeof window !== 'undefined') {
  (async () => {
    try {
      const gsapMod = await import('gsap');
      const scrollMod = await import('gsap/ScrollTrigger');
      const chartMod = await import('chart.js/auto');
      const threeMod = await import('three');
      gsap = gsapMod.gsap || gsapMod.default || gsapMod;
      ScrollTrigger = scrollMod.ScrollTrigger;
      Chart = chartMod.Chart || chartMod.default || chartMod;
      THREE = threeMod;
      gsap.registerPlugin?.(ScrollTrigger);
    } catch {
      console.warn('Dynamic libraries failed to load');
    }
  })();
}

interface LandingPageProps {
  onRoleSelect: (role: 'farmer' | 'investor' | 'admin') => void;
}

interface LivestockStats {
  totalLivestock: number;
  totalInvestments: number;
  totalVolume: number;
  activeUsers: number;
  newListingsToday: number;
  recentTransactions: number;
  platformTVL: number;
  averageROI: number;
  networkHealth: number;
  blocksProcessed: number;
  bdagPrice: number;
  bdagChange24h: number;
  marketCap: number;
  tradingVolume: number;
  circulatingSupply: number;
  stakingAPY: number;
}

interface TokenomicsSegment {
  label: string;
  percentage: number;
  amount: string;
  color: string;
  description: string;
  features: string[];
  allocation: number;
}

interface RoadmapPhase {
  quarter: string;
  year: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'future';
  progress: number;
  milestones: string[];
  budget: string;
  timeline: string;
}

interface ChainFeature {
  name: string;
  description: string;
  icon: string;
  tech: string;
  benefits: string[];
  specs: string[];
}

interface ComparisonRow {
  feature: string;
  traditional: string;
  livestocx: string;
  improvement: string;
  impact: 'high' | 'medium' | 'low';
  category: 'access' | 'cost' | 'speed' | 'transparency' | 'security';
}

const LandingPage: React.FC<LandingPageProps> = ({ onRoleSelect }) => {
  const router = useRouter();
  const {
    metaMask,
    connectMetaMask,
    isCorrectNetwork,
    isMetaMaskInstalled
  } = useMetaMask();
  const { isConnected } = useContractInteraction();

  // State management
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('hero');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTokenomicsSegment, setActiveTokenomicsSegment] = useState(0);
  const [activeChainFeature, setActiveChainFeature] = useState(0);
  const [activeRoadmapPhase, setActiveRoadmapPhase] = useState(0);
  const [marketDataConnected, setMarketDataConnected] = useState(true);

  const [liveStats, setLiveStats] = useState<LivestockStats>({
    totalLivestock: 45672,
    totalInvestments: 28543,
    totalVolume: 156789432,
    activeUsers: 34521,
    newListingsToday: 47,
    recentTransactions: 23,
    platformTVL: 89456123,
    averageROI: 18.7,
    networkHealth: 99.8,
    blocksProcessed: 2847392,
    bdagPrice: 0.0247,
    bdagChange24h: 12.34,
    marketCap: 24700000,
    tradingVolume: 2340000,
    circulatingSupply: 1000000000,
    stakingAPY: 15.6
  });

  // Refs for animations & visuals
  const heroContentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const fluidBgCanvasRef = useRef<HTMLCanvasElement>(null);
  const logoCanvasRef = useRef<HTMLCanvasElement>(null);
  const tokenomicsChartRef = useRef<HTMLCanvasElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const chainVisualizationRef = useRef<HTMLDivElement>(null);
  const marketWidgetRef = useRef<HTMLDivElement>(null);
  const comparisonTableRef = useRef<HTMLDivElement>(null);

  // Tokenomics data
  const tokenomicsData: TokenomicsSegment[] = useMemo(
    () => [
      {
        label: 'Livestock Farmers & Ranchers',
        percentage: 40,
        amount: '400M LSTX',
        color: '#22c55e',
        description:
          'Direct rewards for livestock farmers tokenizing cattle, sheep, poultry, and other livestock assets with health monitoring integration.',
        features: [
          'Cattle tokenization rewards',
          'Livestock health monitoring',
          'Breeding program incentives',
          'Feed optimization bonuses'
        ],
        allocation: 400000000
      },
      {
        label: 'Livestock Investors & Trading',
        percentage: 25,
        amount: '250M LSTX',
        color: '#3b82f6',
        description:
          'Allocation for investors participating in livestock asset trading, yield farming, and staking on the LivestocX platform.',
        features: [
          'Livestock trading fees',
          'Yield farming rewards',
          'Staking benefits',
          'Premium access',
          'Insurance rewards'
        ],
        allocation: 250000000
      },
      {
        label: 'Platform & Technology Development',
        percentage: 20,
        amount: '200M LSTX',
        color: '#8b5cf6',
        description:
          'Team allocation with 4-year vesting for platform development, livestock IoT integration, and veterinary technology advancement.',
        features: [
          'IoT livestock tracking',
          'AI health monitoring',
          'Veterinary tools',
          'Blockchain development',
          'Mobile apps'
        ],
        allocation: 200000000
      },
      {
        label: 'Ecosystem & Livestock Insurance',
        percentage: 15,
        amount: '150M LSTX',
        color: '#f59e0b',
        description:
          'Treasury reserves for livestock insurance pool, emergency veterinary funds, research grants, and ecosystem growth initiatives.',
        features: [
          'Livestock insurance pool',
          'Emergency veterinary fund',
          'Research grants',
          'Partnership incentives',
          'Risk management'
        ],
        allocation: 150000000
      }
    ],
    []
  );

  // Roadmap phases
  const roadmapPhases: RoadmapPhase[] = useMemo(
    () => [
      {
        quarter: 'Q2',
        year: 2024,
        title: 'Livestock Tokenization Launch',
        description:
          'Launch core livestock tokenization platform with cattle, poultry, and sheep support including health monitoring systems.',
        status: 'completed',
        progress: 100,
        milestones: [
          'Cattle tokenization smart contracts deployed',
          'Poultry farm IoT integrations completed',
          '500+ livestock farmers onboarded globally',
          'Real-time livestock health tracking system',
          'Veterinary partnership network established'
        ],
        budget: '$2.5M',
        timeline: 'April - June 2024'
      },
      // ... remaining phases ...
    ],
    []
  );

  // Chain features
  const chainFeatures: ChainFeature[] = useMemo(
    () => [
      {
        name: 'SHA3 Keccak-256 Security',
        description:
          'Advanced cryptographic security specifically designed for livestock asset transactions and health data protection.',
        icon: '🔐',
        tech: 'SHA3-256 Cryptography',
        benefits: [
          'Quantum-resistant livestock data security',
          'Tamper-proof livestock health records',
          'Secure veterinary transaction validation',
          'Protected genetic and breeding information'
        ],
        specs: [
          '256-bit hash functions',
          'Livestock data integrity verification',
          'Veterinary record authentication',
          'Breeding data protection protocols'
        ]
      },
      // ... other features ...
    ],
    []
  );

  // Comparison data
  const comparisonData: ComparisonRow[] = useMemo(
    () => [
      {
        feature: 'Livestock Investment Access',
        traditional: 'Limited to local cattle/livestock markets',
        livestocx: 'Global livestock investment marketplace',
        improvement: '1000x Geographic Reach',
        impact: 'high',
        category: 'access'
      },
      // ... more rows ...
    ],
    []
  );

  // Formatted stats
  const formattedStats = useMemo(
    () => ({
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
      totalLivestock: liveStats.totalLivestock.toLocaleString(),
      activeUsers: liveStats.activeUsers.toLocaleString(),
      averageROI: `${liveStats.averageROI}%`,
      networkHealth: `${liveStats.networkHealth}%`,
      bdagPrice: `$${liveStats.bdagPrice.toFixed(4)}`,
      bdagChange: `${
        liveStats.bdagChange24h > 0 ? '+' : ''
      }${liveStats.bdagChange24h.toFixed(2)}%`,
      marketCap: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(liveStats.marketCap),
      tradingVolume: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(liveStats.tradingVolume),
      stakingAPY: `${liveStats.stakingAPY.toFixed(1)}%`
    }),
    [liveStats]
  );

  // Smooth scroll handler
  const handleSmoothScroll = useCallback((targetId: string) => {
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentSection(targetId.slice(1));
    }
  }, []);

  // Launch dApp handler with MetaMask integration
  const handleLaunchApp = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      toast.error(
        'MetaMask is required to access the LivestocX livestock platform'
      );
      window.open('https://metamask.io/download/', '_blank');
      return;
    }


    if (!metaMask?.isConnected) {
      toast.loading('Connecting to MetaMask...');
      const connected = await connectMetaMask();
      toast.dismiss();
    
      if (!connected) {                        // ← ADDED “{”
        toast.error('Failed to connect to MetaMask.');
        return;                                // ← now inside braces
      }                                        // ← ADDED “}”
    
      toast.success('MetaMask connected');
    }



    if (!isCorrectNetwork) {
      toast('Please switch to the LivestocX network for trading.');
      return;
    }

    setShowRoleModal(true);
  }, [
    isMetaMaskInstalled,
    metaMask?.isConnected,   // ← NEW
    connectMetaMask,         // ← NEW
    isCorrectNetwork         // ← NEW
  ]);


  // Role-selection handler
  const handleRoleSelect = useCallback(
    async (role: 'farmer' | 'investor' | 'admin') => {
      try {
        setShowRoleModal(false);
        toast.loading(`Requesting ${role} access…`);
        const success = true; // mock until requestRole() is implemented
        if (success) {
          toast.dismiss();
          toast.success(
            `${role.charAt(0).toUpperCase() + role.slice(1)} access granted`
          );
          onRoleSelect(role);
        } else {
          toast.dismiss();
          toast.error('Role request failed. Please try again.');
        }
      } catch (err: any) {
        toast.dismiss();
        toast.error(`Error: ${err?.message || 'Unknown error'}`);
      }
    },
    [onRoleSelect]
  );

  /* --------------------------------------------------
     Animation / visual-initialisers
  -------------------------------------------------- */

  // Fluid-background particle field
  const initEnhancedBackground = useCallback(() => {
    const canvas = fluidBgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      hue: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(
        50,
        Math.floor((canvas.width * canvas.height) / 20000)
      );
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          alpha: Math.random() * 0.5 + 0.2,
          hue: 120 + Math.random() * 60
        });
      }
    };

    const animate = () => {
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, '#f0fdf4');
      g.addColorStop(0.3, '#ffffff');
      g.addColorStop(0.7, '#eff6ff');
      g.addColorStop(1, '#f0f9ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `hsla(${p.hue},70%,60%,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Corner logo
  const initLivestockLogo = useCallback(() => {
    const canvas = logoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 80;
    canvas.height = 80;
    let rotation = 0;

    const draw = () => {
      ctx.clearRect(0, 0, 80, 80);
      ctx.save();
      ctx.translate(40, 40);
      ctx.rotate(rotation);
      ctx.fillStyle = '#22c55e';
      (ctx as any).roundRect?.(-30, -30, 60, 60, 15);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐄', 0, 0);
      ctx.restore();
      rotation += 0.01;
      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  // Doughnut-chart
  const initEnhancedTokenomicsChart = useCallback(() => {
    const canvas = tokenomicsChartRef.current;
    if (!canvas || !Chart) return;
    const data = {
      labels: tokenomicsData.map(t => `${t.label} (${t.percentage}%)`),
      datasets: [
        {
          data: tokenomicsData.map(t => t.percentage),
          backgroundColor: tokenomicsData.map(t => t.color + 'CC'),
          borderColor: tokenomicsData.map(t => t.color),
          borderWidth: 3,
          hoverOffset: 25,
          cutout: '60%'
        }
      ]
    };
    const config = {
      type: 'doughnut' as const,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#22c55e',
            borderWidth: 2,
            cornerRadius: 12,
            padding: 15,
            callbacks: {
              title: () => 'LivestocX Tokenomics',
              label: (ctx: any) => {
                const s = tokenomicsData[ctx.dataIndex];
                return [
                  `${s.label}: ${s.percentage}%`,
                  `Amount: ${s.amount}`,
                  `Allocation: ${s.allocation.toLocaleString()} LSTX`
                ];
              },
              afterLabel: (ctx: any) => {
                const s = tokenomicsData[ctx.dataIndex];
                return [`Focus: ${s.description.slice(0, 60)}…`];
              }
            }
          }
        }
      }
    };
    const chart = new Chart(canvas, config as any);
    return () => chart.destroy();
  }, [tokenomicsData]);

  /* --------------------------------------------------
     Live-stats tickers
  -------------------------------------------------- */
  const updateLivestockMarketData = useCallback(() => {
    setLiveStats(prev => {
      const priceDelta = (Math.random() - 0.5) * 0.003;
      const newPrice = Math.max(0.001, prev.bdagPrice + priceDelta);
      const pctChange = ((newPrice - prev.bdagPrice) / prev.bdagPrice) * 100;
      return {
        ...prev,
        bdagPrice: newPrice,
        bdagChange24h: prev.bdagChange24h * 0.9 + pctChange * 0.1,
        marketCap: newPrice * prev.circulatingSupply,
        tradingVolume: prev.tradingVolume * (0.97 + Math.random() * 0.06),
        totalLivestock: prev.totalLivestock + Math.floor(Math.random() * 5),
        totalInvestments: prev.totalInvestments + Math.floor(Math.random() * 8),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3),
        platformTVL: prev.platformTVL * (0.999 + Math.random() * 0.002),
        stakingAPY: Math.max(
          5,
          Math.min(
            25,
            prev.stakingAPY + (Math.random() - 0.5) * 0.2
          )
        )
      };
    });
  }, []);

  // Auto-rotate helpers
  const rotateTokenomics = useCallback(
    () =>
      setActiveTokenomicsSegment(
        prev => (prev + 1) % tokenomicsData.length
      ),
    [tokenomicsData.length]
  );
  const rotateChainFeatures = useCallback(
    () =>
      setActiveChainFeature(prev => (prev + 1) % chainFeatures.length),
    [chainFeatures.length]
  );
  const rotateRoadmapPhases = useCallback(
    () =>
      setActiveRoadmapPhase(prev => (prev + 1) % roadmapPhases.length),
    [roadmapPhases.length]
  );

  /* --------------------------------------------------
     Mount-time effects
  -------------------------------------------------- */
  useEffect(() => {
    let mounted = true;
    const cleanups: Array<() => void> = [];

    const start = () => {
      if (!mounted) return;

      const bg   = initEnhancedBackground();
      const logo = initLivestockLogo();
      if (bg)   cleanups.push(bg);
      if (logo) cleanups.push(logo);

      const t1 = setTimeout(() => {
        if (!mounted) return;
        setIsLoading(false);

        const t2 = setTimeout(() => {
          if (!mounted) return;
          const chart = initEnhancedTokenomicsChart();
          if (chart) cleanups.push(chart);
        }, 500);
        cleanups.push(() => clearTimeout(t2));
      }, 1200);
      cleanups.push(() => clearTimeout(t1));
    };

    start();
    return () => {                 // ← ALWAYS returns a function
      mounted = false;
      cleanups.forEach(fn => fn());
    };
  }, [initEnhancedBackground, initLivestockLogo, initEnhancedTokenomicsChart]);


  useEffect(() => {
    const id = setInterval(updateLivestockMarketData, 8000);
    return () => clearInterval(id);
  }, [updateLivestockMarketData]);

  useEffect(() => {
    const idA = setInterval(rotateTokenomics, 6000);
    const idB = setInterval(rotateChainFeatures, 5000);
    const idC = setInterval(rotateRoadmapPhases, 7000);
    return () => {
      clearInterval(idA);
      clearInterval(idB);
      clearInterval(idC);
    };
  }, [rotateTokenomics, rotateChainFeatures, rotateRoadmapPhases]);

  useEffect(() => {
    const id = setInterval(
      () => setMarketDataConnected(Math.random() > 0.05),
      30000
    );
    return () => clearInterval(id);
  }, []);



  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      {/* Loader */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 m-auto border-2 border-blue-400 border-r-transparent rounded-full animate-spin animate-reverse" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                🐄
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              LivestocX
            </h2>
            <p className="text-green-200 text-xl mb-6">
              Initializing LIVESTOCK tokenization platform…
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" />
              <div
                className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
            <div className="mt-6 text-sm text-green-300">
              Connecting to networks…
            </div>
          </div>
        </div>
      )}

      {/* Full-screen fluid background */}
      <canvas
        ref={fluidBgCanvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg,#f0fdf4 0%,#ffffff 40%,#eff6ff 80%,#f0f9ff 100%)'
        }}
      />

      {/* Sticky role button */}
      <button
        onClick={() => setShowRoleModal(true)}
        className="fixed top-6 left-6 z-50 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-lg font-semibold flex gap-3 items-center"
      >
        <span className="text-xl">👤</span>
        <span>Select Role</span>
      </button>

      {/* Corner logo */}
      <div className="fixed bottom-6 left-6 z-40">
        <div className="relative group">
          <canvas
            ref={logoCanvasRef}
            className="w-20 h-20 bg-white rounded-xl shadow-2xl border-2 border-green-500 hover:scale-110 transition"
          />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
              LivestocX Platform
            </div>
          </div>
        </div>
      </div>

      {/* Market widget */}
      <div
        ref={marketWidgetRef}
        className="fixed top-6 right-6 z-40 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border p-5 min-w-[280px]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-gray-800">
            B-DAG LIVESTOCK Token
          </div>
          <div
            className={`flex items-center gap-2 ${
              marketDataConnected ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                marketDataConnected
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-medium">
              {marketDataConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Price rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price</span>
            <span className="text-lg font-bold text-gray-900">
              {formattedStats.bdagPrice}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">24 h</span>
            <span
              className={`text-sm font-bold ${
                liveStats.bdagChange24h >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formattedStats.bdagChange}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Market Cap</span>
            <span className="text-sm font-semibold text-gray-700">
              {formattedStats.marketCap}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Volume 24 h</span>
            <span className="text-sm font-semibold text-gray-700">
              {formattedStats.tradingVolume}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Staking APY</span>
            <span className="text-sm font-bold text-purple-600">
              {formattedStats.stakingAPY}
            </span>
          </div>
          <div className="pt-2 border-t text-xs text-gray-500 text-center">
            TVL {formattedStats.platformTVL}
          </div>
        </div>
      </div>

      {/* Header */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-gray-800">
              Livestoc<span className="text-green-600">X</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-sm text-gray-500 bg-green-100 px-3 py-1 rounded-full font-medium">
                🐄 Platform
              </div>
              <div className="text-xs text-gray-400 bg-blue-100 px-2 py-1 rounded-full">
                B-DAG Powered
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 ml-12">
            {[
              { label: 'Home', href: '#hero', icon: '🏠' },
              { label: 'Problem', href: '#problem', icon: '⚠️' },
              { label: 'Solution', href: '#solution', icon: '✅' },
              { label: 'Tokenomics', href: '#tokenomics', icon: '💰' },
              { label: 'Roadmap', href: '#roadmap', icon: '🗺️' },
              { label: 'Technology', href: '#technology', icon: '⚡' },
              { label: 'Compare', href: '#comparison', icon: '📊' }
            ].map(item => (
              <button
                key={item.label}
                onClick={() => handleSmoothScroll(item.href)}
                className="group relative text-gray-700 hover:text-green-600 font-medium flex items-center gap-2"
              >
                <span className="text-sm opacity-70 group-hover:opacity-100">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-blue-600 group-hover:w-full transition-all" />
              </button>
            ))}
          </nav>

          {/* Right-hand actions */}
          <div className="flex items-center gap-4 ml-auto flex-wrap">
            <MetaMaskButton
              isConnected={isConnected}
              onConnect={connectMetaMask}
              address={metaMask?.account}
              className="hidden sm:block"
            />
            <button
              onClick={handleLaunchApp}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition font-semibold shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">🚀</span>
              Launch dApp
            </button>
            {/* Burger */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-green-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox                ="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-sm border-t shadow-lg">
            <nav className="p-6 space-y-4">
              {[
                { label: 'Home', href: '#hero', icon: '🏠' },
                { label: 'Problem', href: '#problem', icon: '⚠️' },
                { label: 'Solution', href: '#solution', icon: '✅' },
                { label: 'Tokenomics', href: '#tokenomics', icon: '💰' },
                { label: 'Roadmap', href: '#roadmap', icon: '🗺️' },
                { label: 'Technology', href: '#technology', icon: '⚡' },
                { label: 'Compare', href: '#comparison', icon: '📊' }
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    handleSmoothScroll(item.href);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left text-gray-700 hover:text-green-600 py-3 px-4 rounded-lg hover:bg-green-50"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t">
                <MetaMaskButton
                  isConnected={isConnected}
                  onConnect={connectMetaMask}
                  address={metaMask?.account}
                  className="w-full mb-3"
                />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ----------  MAIN CONTENT  ---------- */}
      <main className="relative z-10 pt-[88px]">
        {/* Hero */}
        <section
          id="hero"
          ref={heroContentRef}
          className="min-h-screen flex items-center justify-center py-20 px-6"
        >
          <div className="text-center max-w-7xl mx-auto">
            {/* Ribbon */}
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span>🎉</span>
              <span>LIVESTOCK Tokenization Platform Live</span>
              <span>🐄</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-gray-900 leading-tight">
              Revolutionizing <br />
              <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                LIVESTOCK Finance
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-5xl mx-auto leading-relaxed">
              Transform cattle, poultry, sheep, and other assets into tradable
              digital tokens. Connect ranchers worldwide with investors through
              real-time health monitoring and blockchain security.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={handleLaunchApp}
                className="group relative px-10 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-2xl text-xl hover:from-green-700 hover:to-green-800 transition shadow-2xl hover:shadow-3xl transform hover:scale-105"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl group-hover:rotate-12 transition-transform">
                    🐄
                  </span>
                  <span>Tokenize LIVESTOCK</span>
                </span>
              </button>

              <button
                onClick={() => handleSmoothScroll('#problem')}
                className="group px-10 py-5 bg-white text-green-600 border-2 border-green-600 font-bold rounded-2xl text-xl hover:bg-green-600 hover:text-white transition shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    📖
                  </span>
                  <span>Learn More</span>
                </span>
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
              {[
                {
                  icon: '🐄',
                  value: formattedStats.totalLivestock,
                  label: 'LIVESTOCK Tokenized',
                  change: '+47 today',
                  color: 'green'
                },
                {
                  icon: '💰',
                  value: formattedStats.totalVolume,
                  label: 'Trading Volume',
                  change: '+12.3% 24h',
                  color: 'blue'
                },
                {
                  icon: '👥',
                  value: formattedStats.activeUsers,
                  label: 'Active Ranchers',
                  change: '+156 this week',
                  color: 'purple'
                },
                {
                  icon: '📈',
                  value: formattedStats.averageROI,
                  label: 'Average ROI',
                  change: 'Platform returns',
                  color: 'orange'
                }
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border hover:shadow-3xl transition cursor-pointer overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-${stat.color}-50/50 opacity-0 group-hover:opacity-100 transition`}
                  />
                  <div className="relative z-10">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition">
                      {stat.icon}
                    </div>
                    <div
                      className={`text-3xl font-bold text-${stat.color}-600 mb-2 group-hover:text-${stat.color}-700`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-semibold group-hover:text-gray-700">
                      {stat.label}
                    </div>
                    <div
                      className={`text-xs text-${stat.color}-600 mt-2 group-hover:text-${stat.color}-700`}
                    >
                      {stat.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live summary bar */}
            <div className="mt-12 max-w-4xl mx-auto bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4 text-center">
                Live B-DAG Market Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  {
                    label: 'Token Price',
                    value: formattedStats.bdagPrice,
                    color: ''
                  },
                  {
                    label: '24 h Change',
                    value: formattedStats.bdagChange,
                    color:
                      liveStats.bdagChange24h >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                  },
                  { label: 'Market Cap', value: formattedStats.marketCap },
                  { label: 'TVL', value: formattedStats.platformTVL }
                ].map((row, i) => (
                  <div key={i}>
                    <div className="text-sm opacity-80 mb-1">{row.label}</div>
                    <div className={`text-xl font-bold ${row.color}`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------- PROBLEM SECTION (next) -------- */}
        {/* Problem Section */}
        <section id="problem" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                The LIVESTOCK{' '}
                <span className="text-red-600">Financing Crisis</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Traditional LIVESTOCK financing faces critical challenges that
                limitcher growth and investor access to this $180B global
                market.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Limited LIVESTOCK Financing',
                  description:
                    'Cattle ranchers and farmers struggle to access capital for herd expansion, feed costs, and veterinary care.',
                  icon: '🐄',
                  stat: '89% of ranchers lack adequate funding',
                  color: 'red'
                },
                {
                  title: 'LIVESTOCK Market Volatility',
                  description:
                    'Cattle and livestock prices fluctuate dramatically, making it difficult for ranchers to predict income and plan investments.',
                  icon: '📉',
                  stat: '±35% annual cattle price swings',
                  color: 'orange'
                },
                {
                  title: 'Barriers to LIVESTOCK Investment',
                  description:
                    'Individual investors have limited access to livestock assets, missing opportunities in this profitable sector.',
                  icon: '🚫',
                  stat: '$2.1T investment gap',
                  color: 'purple'
                },
                {
                  title: 'LIVESTOCK Health Monitoring',
                  description:
                    'Manual health tracking leads to delayed disease detection and higher mortality rates in herds.',
                  icon: '🏥',
                  stat: '15% livestock loss from late detection',
                  color: 'yellow'
                },
                {
                  title: 'Breeding Program Access',
                  description:
                    'Small ranchers lack access to premium genetic lines and advanced breeding programs for improvement.',
                  icon: '🧬',
                  stat: '70% limited breeding access',
                  color: 'green'
                },
                {
                  title: 'LIVESTOCK Insurance Gaps',
                  description:
                    'Complex insurance processes and high premiums leave assets underprotected against diseases and disasters.',
                  icon: '🛡️',
                  stat: '60% of livestock uninsured',
                  color: 'blue'
                }
              ].map((problem, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl p-8 shadow-xl border hover:shadow-2xl transition duration-500 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="text-6xl mb-6 group-hover:scale-110 transition">
                    {problem.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800">
                    {problem.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4 group-hover:text-gray-700">
                    {problem.description}
                  </p>
                  <div
                    className={`inline-block px-4 py-2 bg-${problem.color}-100 text-${problem.color}-800 rounded-full text-sm font-semibold`}
                  >
                    {problem.stat}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  The Impact on Global LIVESTOCK Industry
                </h3>
                <p className="text-lg text-gray-700 mb-6">
                  These challenges affect{' '}
                  <span className="font-bold text-red-600">1.3 billion people</span>{' '}
                  worldwide who depend on livestock for their livelihoods,
                  limiting growth in the $180B global market.
                </p>
                <button
                  onClick={() => handleSmoothScroll('#solution')}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-orange-700 transition shadow-lg hover:shadow-xl"
                >
                  Discover Our LIVESTOCK Solution →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section
          id="solution"
          className="py-20 bg-gradient-to-br from-green-50 to-blue-50"
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                Blockchain-Powered{' '}
                <span className="text-green-600">LIVESTOCK Revolution</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                LivestocX transforms livestock financing by tokenizing cattle,
                poultry, and other assets, creating a global marketplace for
                investment and rancher funding.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
              <div>
                <h3 className="text-3xl font-bold mb-8 text-gray-800">
                  Revolutionary LIVESTOCK Tokenization
                </h3>
                <div className="space-y-8">
                  {[
                    {
                      title: 'LIVESTOCK Asset Tokenization',
                      description:
                        'Convert cattle, poultry, sheep, and other livestock into tradeable digital tokens representing ownership shares.',
                      icon: '🪙',
                      benefits: [
                        'Fractional ownership',
                        'Global liquidity access',
                        'Real-time asset valuation',
                        'Breeding rights inclusion'
                      ]
                    },
                    {
                      title: 'Global LIVESTOCK Marketplace',
                      description:
                        'Connect ranchers worldwide with investors, breaking geographical barriers in livestock investment.',
                      icon: '🌍',
                      benefits: [
                        '24/7 trading',
                        'Global investor access',
                        'Instant settlements',
                        'Cross-border investment'
                      ]
                    },
                    {
                      title: 'Smart LIVESTOCK Contracts',
                      description:
                        'Automated contracts for health monitoring, breeding programs, and yield distribution.',
                      icon: '📋',
                      benefits: [
                        'Automated health alerts',
                        'Breeding contract execution',
                        'Yield distribution',
                        'Insurance claim processing'
                      ]
                    }
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border hover:shadow-lg transition duration-500"
                    >
                      <div className="text-4xl bg-green-100 p-4 rounded-2xl group-hover:scale-110 transition">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition">
                          {feature.title}
                        </h4>
                        <p className="text-gray-600 mb-4 group-hover:text-gray-700 transition">
                          {feature.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {feature.benefits.map((benefit, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full group-hover:bg-green-200 transition"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-3xl p-8 shadow-2xl border">
                  <h4 className="text-2xl font-bold text-center mb-8 text-gray-800">
                    LIVESTOCK Platform Impact
                  </h4>

                  <div className="space-y-6">
                    {[
                      {
                        metric: '500x',
                        description: 'Lower investment minimum',
                        color: 'green'
                      },
                      {
                        metric: '60x',
                        description: 'Faster financing',
                        color: 'blue'
                      },
                      {
                        metric: '24/7',
                        description: 'Global market access',
                        color: 'purple'
                      },
                      {
                        metric: '100%',
                        description: 'Transparent tracking',
                        color: 'orange'
                      }
                    ].map((impact, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div
                          className={`text-3xl font-bold text-${impact.color}-600`}
                        >
                          {impact.metric}
                        </div>
                        <div className="text-gray-700 text-right">
                          {impact.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 text-center">
                    <div className="text-4xl mb-4">🐄🐷🐑🐔</div>
                    <p className="text-lg text-gray-600 mb-6">
                      Experience the future of livestock finance with LivestocX -
                      where traditional ranching meets cutting-edge blockchain
                      technology.
                    </p>
                    <button
                      onClick={handleLaunchApp}
                      className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-blue-700 transition shadow-lg hover:shadow-xl"
                    >
                      Start Your Journey →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tokenomics Section */}
        <section id="tokenomics" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                LIVESTOCK <span className="text-green-600">Tokenomics</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Our LSTX utility token powers the entire LivestocX ecosystem,
                aligning incentives for farmers, investors, and platform growth
                with transparent distribution.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
                  LIVESTOCK Token Distribution
                </h3>
                <div className="relative h-96">
                  <canvas ref={tokenomicsChartRef} className="w-full h-full" />
                </div>
                <div className="mt-8 text-center">
                  <div className="text-sm text-gray-600 mb-2">
                    Total Token Supply
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    1,000,000,000 LSTX
                  </div>
                  <div className="text-sm text-green-600 mt-2">
                    Dedicated to Innovation
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {tokenomicsData.map((item, index) => (
                  <div
                    key={index}
                    className={`p-8 bg-white rounded-3xl shadow-lg border-2 transition cursor-pointer hover:shadow-xl ${
                      activeTokenomicsSegment === index
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-100'
                    }`}
                    onClick={() => setActiveTokenomicsSegment(index)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-900">
                        {item.label}
                      </h4>
                      <div className="text-right">
                        <div
                          className="text-2xl font-bold"
                          style={{ color: item.color }}
                        >
                          {item.percentage}%
                        </div>
                        <div className="text-sm text-gray-600">{item.amount}</div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {item.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">
                        Total Allocation
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {item.allocation.toLocaleString()} LSTX
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Token Utility */}
            <div className="mt-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-8 text-white">
              <h3 className="text-3xl font-bold text-center mb-8">
                LSTX Token Utility in Ecosystem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: '🐄',
                    title: 'Trading',
                    description: 'Use LSTX for all asset purchases, sales, and trading fees'
                  },
                  {
                    icon: '🏆',
                    title: 'Staking Rewards',
                    description: 'Stake LSTX tokens to earn rewards from platform fees'
                  },
                  {
                    icon: '🗳️',
                    title: 'Governance Rights',
                    description: 'Vote on platform upgrades and ecosystem decisions'
                  },
                  {
                    icon: '🛡️',
                    title: 'Insurance Premium',
                    description: 'Pay insurance premiums with discounted LSTX rates'
                  }
                ].map((utility, index) => (
                  <div
                    key={index}
                    className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl"
                  >
                    <div className="text-4xl mb-4">{utility.icon}</div>
                    <h4 className="text-lg font-bold mb-3">{utility.title}</h4>
                    <p className="text-sm opacity-90">{utility.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section
          id="roadmap"
          className="py-20 bg-gradient-to-br from-blue-50 to-purple-50"
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                LIVESTOCK Development{' '}
                <span className="text-blue-600">Roadmap</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Our comprehensive journey to revolutionize livestock finance
                through cutting-edge blockchain technology and strategic industry
                partnerships.
              </p>
            </div>

            <div className="relative" ref={roadmapRef}>
              <div className="absolute left-8 top-0 w-1 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500 h-full rounded-full" />

              {roadmapPhases.map((phase, index) => (
                <div
                  key={phase.quarter}
                  className={`relative mb-16 pl-20 transition duration-500 ${
                    activeRoadmapPhase === index ? 'transform scale-105' : ''
                  }`}
                  onClick={() => setActiveRoadmapPhase(index)}
                >
                  <div
                    className={`absolute left-6 top-6 w-4 h-4 rounded-full border-4 border-white shadow-lg transition ${
                      phase.status === 'completed'
                        ? 'bg-green-500 animate-pulse'
                        : phase.status === 'in-progress'
                        ? 'bg-orange-500 animate-pulse'
                        : 'bg-gray-400'
                    }`}
                  />

                  <div className="bg-white rounded-3xl p-8 shadow-xl border hover:shadow-2xl transition cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                          phase.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : phase.status === 'in-progress'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {phase.status === 'completed'
                          ? '✅ Completed'
                          : phase.status === 'in-progress'
                          ? '🚀 In Progress'
                          : '📋 Planned'}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Budget</div>
                        <div className="text-lg font-bold text-gray-800">
                          {phase.budget}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {phase.quarter} {phase.year} - {phase.title}
                    </h3>

                    <div className="text-sm text-gray-500 mb-4">
                      {phase.timeline}
                    </div>

                    {phase.status === 'in-progress' && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{phase.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition duration-1000 relative overflow-hidden"
                            style={{ width: `${phase.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                      {phase.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {phase.milestones.map((milestone, mIndex) => (
                        <div
                          key={mIndex}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                            phase.status === 'completed'
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : phase.status === 'in-progress'
                              ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-lg">
                            {phase.status === 'completed'
                              ? '✅'
                              : phase.status === 'in-progress'
                              ? '⏳'
                              : '⭐'}
                          </span>
                          {milestone}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Roadmap CTA */}
            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">
                  Join the Revolution
                </h3>
                <p className="text-lg mb-6 opacity-90">
                  Be part of the future of livestock finance. Connect with
                  thousands of ranchers and investors already transforming the
                  industry through blockchain technology.
                </p>
                <button
                  onClick={handleLaunchApp}
                  className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition shadow-lg hover:shadow-xl"
                >
                  Start Your Journey Today →
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* Technology Section */}
        <section id="technology" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                Powered by <span className="text-purple-600">BlockDAG</span>{' '}
                Technology
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Next-generation blockchain infrastructure built for high-throughput
                livestock transactions with unparalleled security, scalability, and
                low fees.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
              {/* Live network visual */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
                <h3 className="text-2xl font-bold mb-6">
                  Live Network Visualization
                </h3>
                <div className="h-96 rounded-2xl overflow-hidden bg-slate-950 relative">
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    ref={chainVisualizationRef}
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-pulse">⚡</div>
                      <div className="text-xl font-bold">BlockDAG Network</div>
                      <div className="text-sm opacity-70">Real-time TX/s</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      15 432
                    </div>
                    <div className="text-xs text-gray-400">TPS</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      99.9%
                    </div>
                    <div className="text-xs text-gray-400">Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      2 847
                    </div>
                    <div className="text-xs text-gray-400">Nodes</div>
                  </div>
                </div>
              </div>

              {/* Chain features */}
              <div className="space-y-8">
                {chainFeatures.map((feature, i) => (
                  <div
                    key={feature.name}
                    className={`p-8 rounded-3xl transition cursor-pointer ${
                      activeChainFeature === i
                        ? 'bg-gradient-to-br from-purple-50 to-blue-50 shadow-2xl border-2 border-purple-200'
                        : 'bg-gradient-to-br from-gray-50 to-blue-50 shadow-lg hover:shadow-xl'
                    }`}
                    onClick={() => setActiveChainFeature(i)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl bg-purple-100 p-3 rounded-2xl">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                          {feature.name}
                        </h3>
                        <div className="text-sm text-purple-600 font-semibold">
                          {feature.tech}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">
                          Benefits
                        </h4>
                        <div className="space-y-1">
                          {feature.benefits.map((b, j) => (
                            <div
                              key={j}
                              className="text-xs text-gray-600 flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              {b}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">
                          Technical Specs
                        </h4>
                        <div className="space-y-1">
                          {feature.specs.map((s, j) => (
                            <div
                              key={j}
                              className="text-xs text-gray-600 flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech stats */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold text-center mb-8">
                Network Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { label: 'TX/sec', value: '15 432', color: 'green' },
                  { label: 'Uptime', value: '99.99%', color: 'blue' },
                  {
                    label: 'Assets Secured',
                    value: '$89.5 M',
                    color: 'purple'
                  },
                  { label: 'Block Time', value: '2.3 s', color: 'orange' }
                ].map((stat, i) => (
                  <div key={i} className="p-4">
                    <div
                      className={`text-3xl font-bold text-${stat.color}-400 mb-2`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section
          id="comparison"
          className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
          ref={comparisonTableRef}
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                Why Choose{' '}
                <span className="text-green-600">LivestocX</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                How LivestocX outperforms traditional financing across every
                metric.
              </p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-bold text-lg">Feature</div>
                  <div className="font-bold text-lg text-center">
                    Traditional
                  </div>
                  <div className="font-bold text-lg text-center">
                    LivestocX
                  </div>
                  <div className="font-bold text-lg text-center">
                    Improvement
                  </div>
                  <div className="font-bold text-lg text-center">Impact</div>
                </div>
              </div>

              <div>
                {comparisonData.map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-5 gap-4 p-6 border-b border-gray-100 hover:bg-green-50 transition ${
                      row.impact === 'high'
                        ? 'bg-gradient-to-r from-green-50/50 to-blue-50/50'
                        : ''
                    }`}
                  >
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          row.category === 'access'
                            ? 'bg-green-500'
                            : row.category === 'cost'
                            ? 'bg-blue-500'
                            : row.category === 'speed'
                            ? 'bg-purple-500'
                            : row.category === 'transparency'
                            ? 'bg-orange-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      {row.feature}
                    </div>
                    <div className="text-center text-red-600 font-medium">
                      {row.traditional}
                    </div>
                    <div className="text-center font-semibold text-green-600">
                      {row.livestocx}
                    </div>
                    <div className="text-center font-bold text-blue-600">
                      {row.improvement}
                    </div>
                    <div className="text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          row.impact === 'high'
                            ? 'bg-red-100 text-red-800'
                            : row.impact === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {row.impact.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🚀',
                  title: '500x Lower Barriers',
                  desc: '$50K → $100 min. investment'
                },
                {
                  icon: '⚡',
                  title: '60x Faster',
                  desc: 'Instant vs 30-90 day funding'
                },
                {
                  icon: '🌍',
                  title: 'Global Access',
                  desc: '24/7 worldwide trading'
                }
              ].map((c, i) => (
                <div
                  key={i}
                  className="text-center p-8 bg-white rounded-2xl shadow-xl"
                >
                  <div className="text-4xl mb-4">{c.icon}</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {c.title}
                  </h4>
                  <p className="text-gray-600">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Ready to Transform Finance?
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
              Join thousands already using LivestocX to democratize livestock
              finance.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <button
                onClick={handleLaunchApp}
                className="group px-10 py-5 bg-white text-green-600 font-bold rounded-2xl text-xl hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl group-hover:rotate-12 transition">
                    🐄
                  </span>
                  <span>Launch Platform</span>
                </span>
              </button>
              <button
                onClick={() => handleSmoothScroll('#hero')}
                className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-2xl text-xl hover:bg-white hover:text-green-600 transition"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">📖</span>
                  <span>Learn More</span>
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                {
                  value: formattedStats.totalLivestock,
                  label: 'Tokenized Assets'
                },
                { value: formattedStats.totalVolume, label: 'Volume' },
                { value: formattedStats.activeUsers, label: 'Active Users' },
                { value: formattedStats.averageROI, label: 'Average ROI' }
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold mb-2">{s.value}</div>
                  <div className="text-sm opacity-80">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-2xl">
                  🐄
                </div>
                <div className="text-2xl font-bold">
                  Livestoc<span className="text-green-500">X</span>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                Revolutionizing finance through blockchain, connecting ranchers
                with global investors.
              </p>
              <div className="flex gap-4">
                {['T', 'D', 'Tg', 'GH'].map(s => (
                  <div
                    key={s}
                    className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 cursor-pointer"
                  >
                    <span className="text-sm font-bold">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Platform',
                links: [
                  'Dashboard',
                  'Investor Portal',
                  'Marketplace',
                  'Staking',
                  'Insurance'
                ]
              },
              {
                title: 'Resources',
                links: [
                  'Docs',
                  'White Paper',
                  'API',
                  'Help Center',
                  'Community'
                ]
              },
              {
                title: 'Company',
                links: [
                  'About',
                  'Careers',
                  'Press',
                  'Contact',
                  'Privacy'
                ]
              }
            ].map((sec, i) => (
              <div key={i}>
                <h4 className="font-bold mb-4 text-green-400">{sec.title}</h4>
                <div className="space-y-2">
                  {sec.links.map(l => (
                    <div
                      key={l}
                      className="text-gray-400 hover:text-white cursor-pointer text-sm"
                    >
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-center md:text-left">
              © 2024 LivestocX. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="text-sm text-gray-400">Powered by</div>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">BlockDAG</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-gray-900">
                Choose Your Role
              </h3>
      
              {/* ✱ COMPLETE THIS < p > TAG ✱ */}
              <p className="text-gray-600">
                Select a role to access the LivestocX platform with the features
                that fit you best.
              </p>
              {/* or simply remove the line if no paragraph is needed */}


        <section id="technology" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                Powered by{' '}
                <span className="text-purple-600">BlockDAG LIVESTOCK Tech</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Next-generation blockchain technology specifically designed for
                high-throughput livestock transactions with unparalleled
                security, scalability, and livestock-focused features.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
                <h3 className="text-2xl font-bold mb-6">
                  Live LIVESTOCK Network Visualization
                </h3>
                <div
                  className="h-96 rounded-2xl overflow-hidden bg-slate-950 relative"
                  ref={chainVisualizationRef}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-pulse">⚡</div>
                      <div className="text-xl font-bold">
                        LIVESTOCK BlockDAG Network
                      </div>
                      <div className="text-sm opacity-70">
                        Real</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  {[
                    { value: '15,432', label: 'LIVESTOCK TPS', color: 'green' },
                    { value: '99.9%', label: 'Uptime', color: 'blue' },
                    { value: '2,847', label: 'LIVESTOCK Nodes', color: 'purple' }
                  ].map((stat, i) => (
                    <div key={i}>
                      <div
                        className={`text-2xl font-bold text-${stat.color}-400 mb-2`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                {chainFeatures.map((feature, index) => (
                  <div
                    key={feature.name}
                    className={`p-8 rounded-3xl transition cursor-pointer ${
                      activeChainFeature === index
                        ? 'bg-gradient-to-br from-purple-50 to-blue-50 shadow-2xl border-2 border-purple-200'
                        : 'bg-gradient-to-br from-gray-50 to-blue-50 shadow-lg hover:shadow-xl'
                    }`}
                    onClick={() => setActiveChainFeature(index)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl bg-purple-100 p-3 rounded-2xl">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                          {feature.name}
                        </h3>
                        <div className="text-sm text-purple-600 font-semibold">
                          {feature.tech}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">
                          LIVESTOCK Benefits:
                        </h4>
                        <div className="space-y-1">
                          {feature.benefits.map((benefit, i) => (
                            <div
                              key={i}
                              className="text-xs text-gray-600 flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">
                          Technical Specs:
                        </h4>
                        <div className="space-y-1">
                          {feature.specs.map((spec, i) => (
                            <div
                              key={i}
                              className="text-xs text-gray-600 flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                              {spec}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technology Stats */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold text-center mb-8">
                LIVESTOCK Network Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  {
                    label: 'LIVESTOCK Transactions/sec',
                    value: '15,432',
                    color: 'green'
                  },
                  { label: 'Network Uptime', value: '99.99%', color: 'blue' },
                  {
                    label: 'LIVESTOCK Assets Secured',
                    value: '$89.5M',
                    color: 'purple'
                  },
                  {
                    label: 'Average Block Time',
                    value: '2.3s',
                    color: 'orange'
                  }
                ].map((stat, index) => (
                  <div key={index} className="p-4">
                    <div
                      className={`text-3xl font-bold text-${stat.color}-400 mb-2`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section
          id="comparison"
          className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
          ref={comparisonTableRef}
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
                Why Choose{' '}
                <span className="text-green-600">
                  LivestocX LIVESTOCK Platform
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                See how LivestocX compares to traditional livestock financing
                solutions across key metrics and performance indicators.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-bold text-lg">Feature</div>
                  <div className="font-bold text-lg text-center">
                    Traditional LIVESTOCK
                  </div>
                  <div className="font-bold text-lg text-center">
                    LivestocX Platform
                  </div>
                  <div className="font-bold text-lg text-center">
                    Improvement
                  </div>
                  <div className="font-bold text-lg text-center">Impact</div>
                </div>
              </div>

              <div>
                {comparisonData.map((row, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-5 gap-4 p-6 border-b border-gray-100 hover:bg-green-50 transition duration-300 ${
                      row.impact === 'high'
                        ? 'bg-gradient-to-r from-green-50/50 to-blue-50/50'
                        : ''
                    }`}
                  >
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          row.category === 'access'
                            ? 'bg-green-500'
                            : row.category === 'cost'
                            ? 'bg-blue-500'
                            : row.category === 'speed'
                            ? 'bg-purple-500'
                            : row.category === 'transparency'
                            ? 'bg-orange-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      {row.feature}
                    </div>
                    <div className="text-center text-red-600 font-medium">
                      {row.traditional}
                    </div>
                    <div className="text-center font-semibold text-green-600">
                      {row.livestocx}
                    </div>
                    <div className="text-center font-bold text-blue-600">
                      {row.improvement}
                    </div>
                    <div className="text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          row.impact === 'high'
                            ? 'bg-red-100 text-red-800'
                            : row.impact === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {row.impact.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Summary */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🚀',
                  title: '500x Lower Barriers',
                  description:
                    'From $50K minimum to $100 LIVESTOCK investment access'
                },
                {
                  icon: '⚡',
                  title: '60x Faster Processing',
                  description:
                    'Instant LIVESTOCK transactions vs 30-90 day traditional processing'
                },
                {
                  icon: '🌍',
                  title: 'Global LIVESTOCK Access',
                  description:
                    '24/7 worldwide LIVESTOCK trading vs local market limitations'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="text-center p-8 bg-white rounded-2xl shadow-xl"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h4>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Ready to Transform LIVESTOCK Finance?
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
              Join thousands of ranchers and investors already using LivestocX to
              democratize LIVESTOCK finance through blockchain technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <button
                onClick={handleLaunchApp}
                className="group px-10 py-5 bg-white text-green-600 font-bold rounded-2xl text-xl hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl group-hover:rotate-12 transition-transform">
                    🐄
                  </span>
                  <span>Launch LIVESTOCK Platform</span>
                </span>
              </button>
              <button
                onClick={() => handleSmoothScroll('#hero')}
                className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-2xl text-xl hover:bg-white hover:text-green-600 transition"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">📖</span>
                  <span>Learn More</span>
                </span>
              </button>
            </div>

            {/* Final LIVESTOCK Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                {
                  value: formattedStats.totalLivestock,
                  label: 'LIVESTOCK Tokenized'
                },
                { value: formattedStats.totalVolume, label: 'Trading Volume' },
                { value: formattedStats.activeUsers, label: 'Active Ranchers' },
                { value: formattedStats.averageROI, label: 'Average ROI' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-2xl">
                  🐄
                </div>
                <div className="text-2xl font-bold">
                  Livestoc<span className="text-green-500">X</span>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                Revolutionizing LIVESTOCK finance through blockchain technology,
                connecting ranchers with global investors for a more accessible
                LIVESTOCK market.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Discord', 'Telegram', 'GitHub'].map(social => (
                  <div
                    key={social}
                    className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition cursor-pointer"
                  >
                    <span className="text-sm font-bold">{social}</span>
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: 'LIVESTOCK Platform',
                links: [
                  'Rancher Dashboard',
                  'Investor Portal',
                  'LIVESTOCK Marketplace',
                  'Staking Portal',
                  'LIVESTOCK Insurance'
                ]
              },
              {
                title: 'LIVESTOCK Resources',
                links: [
                  'LIVESTOCK Documentation',
                  'White Paper',
                  'API Reference',
                  'Help Center',
                  'LIVESTOCK Community'
                ]
              },
              {
                title: 'Company',
                links: [
                  'About LivestocX',
                  'Careers',
                  'Press Kit',
                  'Contact Us',
                  'Privacy Policy'
                ]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="font-bold mb-4 text-green-400">
                  {section.title}
                </h4>
                <div className="space-y-2">
                  {section.links.map(link => (
                    <div
                      key={link}
                      className="text-gray-400 hover:text-white transition cursor-pointer text-sm"
                    >
                      {link}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-center md:text-left">
              &copy; 2024 LivestocX. All rights reserved. Built on BlockDAG
              technology for LIVESTOCK innovation.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="text-sm text-gray-400">Powered by</div>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">BlockDAG</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-gray-900">
                Choose Your LIVESTOCK Role
              </h3>
              <p className="text-gray-600">
                Select your role to access the LivestocX LIVESTOCK platform with
                tailored features and functionality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  role: 'farmer' as const,
                  icon: '🌾',
                  title: 'LIVESTOCK Rancher',
                  description:
                    'Tokenize your cattle, manage herds, and access global LIVESTOCK financing.',
                  features: [
                    'Tokenize LIVESTOCK assets',
                    'Health monitoring',
                    'Global marketplace access',
                    'Financing tools'
                  ]
                },
                {
                  role: 'investor' as const,
                  icon: '💰',
                  title: 'LIVESTOCK Investor',
                  description:
                    'Invest in LIVESTOCK assets, earn yields, and diversify your portfolio with real assets.',
                  features: [
                    'LIVESTOCK investment opportunities',
                    'Yield farming',
                    'Portfolio tracking',
                    'Risk management'
                  ]
                },
                {
                  role: 'admin' as const,
                  icon: '⚙️',
                  title: 'Platform Administrator',
                  description:
                    'Manage platform operations, verify LIVESTOCK assets, and oversee network health.',
                  features: [
                    'Asset verification',
                    'Platform management',
                    'Network monitoring',
                    'User support'
                  ]
                }
              ].map(option => (
                <button
                  key={option.role}
                  onClick={() => handleRoleSelect(option.role)}
                  className="group text-left p-6 bg-gray-50 hover:bg-green-50 rounded-2xl transition border-2 border-transparent hover:border-green-200"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition">
                    {option.icon}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition">
                    {option.title}
                  </h4>
                  <p className="text-gray-600 mb-4 group-hover:text-gray-700 transition">
                    {option.description}
                  </p>
                  <div className="space-y-2">
                    {option.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-500"
                      >
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
