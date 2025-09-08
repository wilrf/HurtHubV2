/**
 * Infrastructure Adapter to connect BusinessPreviewService with existing businessDataService
 * Following Repository Pattern - adapts existing service to repository interface
 */

import { businessDataService } from "@/services/businessDataService";
import type { Business } from "@/types/business";
import type { IBusinessRepository } from "@/application/services/BusinessPreviewService";

export class BusinessRepositoryAdapter implements IBusinessRepository {
  /**
   * Find business by name
   */
  async findByName(name: string): Promise<Business | null> {
    const businesses = await this.findAll();
    const normalizedName = name.toLowerCase().trim();
    
    return businesses.find(
      b => b.name.toLowerCase().trim() === normalizedName
    ) || null;
  }

  /**
   * Get all businesses (uses existing service)
   */
  async findAll(): Promise<Business[]> {
    return businessDataService.getAllBusinesses();
  }
}

// Singleton instance
export const businessRepositoryAdapter = new BusinessRepositoryAdapter();