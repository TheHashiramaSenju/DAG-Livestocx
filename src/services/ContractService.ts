'use client';

import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem';
import { primordialTestnet } from '@/chains';
import { 
  livestockManagerContract, 
  testStablecoinContract, 
  livestockAssetNFTContract 
} from '@/lib/contracts';
import { AssetListing, Investment, LivestockDetails } from '@/types';

class ContractService {
  private publicClient;
  private walletClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: primordialTestnet,
      transport: http()
    });

    if (typeof window !== 'undefined' && window.ethereum) {
      this.walletClient = createWalletClient({
        chain: primordialTestnet,
        transport: custom(window.ethereum)
      });
    }
  }

  // Listing operations
  async getListingCount(): Promise<number> {
    try {
      const count = await this.publicClient.readContract({
        address: livestockManagerContract.address(primordialTestnet.id)!,
        abi: livestockManagerContract.abi,
        functionName: 'listingCounter',
      });
      return Number(count);
    } catch (error) {
      console.error('Error getting listing count:', error);
      return 0;
    }
  }

  async getListing(tokenId: number): Promise<AssetListing | null> {
    try {
      const listing = await this.publicClient.readContract({
        address: livestockManagerContract.address(primordialTestnet.id)!,
        abi: livestockManagerContract.abi,
        functionName: 'listings',
        args: [BigInt(tokenId)],
      });

      return this.formatListing(listing);
    } catch (error) {
      console.error('Error getting listing:', error);
      return null;
    }
  }

  async getAllListings(): Promise<AssetListing[]> {
    try {
      const count = await this.getListingCount();
      const listings: AssetListing[] = [];

      for (let i = 1; i <= count; i++) {
        const listing = await this.getListing(i);
        if (listing) {
          listings.push(listing);
        }
      }

      return listings;
    } catch (error) {
      console.error('Error getting all listings:', error);
      return [];
    }
  }

  async getUserListings(userAddress: string): Promise<AssetListing[]> {
    try {
      const allListings = await this.getAllListings();
      return allListings.filter(listing => 
        listing.farmer.toLowerCase() === userAddress.toLowerCase()
      );
    } catch (error) {
      console.error('Error getting user listings:', error);
      return [];
    }
  }

  // Investment operations
  async getUserInvestments(userAddress: string): Promise<Investment[]> {
    try {
      // This would typically query investment events or mappings
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('Error getting user investments:', error);
      return [];
    }
  }

  // Token operations
  async getStablecoinBalance(userAddress: string): Promise<string> {
    try {
      const balance = await this.publicClient.readContract({
        address: testStablecoinContract.address(primordialTestnet.id)!,
        abi: testStablecoinContract.abi,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      });

      return (Number(balance) / 1e6).toString(); // Assuming 6 decimals
    } catch (error) {
      console.error('Error getting stablecoin balance:', error);
      return '0';
    }
  }

  async getStablecoinAllowance(owner: string, spender: string): Promise<string> {
    try {
      const allowance = await this.publicClient.readContract({
        address: testStablecoinContract.address(primordialTestnet.id)!,
        abi: testStablecoinContract.abi,
        functionName: 'allowance',
        args: [owner as `0x${string}`, spender as `0x${string}`],
      });

      return (Number(allowance) / 1e6).toString();
    } catch (error) {
      console.error('Error getting allowance:', error);
      return '0';
    }
  }

  // Role checking
  async hasRole(role: string, userAddress: string): Promise<boolean> {
    try {
      const hasRole = await this.publicClient.readContract({
        address: livestockManagerContract.address(primordialTestnet.id)!,
        abi: livestockManagerContract.abi,
        functionName: 'hasRole',
        args: [role as `0x${string}`, userAddress as `0x${string}`],
      });

      return Boolean(hasRole);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  // Pending withdrawals
  async getPendingWithdrawals(userAddress: string): Promise<string> {
    try {
      const pending = await this.publicClient.readContract({
        address: livestockManagerContract.address(primordialTestnet.id)!,
        abi: livestockManagerContract.abi,
        functionName: 'pendingWithdrawals',
        args: [userAddress as `0x${string}`],
      });

      return (Number(pending) / 1e6).toString();
    } catch (error) {
      console.error('Error getting pending withdrawals:', error);
      return '0';
    }
  }

  // Utility methods
  private formatListing(rawListing: any): AssetListing {
    const [
      tokenId,
      farmer,
      totalShares,
      availableShares,
      pricePerShare,
      category,
      livestockType,
      isActive,
      isVerified,
      createdAt,
      details
    ] = rawListing;

    return {
      tokenId: BigInt(tokenId),
      farmer,
      totalShares: BigInt(totalShares),
      availableShares: BigInt(availableShares),
      pricePerShare: BigInt(pricePerShare),
      category,
      livestockType,
      isActive,
      isVerified,
      createdAt: BigInt(createdAt),
      details: {
        healthStatus: details[0],
        age: BigInt(details[1]),
        lastVaccinationDate: BigInt(details[2]),
        insuranceId: details[3],
      }
    };
  }

  // Event listening
  watchListingCreated(callback: (event: any) => void) {
    return this.publicClient.watchContractEvent({
      address: livestockManagerContract.address(primordialTestnet.id)!,
      abi: livestockManagerContract.abi,
      eventName: 'ListingCreated',
      onLogs: callback,
    });
  }

  watchInvestmentMade(callback: (event: any) => void) {
    return this.publicClient.watchContractEvent({
      address: livestockManagerContract.address(primordialTestnet.id)!,
      abi: livestockManagerContract.abi,
      eventName: 'InvestmentMade',
      onLogs: callback,
    });
  }

  watchRoleRequested(callback: (event: any) => void) {
    return this.publicClient.watchContractEvent({
      address: livestockManagerContract.address(primordialTestnet.id)!,
      abi: livestockManagerContract.abi,
      eventName: 'RoleRequested',
      onLogs: callback,
    });
  }
}

export const contractService = new ContractService();
export default ContractService;
