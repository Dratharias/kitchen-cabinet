import { OrchestratorRequest, OrchestratorResponse } from '@/types';
import { CommonService } from './common';

export class OrchestratorService {
  static async publicate(payload: OrchestratorRequest): Promise<OrchestratorResponse> {
    return CommonService.post<OrchestratorResponse>('/api/publicate', payload, true);
  }

  static createPublicationRequest(
    publicationData: OrchestratorRequest['publications'],
    relatedData?: Omit<OrchestratorRequest, 'action' | 'publications'>
  ): OrchestratorRequest {
    return {
      action: 'create',
      publications: publicationData,
      ...relatedData
    };
  }

  static createReviewRequest(
    reviewData: OrchestratorRequest['reviews'],
    targetData?: Pick<OrchestratorRequest, 'products' | 'publications'>
  ): OrchestratorRequest {
    return {
      action: 'create',
      reviews: reviewData,
      ...targetData
    };
  }
}