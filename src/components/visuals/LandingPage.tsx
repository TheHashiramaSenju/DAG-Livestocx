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

// Safe dynamic imports for client-side libraries
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
    } catch (error) {
      console.warn('Dynamic libraries (GSAP, Chart.js, Three.js) failed to load:', error);
    }
  })();
}

// #region TYPE DEFINITIONS
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
// #endregion

const LandingPage: React.FC<LandingPageProps> = ({ onRoleSelect }) => {
  const router = useRouter();
  const {
    metaMask,
    connectMetaMask,
    isCorrectNetwork,
    isMetaMaskInstalled
  } = useMetaMask();
  const { isConnected } = useContractInteraction();

  // #region STATE MANAGEMENT
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
  // #endregion

  // #region REFS
  const heroContentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const fluidBgCanvasRef = useRef<HTMLCanvasElement>(null);
  const logoCanvasRef = useRef<HTMLCanvasElement>(null);
  const tokenomicsChartRef = useRef<HTMLCanvasElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const chainVisualizationRef = useRef<HTMLDivElement>(null);
  const marketWidgetRef = useRef<HTMLDivElement>(null);
  const comparisonTableRef = useRef<HTMLDivElement>(null);
  // #endregion

  // #region MEMOIZED DATA
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

  const roadmapPhases: RoadmapPhase[] = useMemo(
    () => [
        {
            quarter: 'Q2',
            year: 2024,
            title: 'Livestock Tokenization Launch',
            description: 'Launch core livestock tokenization platform with cattle, poultry, and sheep support including health monitoring systems.',
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
        {
            quarter: 'Q3',
            year: 2024,
            title: 'Marketplace & Investor Portal',
            description: 'Roll out the global marketplace for trading tokenized livestock and an advanced portal for investor portfolio management.',
            status: 'in-progress',
            progress: 75,
            milestones: [
                'Investor dashboard beta live',
                'P2P livestock token trading enabled',
                'Advanced charting tools integration',
                'Portfolio analytics development',
                'Mobile app for investors (alpha)'
            ],
            budget: '$3.0M',
            timeline: 'July - September 2024'
        },
        {
            quarter: 'Q4',
            year: 2024,
            title: 'Decentralized Insurance & Staking',
            description: 'Introduce decentralized insurance protocols for asset protection and launch LSTX staking for platform revenue sharing.',
            status: 'planned',
            progress: 10,
            milestones: [
                'Insurance pool smart contracts audit',
                'Staking rewards mechanism finalization',
                'Governance voting module (v1)',
                'Partnerships with insurance underwriters',
                'Integration of automated claim processing'
            ],
            budget: '$4.2M',
            timeline: 'October - December 2024'
        },
        {
            quarter: 'Q1',
            year: 2025,
            title: 'AI-Powered Analytics & Supply Chain',
            description: 'Integrate AI for predictive health analytics and expand the platform to include supply chain tracking from farm to table.',
            status: 'planned',
            progress: 0,
            milestones: [
                'AI model training for disease prediction',
                'Supply chain module development',
                'QR code integration for product tracking',
                'Partnerships with food distributors',
                'Enhanced data privacy protocols'
            ],
            budget: '$5.5M',
            timeline: 'January - March 2025'
        },
        {
            quarter: 'Q2',
            year: 2025,
            title: 'Global Expansion & New Asset Classes',
            description: 'Expand platform access to new regions (South America, Southeast Asia) and introduce tokenization for aquaculture and exotic livestock.',
            status: 'future',
            progress: 0,
            milestones: [
                'Regulatory compliance for new jurisdictions',
                'Onboarding of aquaculture farms',
                'Multi-language platform support',
                'Cross-chain asset bridging',
                'Establishment of regional support centers'
            ],
            budget: '$7.0M',
            timeline: 'April - June 2025'
        },
    ],
    []
  );

  const chainFeatures: ChainFeature[] = useMemo(
    () => [
      {
        name: 'SHA3 Keccak-256 Security',
        description: 'Advanced cryptographic security specifically designed for livestock asset transactions and health data protection.',
        icon: '🔐',
        tech: 'SHA3-256 Cryptography',
        benefits: [
          'Quantum-resistant data security',
          'Tamper-proof health records',
          'Secure veterinary validation',
          'Protected genetic information'
        ],
        specs: [
          '256-bit hash functions',
          'Data integrity verification',
          'Record authentication',
          'Breeding data protection'
        ]
      },
      {
        name: 'Concurrent Transaction Processing',
        description: 'BlockDAG architecture allows for parallel processing of transactions, eliminating bottlenecks and enabling high throughput for the marketplace.',
        icon: '⚡',
        tech: 'Parallel DAG Consensus',
        benefits: [
          'Near-instant trade settlements',
          'High-frequency market data updates',
          'Scales with network activity',
          'No network congestion during peak hours'
        ],
        specs: [
          '10,000+ Transactions Per Second (TPS)',
          'Sub-second confirmation time',
          'Dynamic sharding capabilities',
          'Asynchronous block processing'
        ]
      },
      {
        name: 'AI-Powered Oracle Integration',
        description: 'Smart contracts utilize AI-driven oracles to fetch and validate real-world data, such as market prices and animal health metrics.',
        icon: '🤖',
        tech: 'Decentralized AI Oracles',
        benefits: [
          'Automated, tamper-proof data feeds',
          'Real-time asset valuation',
          'Predictive health alerts for farmers',
          'Fair insurance premium calculation'
        ],
        specs: [
          'On-chain data validation',
          'IoT sensor compatibility',
          'Machine learning models',
          'Reputation-based oracle staking'
        ]
      },
      {
        name: 'Low-Fee Microtransactions',
        description: 'The efficient DAG structure enables extremely low transaction fees, making it viable to tokenize smaller assets and process frequent data updates.',
        icon: '💸',
        tech: 'Fee-Optimized Ledger',
        benefits: [
          'Affordable for small-scale farmers',
          'Cost-effective IoT data logging',
          'Enables fractional ownership at scale',
          'Reduces barrier to entry for investors'
        ],
        specs: [
          '<$0.0001 per transaction',
          'Gas fee estimation model',
          'Batch transaction processing',
          'Fee delegation options'
        ]
      },
    ],
    []
  );

  const comparisonData: ComparisonRow[] = useMemo(
    () => [
      {
        feature: 'Investment Access',
        traditional: 'Limited to local markets, high minimums',
        livestocx: 'Global, 24/7 marketplace, fractional ownership',
        improvement: '1000x+ Geographic Reach',
        impact: 'high',
        category: 'access'
      },
      {
        feature: 'Financing Speed',
        traditional: '30-90 days via banks, loan applications',
        livestocx: 'Instantaneous via smart contract execution',
        improvement: '60x Faster Funding',
        impact: 'high',
        category: 'speed'
      },
      {
        feature: 'Transaction Costs',
        traditional: 'High fees (3-7%) for brokers, banks',
        livestocx: 'Minimal network fees (<$0.001)',
        improvement: '99.9% Cost Reduction',
        impact: 'high',
        category: 'cost'
      },
      {
        feature: 'Data Transparency',
        traditional: 'Opaque, paper-based records, manual audits',
        livestocx: 'Immutable, real-time data on BlockDAG',
        improvement: 'Total Transparency',
        impact: 'high',
        category: 'transparency'
      },
      {
        feature: 'Asset Security',
        traditional: 'Physical risks, theft, limited insurance',
        livestocx: 'Cryptographically secured, decentralized insurance',
        improvement: 'Enhanced Digital & Physical Security',
        impact: 'medium',
        category: 'security'
      },
      {
        feature: 'Market Liquidity',
        traditional: 'Low, fragmented local markets',
        livestocx: 'High, pooled global investor base',
        improvement: 'Unified Global Liquidity',
        impact: 'high',
        category: 'access'
      },
      {
        feature: 'Insurance Claims',
        traditional: 'Slow, bureaucratic, high dispute rate',
        livestocx: 'Automated via smart contracts, instant payout',
        improvement: 'Automated & Instant',
        impact: 'medium',
        category: 'speed'
      },
    ],
    []
  );

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
      totalLivestock: liveStats.totalLivestock.toLocaleString(),
      activeUsers: liveStats.activeUsers.toLocaleString(),
      averageROI: `${liveStats.averageROI.toFixed(1)}%`,
      networkHealth: `${liveStats.networkHealth}%`,
      bdagPrice: `$${liveStats.bdagPrice.toFixed(4)}`,
      bdagChange: `${
        liveStats.bdagChange24h > 0 ? '+' : ''
      }${liveStats.bdagChange24h.toFixed(2)}%`,
      stakingAPY: `${liveStats.stakingAPY.toFixed(1)}%`
    }),
    [liveStats]
  );
  // #endregion

  // #region EVENT HANDLERS
  const handleSmoothScroll = useCallback((targetId: string) => {
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentSection(targetId.slice(1));
    }
  }, []);

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

      if (!connected) {
        toast.error('Failed to connect to MetaMask.');
        return;
      }
      toast.success('MetaMask connected!');
    }

    if (!isCorrectNetwork) {
      toast('Please switch to the LivestocX network for trading.', {
        icon: '🔄'
      });
      return;
    }

    setShowRoleModal(true);
  }, [
    isMetaMaskInstalled,
    metaMask?.isConnected,
    connectMetaMask,
    isCorrectNetwork
  ]);

  const handleRoleSelect = useCallback(
    async (role: 'farmer' | 'investor' | 'admin') => {
      try {
        setShowRoleModal(false);
        toast.loading(`Navigating to ${role} dashboard…`);
        
        // This is a placeholder for actual role-based logic.
        // In a real app, this would involve contract calls or API requests.
        const success = await new Promise(resolve => setTimeout(() => resolve(true), 1500)); 

        if (success) {
          toast.dismiss();
          toast.success(
            `${role.charAt(0).toUpperCase() + role.slice(1)} access granted. Redirecting...`
          );
          onRoleSelect(role); // This should trigger navigation in the parent component
        } else {
          toast.dismiss();
          toast.error('Role request failed. Please try again.');
        }
      } catch (err: any) {
        toast.dismiss();
        toast.error(`An error occurred: ${err?.message || 'Unknown error'}`);
      }
    },
    [onRoleSelect]
  );
  // #endregion

  // #region ANIMATION / VISUAL INITIALIZERS
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
    let animationFrameId: number;

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
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2.5 + 1,
          alpha: Math.random() * 0.4 + 0.1,
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
        
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animationFrameId);
    }
  }, []);

  const initLivestockLogo = useCallback(() => {
    const canvas = logoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 80;
    canvas.height = 80;
    let rotation = 0;
    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, 80, 80);
      ctx.save();
      ctx.translate(40, 40);
      ctx.rotate(rotation);
      ctx.fillStyle = '#22c55e';
      
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(-30, -30, 60, 60, 15);
      } else { // Fallback for older browsers
        ctx.beginPath();
        ctx.moveTo(-15, -30);
        ctx.lineTo(15, -30);
        ctx.arcTo(30, -30, 30, -15, 15);
        ctx.lineTo(30, 15);
        ctx.arcTo(30, 30, 15, 30, 15);
        ctx.lineTo(-15, 30);
        ctx.arcTo(-30, 30, -30, 15, 15);
        ctx.lineTo(-30, -15);
        ctx.arcTo(-30, -30, -15, -30, 15);
        ctx.closePath();
      }
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐄', 0, 2); // Slight offset for better vertical centering
      ctx.restore();
      rotation += 0.005;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

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
            enabled: true,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#22c55e',
            borderWidth: 2,
            cornerRadius: 12,
            padding: 15,
            callbacks: {
              title: () => 'LivestocX Tokenomics',
              label: (ctx: any) => {
                const segment = tokenomicsData[ctx.dataIndex];
                if (!segment) return '';
                return [
                  `${segment.label}: ${segment.percentage}%`,
                  `Amount: ${segment.amount}`,
                  `Allocation: ${segment.allocation.toLocaleString()} LSTX`
                ];
              },
              afterLabel: (ctx: any) => {
                const segment = tokenomicsData[ctx.dataIndex];
                if (!segment) return '';
                return `\n${segment.description}`;
              }
            }
          }
        },
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1200
        }
      }
    };

    const chart = new Chart(canvas, config as any);
    return () => chart.destroy();
  }, [tokenomicsData]);
  // #endregion

  // #region DATA UPDATERS & ROTATORS
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
        totalLivestock: prev.totalLivestock + (Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0),
        totalInvestments: prev.totalInvestments + (Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0),
        activeUsers: prev.activeUsers + (Math.random() > 0.9 ? 1 : 0),
        platformTVL: prev.platformTVL * (0.999 + Math.random() * 0.002),
        stakingAPY: Math.max(5, Math.min(25, prev.stakingAPY + (Math.random() - 0.5) * 0.2))
      };
    });
  }, []);

  const rotateTokenomics = useCallback(
    () => setActiveTokenomicsSegment(prev => (prev + 1) % tokenomicsData.length),
    [tokenomicsData.length]
  );
  const rotateChainFeatures = useCallback(
    () => setActiveChainFeature(prev => (prev + 1) % chainFeatures.length),
    [chainFeatures.length]
  );
  const rotateRoadmapPhases = useCallback(
    () => setActiveRoadmapPhase(prev => (prev + 1) % roadmapPhases.length),
    [roadmapPhases.length]
  );
  // #endregion

  // #region LIFECYCLE EFFECTS
  useEffect(() => {
    let mounted = true;
    const cleanups: Array<() => void> = [];

    const initializeVisuals = () => {
      if (!mounted) return;

      const bgCleanup = initEnhancedBackground();
      const logoCleanup = initLivestockLogo();
      if (bgCleanup) cleanups.push(bgCleanup);
      if (logoCleanup) cleanups.push(logoCleanup);

      const loadingTimeout = setTimeout(() => {
        if (!mounted) return;
        setIsLoading(false);

        const chartTimeout = setTimeout(() => {
          if (!mounted) return;
          const chartCleanup = initEnhancedTokenomicsChart();
          if (chartCleanup) cleanups.push(chartCleanup);
        }, 500);
        cleanups.push(() => clearTimeout(chartTimeout));

      }, 1200);
      cleanups.push(() => clearTimeout(loadingTimeout));
    };

    initializeVisuals();
    
    return () => {
      mounted = false;
      cleanups.forEach(fn => fn());
    };
  }, [initEnhancedBackground, initLivestockLogo, initEnhancedTokenomicsChart]);

  useEffect(() => {
    const marketDataInterval = setInterval(updateLivestockMarketData, 8000);
    return () => clearInterval(marketDataInterval);
  }, [updateLivestockMarketData]);

  useEffect(() => {
    const tokenomicsInterval = setInterval(rotateTokenomics, 6000);
    const chainFeaturesInterval = setInterval(rotateChainFeatures, 5000);
    const roadmapInterval = setInterval(rotateRoadmapPhases, 7000);
    return () => {
      clearInterval(tokenomicsInterval);
      clearInterval(chainFeaturesInterval);
      clearInterval(roadmapInterval);
    };
  }, [rotateTokenomics, rotateChainFeatures, rotateRoadmapPhases]);

  useEffect(() => {
    const connectivityInterval = setInterval(
      () => setMarketDataConnected(Math.random() > 0.05),
      30000
    );
    return () => clearInterval(connectivityInterval);
  }, []);
  // #endregion

  // #region TAILWIND CLASS MAPPERS
  // This is crucial for Tailwind's JIT compiler. It cannot parse dynamic strings.
  const problemCardColors: { [key: string]: { bg: string, text: string } } = {
    red:    { bg: 'bg-red-100',    text: 'text-red-800'    },
    orange: { bg: 'bg-orange-100', text: 'text-orange-800' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    green:  { bg: 'bg-green-100',  text: 'text-green-800'  },
    blue:   { bg: 'bg-blue-100',   text: 'text-blue-800'   },
  };

  const statsCardColors: { [key: string]: { text: string, bg: string, hoverText: string } } = {
    green:  { text: 'text-green-600',  bg: 'bg-green-50/50',  hoverText: 'group-hover:text-green-700' },
    blue:   { text: 'text-blue-600',   bg: 'bg-blue-50/50',   hoverText: 'group-hover:text-blue-700' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50/50', hoverText: 'group-hover:text-purple-700' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-50/50', hoverText: 'group-hover:text-orange-700' },
  };
  // #endregion

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden font-sans">
      {/* --- Page Loader --- */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-green-900 to-blue-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="relative mb-8 w-24 h-24 mx-auto">
              <div className="w-full h-full border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 m-auto border-2 border-blue-400 border-r-transparent rounded-full animate-spin" style={{animationDirection: 'reverse'}} />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">
                🐄
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              LivestocX
            </h2>
            <p className="text-green-200 text-lg mb-6">
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
              Connecting to BlockDAG network...
            </div>
          </div>
        </div>
      )}

      {/* --- Floating UI Elements --- */}
      <canvas
        ref={fluidBgCanvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 40%, #eff6ff 80%, #f0f9ff 100%)'
        }}
      />
      
      <div className="fixed bottom-6 left-6 z-40">
        <div className="relative group">
          <canvas
            ref={logoCanvasRef}
            className="w-20 h-20 bg-white rounded-xl shadow-2xl border-2 border-green-500 hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
              LivestocX Platform
            </div>
          </div>
        </div>
      </div>

      <div
        ref={marketWidgetRef}
        className="fixed top-24 right-6 z-40 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border p-5 min-w-[280px] hidden md:block"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-gray-800">
            B-DAG LIVESTOCK Token
          </div>
          <div
            className={`flex items-center gap-2 ${marketDataConnected ? 'text-green-500' : 'text-red-500'}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${marketDataConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
            />
            <span className="text-xs font-medium">
              {marketDataConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Price</span>
            <span className="text-lg font-bold text-gray-900">
              {formattedStats.bdagPrice}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">24h Change</span>
            <span
              className={`text-sm font-bold ${liveStats.bdagChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formattedStats.bdagChange}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Market Cap</span>
            <span className="text-sm font-semibold text-gray-700">
              {formattedStats.marketCap}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Volume (24h)</span>
            <span className="text-sm font-semibold text-gray-700">
              {formattedStats.tradingVolume}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Staking APY</span>
            <span className="text-sm font-bold text-purple-600">
              {formattedStats.stakingAPY}
            </span>
          </div>
          <div className="pt-2 mt-2 border-t text-xs text-gray-500 text-center">
            Platform TVL: {formattedStats.platformTVL}
          </div>
        </div>
      </div>

      {/* --- Header & Navigation --- */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm"
      >
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="#hero" onClick={(e) => { e.preventDefault(); handleSmoothScroll('#hero'); }} className="flex items-center gap-2 cursor-pointer">
              <div className="text-3xl font-bold text-gray-800">
                Livestoc<span className="text-green-600">X</span>
              </div>
            </a>
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-sm text-gray-500 bg-green-100 px-3 py-1 rounded-full font-medium">
                🐄 Platform
              </div>
              <div className="text-xs text-gray-400 bg-blue-100 px-2 py-1 rounded-full">
                B-DAG Powered
              </div>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8">
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
                className="group relative text-gray-700 hover:text-green-600 font-medium flex items-center gap-2 transition-colors"
              >
                <span className="text-sm opacity-70 group-hover:opacity-100 transition-opacity">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-blue-600 group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              {isConnected && metaMask?.account ? (
                // If connected, show the address instead of the button
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium truncate" title={metaMask.account}>
                  {`${metaMask.account.substring(0, 6)}...${metaMask.account.substring(metaMask.account.length - 4)}`}
                </div>
              ) : (
                // If not connected, show the button with only the onClick handler
                <MetaMaskButton/>
              )}
            </div>
            <button
              onClick={handleLaunchApp}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-green-500/20 flex items-center gap-2"
            >
              <span className="text-xl">🚀</span>
              Launch dApp
            </button>
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-green-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

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
                  className="flex items-center gap-3 w-full text-left text-lg text-gray-700 hover:text-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition-all"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t">
                {isConnected && metaMask?.account ? (
                  // If connected, show the address
                  <div className="w-full text-center mb-3 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium truncate" title={metaMask.account}>
                     {`${metaMask.account.substring(0, 6)}...${metaMask.account.substring(metaMask.account.length - 4)}`}
                  </div>
                ) : (
                  // If not connected, show the button
                  <MetaMaskButton className="w-full justify-center mb-3" />
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* --- Main Content --- */}
      <main className="relative z-10 pt-[88px]">
        {/* Hero Section */}
        <section
          id="hero"
          ref={heroContentRef}
          className="min-h-screen flex items-center justify-center py-20 px-6"
        >
          <div className="text-center max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-md">
              <span>🎉</span>
              <span>LIVESTOCK Tokenization Platform is Live!</span>
              <span>🐄</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-8 text-gray-900 leading-tight">
              Revolutionizing <br />
              <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                LIVESTOCK Finance
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-5xl mx-auto leading-relaxed">
              Transform cattle, poultry, sheep, and other agricultural assets into tradable
              digital tokens. Connect ranchers worldwide with investors through
              real-time health monitoring and the unparalleled security of BlockDAG.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={handleLaunchApp}
                className="group relative px-10 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-2xl text-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-2xl hover:shadow-green-500/30 transform hover:scale-105"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">
                    🐄
                  </span>
                  <span>Tokenize LIVESTOCK</span>
                </span>
              </button>
              <button
                onClick={() => handleSmoothScroll('#problem')}
                className="group px-10 py-5 bg-white text-green-600 border-2 border-green-600 font-bold rounded-2xl text-xl hover:bg-green-600 hover:text-white transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                    📖
                  </span>
                  <span>Learn More</span>
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                { icon: '🐄', value: formattedStats.totalLivestock, label: 'LIVESTOCK Tokenized', change: `+${liveStats.newListingsToday} today`, color: 'green' },
                { icon: '💰', value: formattedStats.totalVolume, label: 'Trading Volume', change: '+12.3% 24h', color: 'blue' },
                { icon: '👥', value: formattedStats.activeUsers, label: 'Active Participants', change: '+156 this week', color: 'purple' },
                { icon: '📈', value: formattedStats.averageROI, label: 'Average Platform ROI', change: 'Stable Returns', color: 'orange' }
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border hover:shadow-3xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${statsCardColors[stat.color as keyof typeof statsCardColors]?.bg || 'bg-gray-50/50'}`}
                  />
                  <div className="relative z-10">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                    <div
                      className={`text-3xl font-bold mb-2 transition-colors ${statsCardColors[stat.color as keyof typeof statsCardColors]?.text || 'text-gray-900'} ${statsCardColors[stat.color as keyof typeof statsCardColors]?.hoverText || ''}`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-semibold group-hover:text-gray-700 transition-colors">
                      {stat.label}
                    </div>
                    <div
                      className={`text-xs mt-2 transition-colors ${statsCardColors[stat.color as keyof typeof statsCardColors]?.text || 'text-gray-600'} ${statsCardColors[stat.color as keyof typeof statsCardColors]?.hoverText || ''}`}
                    >
                      {stat.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-24 bg-white">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
                The LIVESTOCK <span className="text-red-600">Financing Crisis</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Traditional LIVESTOCK financing faces critical challenges that
                limit rancher growth and investor access to this $1.8T global market.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Limited Capital Access', description: 'Ranchers struggle to secure capital for herd expansion, feed, and veterinary care due to rigid banking requirements.', icon: '🏦', stat: '89% lack adequate funding', color: 'red' },
                { title: 'Market Volatility', description: 'Livestock prices fluctuate dramatically due to weather, disease, and trade policies, creating high risk for producers.', icon: '📉', stat: '±35% annual price swings', color: 'orange' },
                { title: 'High Investment Barriers', description: 'Individual investors are excluded from direct livestock investment by high costs and logistical complexity.', icon: '🚫', stat: '$2.1T investment gap', color: 'purple' },
                { title: 'Inefficient Health Monitoring', description: 'Manual health tracking leads to delayed disease detection, higher mortality rates, and significant economic loss.', icon: '🏥', stat: '15% loss from late detection', color: 'yellow' },
                { title: 'Opaque Supply Chains', description: 'Lack of transparency from farm to consumer makes it difficult to verify provenance, quality, and ethical practices.', icon: '⛓️', stat: '70% of consumers demand transparency', color: 'green' },
                { title: 'Inaccessible Insurance', description: 'Complex, expensive insurance processes leave most small and medium-sized farms underprotected against disasters.', icon: '🛡️', stat: '60% of assets uninsured', color: 'blue' }
              ].map((problem, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl p-8 shadow-xl border hover:shadow-2xl transition duration-500 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {problem.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                    {problem.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4 group-hover:text-gray-700 transition-colors">
                    {problem.description}
                  </p>
                  <div
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold transition-colors ${problemCardColors[problem.color]?.bg || 'bg-gray-100'} ${problemCardColors[problem.color]?.text || 'text-gray-800'}`}
                  >
                    {problem.stat}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 max-w-4xl mx-auto border border-red-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  The Global Impact
                </h3>
                <p className="text-lg text-gray-700 mb-6">
                  These challenges affect{' '}
                  <span className="font-bold text-red-600">1.3 billion people</span>{' '}
                  worldwide who depend on livestock for their livelihoods,
                  stifling innovation in a vital global industry.
                </p>
                <button
                  onClick={() => handleSmoothScroll('#solution')}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Discover Our Solution →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="solution" className="py-24 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
                The BlockDAG-Powered <span className="text-green-600">LIVESTOCK Revolution</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                LivestocX transforms livestock into a liquid, accessible, and transparent asset class, creating a global marketplace for direct investment and rancher funding.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-8 text-gray-800">
                  Core Platform Features
                </h3>
                <div className="space-y-8">
                  {[
                    { title: 'Asset Tokenization', description: 'Convert cattle, poultry, and other livestock into tradable digital tokens (NFTs) representing direct ownership.', icon: '🪙', benefits: ['Fractional ownership', 'Global liquidity', 'Real-time valuation', 'Breeding rights'] },
                    { title: 'Global Marketplace', description: 'A decentralized exchange connecting ranchers directly with investors, eliminating geographical and financial intermediaries.', icon: '🌍', benefits: ['24/7 trading', 'Instant settlement', 'Transparent order book', 'Cross-border investment'] },
                    { title: 'IoT & AI Integration', description: 'Smart tags and AI algorithms provide real-time health data, automating insurance claims and verifying asset quality.', icon: '🛰️', benefits: ['Automated health alerts', 'Data-driven insurance', 'Proof of provenance', 'Yield optimization'] }
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border hover:shadow-lg transition duration-500"
                    >
                      <div className="text-4xl bg-green-100 p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors">
                          {feature.title}
                        </h4>
                        <p className="text-gray-600 mb-4 group-hover:text-gray-700 transition-colors">
                          {feature.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {feature.benefits.map((benefit, i) => (
                            <span key={i} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full group-hover:bg-green-200 transition-colors">
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
                    Platform Impact at a Glance
                  </h4>
                  <div className="space-y-6">
                    {[
                      { metric: '500x', description: 'Lower Investment Minimums', color: 'text-green-600' },
                      { metric: '60x', description: 'Faster Financing & Settlement', color: 'text-blue-600' },
                      { metric: '24/7', description: 'Global Market Access', color: 'text-purple-600' },
                      { metric: '100%', description: 'Transparent, Immutable Tracking', color: 'text-orange-600' }
                    ].map((impact, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className={`text-3xl font-bold ${impact.color}`}>
                          {impact.metric}
                        </div>
                        <div className="text-gray-700 font-medium text-right">
                          {impact.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-center">
                    <div className="text-4xl mb-4">🐄 🐷 🐑 🐔</div>
                    <p className="text-lg text-gray-600 mb-6">
                      Experience the future where traditional ranching meets cutting-edge blockchain technology.
                    </p>
                    <button
                      onClick={handleLaunchApp}
                      className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
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
        <section id="tokenomics" className="py-24 bg-white">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
                LIVESTOCK <span className="text-green-600">Tokenomics</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Our LSTX utility token powers the entire LivestocX ecosystem, aligning incentives for farmers, investors, and platform growth with a transparent, community-focused distribution.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="bg-white rounded-3xl p-8 shadow-2xl border">
                <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
                  LSTX Token Distribution
                </h3>
                <div className="relative h-96">
                  <canvas ref={tokenomicsChartRef} className="w-full h-full" />
                </div>
                <div className="mt-8 text-center">
                  <div className="text-sm text-gray-600 mb-2">
                    Total Token Supply
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    1,000,000,000 LSTX
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {tokenomicsData.map((item, index) => (
                  <div
                    key={index}
                    className={`p-8 bg-white rounded-3xl shadow-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-green-500/50 ${activeTokenomicsSegment === index ? 'border-green-500 bg-green-50 scale-105' : 'border-gray-100'}`}
                    onClick={() => setActiveTokenomicsSegment(index)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-900">
                        {item.label}
                      </h4>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: item.color }}>
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
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}/>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section id="roadmap" className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
                Development <span className="text-blue-600">Roadmap</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Our journey to revolutionize livestock finance through cutting-edge technology and strategic industry partnerships.
              </p>
            </div>
            <div className="relative" ref={roadmapRef}>
              <div className="absolute left-4 sm:left-1/2 top-0 w-1 -ml-0.5 bg-gradient-to-b from-green-300 via-blue-300 to-purple-300 h-full rounded-full" />
              {roadmapPhases.map((phase, index) => (
                <div key={index} className={`relative mb-12 flex items-center ${index % 2 === 1 ? 'flex-row-reverse' : ''} w-full`}>
                  <div className={`absolute left-4 sm:left-1/2 top-5 w-4 h-4 -ml-2 rounded-full border-4 border-white shadow-lg transition-colors ${
                      phase.status === 'completed' ? 'bg-green-500' :
                      phase.status === 'in-progress' ? 'bg-orange-500 animate-pulse' :
                      phase.status === 'planned' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <div className="w-full sm:w-1/2" />
                  <div className="w-full sm:w-1/2 sm:pl-12">
                      <div className="bg-white rounded-3xl p-8 shadow-xl border hover:shadow-2xl transition-all duration-300 cursor-pointer">
                          <div className={`text-right text-sm font-bold mb-2 ${
                              phase.status === 'completed' ? 'text-green-600' :
                              phase.status === 'in-progress' ? 'text-orange-600' :
                              phase.status === 'planned' ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                              {phase.quarter} {phase.year}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">{phase.title}</h3>
                          {phase.status === 'in-progress' && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-semibold text-orange-700">Progress</span>
                                    <span>{phase.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className="bg-gradient-to-r from-orange-400 to-amber-500 h-3 rounded-full" style={{ width: `${phase.progress}%` }} />
                                </div>
                            </div>
                          )}
                          <p className="text-gray-600 mb-4 text-base leading-relaxed">{phase.description}</p>
                          <div className="space-y-2">
                              {phase.milestones.map((milestone, mIndex) => (
                                  <div key={mIndex} className="flex items-center gap-3 text-sm">
                                      <span className="text-lg">
                                          {phase.status === 'completed' ? '✅' : phase.status === 'in-progress' ? '⏳' : '⭐'}
                                      </span>
                                      <span className="text-gray-700">{milestone}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section id="technology" className="py-24 bg-white">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
                Powered by <span className="text-purple-600">BlockDAG</span> Technology
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Our next-generation infrastructure is built for high-throughput livestock transactions with unparalleled security, scalability, and efficiency.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <h3 className="text-2xl font-bold mb-6">
                  Live Network Visualization
                </h3>
                <div className="h-96 rounded-2xl overflow-hidden bg-slate-950/70 relative border border-slate-700" ref={chainVisualizationRef}>
                  {/* Placeholder for a Three.js or other complex visualization */}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                          <div className="text-6xl mb-4 animate-pulse">⚡</div>
                          <div className="text-xl font-bold">BlockDAG Network</div>
                          <div className="text-sm opacity-70">Processing Transactions...</div>
                      </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-400">15,432</div>
                    <div className="text-xs text-gray-400">TPS</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">99.99%</div>
                    <div className="text-xs text-gray-400">Uptime</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400">2,847</div>
                    <div className="text-xs text-gray-400">Nodes</div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {chainFeatures.map((feature, i) => (
                  <div
                    key={feature.name}
                    className={`p-8 rounded-3xl transition-all duration-300 cursor-pointer ${activeChainFeature === i ? 'bg-purple-50 shadow-2xl border-2 border-purple-200 scale-105' : 'bg-gray-50 shadow-lg hover:shadow-xl'}`}
                    onClick={() => setActiveChainFeature(i)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl bg-purple-100 p-3 rounded-2xl">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{feature.name}</h3>
                        <div className="text-sm text-purple-600 font-semibold">{feature.tech}</div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Benefits:</h4>
                        <div className="space-y-1">
                          {feature.benefits.map((b, j) => (
                            <div key={j} className="text-sm text-gray-600 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" /> {b}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Specs:</h4>
                        <div className="space-y-1">
                          {feature.specs.map((s, j) => (
                            <div key={j} className="text-sm text-gray-600 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" /> {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section id="comparison" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
                Why Choose <span className="text-green-600">LivestocX</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                A side-by-side comparison shows how LivestocX outperforms traditional financing across every critical metric.
              </p>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl overflow-x-auto">
              <div className="min-w-[1024px]">
                  <div className="bg-gradient-to-r from-gray-800 to-slate-900 text-white p-6">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="font-bold text-lg col-span-1">Feature</div>
                      <div className="font-bold text-lg text-center col-span-1">Traditional Finance</div>
                      <div className="font-bold text-lg text-center col-span-1">LivestocX Platform</div>
                      <div className="font-bold text-lg text-center col-span-1">Improvement</div>
                      <div className="font-bold text-lg text-center col-span-1">Impact</div>
                    </div>
                  </div>
                  <div>
                    {comparisonData.map((row, i) => (
                      <div key={i} className={`grid grid-cols-5 gap-4 p-6 border-b border-gray-100 items-center transition-colors ${row.impact === 'high' ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                        <div className="font-semibold text-gray-800 flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            row.category === 'access' ? 'bg-green-500' :
                            row.category === 'cost' ? 'bg-blue-500' :
                            row.category === 'speed' ? 'bg-purple-500' :
                            row.category === 'transparency' ? 'bg-orange-500' : 'bg-gray-500'
                          }`} />
                          <span>{row.feature}</span>
                        </div>
                        <div className="text-center text-red-700/80">{row.traditional}</div>
                        <div className="text-center font-semibold text-green-600">{row.livestocx}</div>
                        <div className="text-center font-bold text-blue-600">{row.improvement}</div>
                        <div className="text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            row.impact === 'high' ? 'bg-red-100 text-red-800' :
                            row.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {row.impact.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="max-w-screen-xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8">
              Ready to Transform LIVESTOCK Finance?
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
              Join thousands of ranchers and investors already using LivestocX to democratize finance through transparent, efficient, and secure BlockDAG technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={handleLaunchApp}
                className="group px-10 py-5 bg-white text-green-600 font-bold rounded-2xl text-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">🐄</span>
                  <span>Launch Platform</span>
                </span>
              </button>
              <button
                onClick={() => window.open('/whitepaper.pdf', '_blank')}
                className="group px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-2xl text-xl hover:bg-white hover:text-green-600 transition-all duration-300"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl group-hover:animate-pulse">📄</span>
                  <span>Read Whitepaper</span>
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🐄</div>
                <div className="text-2xl font-bold">Livestoc<span className="text-green-500">X</span></div>
              </div>
              <p className="text-gray-400 mb-6">
                Revolutionizing finance through blockchain, connecting ranchers with global investors for a more accessible market.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'Discord', 'Telegram', 'GitHub'].map(s => (
                  <a key={s} href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors" aria-label={s}>
                    {/* Placeholder for actual icons */}
                    <span className="text-sm font-bold">{s.substring(0,2)}</span>
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: 'Platform', links: ['Dashboard', 'Investor Portal', 'Marketplace', 'Staking', 'Insurance'] },
              { title: 'Resources', links: ['Documentation', 'White Paper', 'API Reference', 'Help Center', 'Community'] },
              { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Contact', 'Privacy Policy'] }
            ].map((sec, i) => (
              <div key={i}>
                <h4 className="font-bold text-lg mb-4 text-green-400">{sec.title}</h4>
                <div className="space-y-2">
                  {sec.links.map(l => (
                    <a key={l} href="#" className="block text-gray-400 hover:text-white hover:underline cursor-pointer text-sm">
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm text-center md:text-left mb-4 md:mb-0">
              © 2024 - 2025 LivestocX. All Rights Reserved. Built for a transparent future.
            </p>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">Powered by</div>
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">BlockDAG</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* --- Role Selection Modal --- */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full mx-4 p-8 shadow-2xl animate-slide-up relative">
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-black transition-all flex items-center justify-center"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-gray-900">
                Choose Your LIVESTOCK Role
              </h3>
              <p className="text-gray-600 max-w-xl mx-auto">
                Select your role to access the LivestocX platform with features and tools tailored to your needs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { role: 'farmer' as const, icon: '🌾', title: 'LIVESTOCK Rancher', description: 'Tokenize your cattle, manage herds, and access global financing.', features: ['Tokenize assets', 'Health monitoring', 'Marketplace access', 'Financing tools'] },
                { role: 'investor' as const, icon: '💰', title: 'LIVESTOCK Investor', description: 'Invest in livestock, earn yields, and diversify your portfolio with real-world assets.', features: ['Investment opportunities', 'Yield farming', 'Portfolio tracking', 'Risk management'] },
                { role: 'admin' as const, icon: '⚙️', title: 'Platform Operator', description: 'Manage operations, verify assets, and oversee network health and integrity.', features: ['Asset verification', 'Platform management', 'Network monitoring', 'User support'] }
              ].map(option => (
                <button
                  key={option.role}
                  onClick={() => handleRoleSelect(option.role)}
                  className="group text-left p-6 bg-gray-50 hover:bg-green-50 rounded-2xl transition-all duration-300 border-2 border-transparent hover:border-green-300 hover:scale-105"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {option.icon}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors">
                    {option.title}
                  </h4>
                  <p className="text-gray-600 mb-4 text-sm group-hover:text-gray-700 transition-colors">
                    {option.description}
                  </p>
                  <div className="space-y-2 pt-2 border-t border-gray-200 group-hover:border-green-200 transition-colors">
                    {option.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;