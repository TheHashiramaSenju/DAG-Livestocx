import { Address } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import LivestockManagerAbi from './LivestockManagerAbi.json';
import TestStablecoinAbi from './TestStablecoinAbi.json';
import LivestockAssetNFTAbi from './LivestockAssetNFTAbi.json';

export const CONTRACT_ADDRESSES = {
  1043: { // Primordial Testnet
    livestockManager: '0x724550c719e4296B8B75C8143Ab6228141bC7747' as Address,
    livestockAssetNFT: '0x6740bcf0BF975a270d835617Bb516D7c4ACEceA4' as Address,
    testStablecoin: '0xcE3C341664C9D836b7748429Afae9A19088bf9Be' as Address,
  },
  31337: { // Hardhat Local
    livestockManager: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
    livestockAssetNFT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as Address,
    testStablecoin: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as Address,
  }
} as const;

// Contract 
export const livestockManagerContract = {
  address: (chainId: number) => CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.livestockManager,
  abi: LivestockManagerAbi.abi || LivestockManagerAbi,
} as const;

export const testStablecoinContract = {
  address: (chainId: number) => CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.testStablecoin,
  abi: TestStablecoinAbi.abi || TestStablecoinAbi,
} as const;

export const livestockAssetNFTContract = {
  address: (chainId: number) => CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.livestockAssetNFT,
  abi: LivestockAssetNFTAbi.abi || LivestockAssetNFTAbi,
} as const;

export const ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  FARMER_ROLE: '0x523a704056dcd17bcf83bed8b68c59416dac1119be77755efe3bde0a64e46e0c',
  INVESTOR_ROLE: '0x2db9fd3d099848027c2383d0a083396f6c41510d9596718a39e7038ac1a9a3e',
  AUDITOR_ROLE: '0x4d5b6180237c0c0c441c6743dc28c1a8965bf0b24b6b5b0fe5c9e9b0c7c1e1a'
} as const;

export const ROLE_NAMES = {
  [ROLES.DEFAULT_ADMIN_ROLE]: 'Admin',
  [ROLES.FARMER_ROLE]: 'Farmer',
  [ROLES.INVESTOR_ROLE]: 'Investor',
  [ROLES.AUDITOR_ROLE]: 'Auditor',
} as const;

export function formatTokenAmount(amount: bigint | string | number, decimals: number = 18): string {
  if (typeof amount === 'string') {
    amount = BigInt(amount);
  } else if (typeof amount === 'number') {
    amount = BigInt(amount);
  }
  return formatUnits(amount, decimals);
}

export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals);
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Livestock': '🐄',
    'Crop': '🌾',
    'Equipment': '🚜',
    'Land': '🏞️',
    'Dairy': '🥛',
    'Poultry': '🐔',
    'Fish': '🐟',
    'Fruits': '🍎',
    'Vegetables': '🥕',
  };
  return icons[category] || '📋';
}

export function getStatusBadge(listing: any) {
  if (!listing) {
    return {
      text: 'Unknown',
      color: 'text-gray-800',
      bgColor: 'bg-gray-100'
    };
  }

  if (listing.isVerified && listing.isActive) {
    return {
      text: 'Active & Verified',
      color: 'text-green-800',
      bgColor: 'bg-green-100'
    };
  } else if (listing.isActive && !listing.isVerified) {
    return {
      text: 'Pending Verification',
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-100'
    };
  } else if (!listing.isActive && listing.isVerified) {
    return {
      text: 'Verified but Inactive',
      color: 'text-blue-800',
      bgColor: 'bg-blue-100'
    };
  } else {
    return {
      text: 'Inactive',
      color: 'text-gray-800',
      bgColor: 'bg-gray-100'
    };
  }
}


export function isNetworkSupported(chainId: number): boolean {
  return chainId === 1043 || chainId === 31337 || chainId === 1 || chainId === 11155111;
}

export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1043: 'Primordial Testnet',
    31337: 'Hardhat Local',
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai',
  };
  return networks[chainId] || `Unknown Network (${chainId})`;
}

// Validation 
export function validateListingData(data: {
  totalShares: number;
  pricePerShare: string;
  category: string;
  livestockType: string;
  details: any;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate total shares
  if (!data.totalShares || data.totalShares <= 0) {
    errors.push('Total shares must be greater than 0');
  }
  if (data.totalShares > 1000000) {
    errors.push('Total shares cannot exceed 1,000,000');
  }

  // Validate price per share
  if (!data.pricePerShare || parseFloat(data.pricePerShare) <= 0) {
    errors.push('Price per share must be greater than 0');
  }
  if (parseFloat(data.pricePerShare) > 100000) {
    errors.push('Price per share cannot exceed 100,000 TUSDC');
  }

  // Validate category
  if (!data.category || data.category.trim() === '') {
    errors.push('Category is required');
  }

  // Validate livestock type
  if (!data.livestockType || data.livestockType.trim() === '') {
    errors.push('Livestock type is required');
  }
  if (data.livestockType.length > 100) {
    errors.push('Livestock type must be less than 100 characters');
  }

  // Validate details
  if (!data.details) {
    errors.push('Asset details are required');
  } else {
    if (!data.details.healthStatus) {
      errors.push('Health status is required');
    }
    if (!data.details.insuranceId) {
      errors.push('Insurance ID is required');
    }
    if (data.details.age && (data.details.age < 0 || data.details.age > 300)) {
      errors.push('Age must be between 0 and 300 months');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Address utilities
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Explorer utilities
export function getExplorerUrl(chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string {
  const explorers: Record<number, string> = {
    1043: 'https://explorer.blockdag.network',
    31337: 'http://localhost:8545',
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
  };
  
  const baseUrl = explorers[chainId] || 'https://etherscan.io';
  return `${baseUrl}/${type}/${hash}`;
}

// Time utilities
export function formatTimestamp(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Price utilities
export function formatPrice(price: bigint | string | number, decimals: number = 6): string {
  const formatted = formatTokenAmount(price, decimals);
  const num = parseFloat(formatted);
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  } else {
    return num.toFixed(2);
  }
}

// Investment calculation utilities
export function calculateInvestmentValue(shares: bigint | number, pricePerShare: bigint | string): string {
  const sharesNum = typeof shares === 'bigint' ? Number(shares) : shares;
  const priceNum = typeof pricePerShare === 'bigint' ? 
    parseFloat(formatTokenAmount(pricePerShare, 6)) : 
    parseFloat(String(pricePerShare));
  
  return (sharesNum * priceNum).toFixed(2);
}

// ROI calculation utilities
export function calculateROI(currentValue: number, initialInvestment: number): number {
  if (initialInvestment === 0) return 0;
  return ((currentValue - initialInvestment) / initialInvestment) * 100;
}

// Portfolio utilities
export function calculatePortfolioMetrics(investments: any[]) {
  let totalInvested = 0;
  let currentValue = 0;
  
  investments.forEach(investment => {
    const invested = parseFloat(formatTokenAmount(investment.totalPaid, 6));
    const current = Number(investment.shares) * 110; // Mock current price
    
    totalInvested += invested;
    currentValue += current;
  });
  
  const totalReturns = currentValue - totalInvested;
  const roi = calculateROI(currentValue, totalInvested);
  
  return {
    totalInvested: totalInvested.toFixed(2),
    currentValue: currentValue.toFixed(2),
    totalReturns: totalReturns.toFixed(2),
    roi: roi.toFixed(2)
  };
}

// Health status utilities
export function getHealthStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Excellent': 'text-green-600',
    'Good': 'text-blue-600',
    'Fair': 'text-yellow-600',
    'Poor': 'text-red-600',
  };
  return colors[status] || 'text-gray-600';
}

// Insurance validation
export function validateInsuranceId(insuranceId: string): boolean {
  // Basic validation: starts with INS- followed by year and number
  const pattern = /^INS-\d{4}-\d{3,6}$/;
  return pattern.test(insuranceId);
}

// Age validation for livestock
export function validateLivestockAge(age: number, category: string): boolean {
  const maxAges: Record<string, number> = {
    'Livestock': 300, // 25 years
    'Dairy': 180,     // 15 years
    'Poultry': 60,    // 5 years
    'Fish': 36,       // 3 years
  };
  
  const maxAge = maxAges[category] || 300;
  return age >= 0 && age <= maxAge;
}

// Default export for contract service
export default {
  CONTRACT_ADDRESSES,
  livestockManagerContract,
  testStablecoinContract,
  livestockAssetNFTContract,
  ROLES,
  ROLE_NAMES,
  formatTokenAmount,
  parseTokenAmount,
  getCategoryIcon,
  getStatusBadge,
  isNetworkSupported,
  getNetworkName,
  validateListingData,
  shortenAddress,
  getExplorerUrl,
  formatTimestamp,
  formatPrice,
  calculateInvestmentValue,
  calculateROI,
  calculatePortfolioMetrics,
  getHealthStatusColor,
  validateInsuranceId,
  validateLivestockAge,
};
