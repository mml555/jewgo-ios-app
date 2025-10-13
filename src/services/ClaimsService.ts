import { configService } from '../config/ConfigService';
import { safeAsyncStorage } from './SafeAsyncStorage';

const API_BASE_URL = configService.getApiUrl();

export interface Claim {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_name: string;
  entity_address: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone: string;
  claimant_role?: string;
  business_name?: string;
  status: string;
  evidence_count: number;
  created_at: string;
  reviewed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
}

export interface ClaimEvidence {
  id: string;
  claim_id: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  title?: string;
  description?: string;
  uploaded_at: string;
}

class ClaimsService {
  private static async getAuthToken(): Promise<string | null> {
    try {
      return await safeAsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  private static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async submitClaim(
    entityId: string,
    entityType: string,
    data: {
      claimantName: string;
      claimantPhone: string;
      claimantEmail: string;
      claimantNotes?: string;
      claimantRole?: string;
      businessName?: string;
      businessTaxId?: string;
      businessLicenseNumber?: string;
      yearsAtBusiness?: number;
      evidence?: any[];
    },
  ): Promise<{ success: boolean; claim: Claim; message: string }> {
    return this.makeRequest(`/api/v5/claims/${entityType}/${entityId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getMyClaims(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ claims: Claim[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/api/v5/claims/my-claims?${params.toString()}`);
  }

  static async getClaimDetails(claimId: string): Promise<{
    claim: Claim;
    evidence: ClaimEvidence[];
    history: any[];
  }> {
    return this.makeRequest(`/api/v5/claims/${claimId}`);
  }

  static async cancelClaim(
    claimId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/api/v5/claims/${claimId}`, {
      method: 'DELETE',
    });
  }

  static async uploadEvidence(
    claimId: string,
    evidence: {
      evidenceType: string;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      title?: string;
      description?: string;
    },
  ): Promise<{ success: boolean; evidence: ClaimEvidence }> {
    return this.makeRequest(`/api/v5/claims/${claimId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(evidence),
    });
  }
}

export default ClaimsService;
