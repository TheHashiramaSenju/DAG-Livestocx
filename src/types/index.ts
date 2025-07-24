export interface AssetListing {
  tokenId: bigint;
  farmer: string;
  totalShares: bigint;
  availableShares: bigint;
  pricePerShare: bigint;
  category: string;
  livestockType: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: bigint;
  details: LivestockDetails;
}

export interface LivestockDetails {
  healthStatus: string;
  age: bigint;
  lastVaccinationDate: bigint;
  insuranceId: string;
}

export interface Investment {
  listingId: bigint;
  investor: string;
  shares: bigint;
  totalPaid: bigint;
  timestamp: bigint;
}

export interface UserRoles {
  isFarmer: boolean;
  isInvestor: boolean;
  isAdmin: boolean;
  isAuditor: boolean;
}

export interface RoleRequest {
  user: string;
  role: string;
  timestamp: bigint;
  isApproved: boolean;
  isPending: boolean;
}

export interface PlatformStats {
  totalAssets: number;
  totalInvestments: number;
  totalVolume: bigint;
  activeUsers: number;
  platformTVL: bigint;
}

export type WalletState = {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  error: string | null;
}

export type TransactionState = {
  isLoading: boolean;
  hash: string | null;
  error: string | null;
  receipt: any | null;
}

export type AppRole = 'farmer' | 'investor' | 'admin' | 'auditor';

export interface ContractInteractionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  data?: any;
}
