import { api } from '../client';
import { UrlConstants } from '../../constants/apiUrls';
import {
  Category,
  AllPromptsResponse,
  SubmitRequestPayload,
  SubmitRequestResponse,
} from '../../types/prompts';

export class PromptsAPI {
  /**
   * Fetch all categories
   */
  static async fetchCategories(): Promise<Category[]> {
    const response = await api.get<{ data: Category[] }>(UrlConstants.fetchAllCatgories);
    return response.data.data;
  }

  /**
   * Fetch all prompts/requests with optional filters
   * @param campusID - Filter by university (for students)
   * @param stateID - Filter by state (for non-students)
   * @param categoryID - Filter by category
   * @param userID - Filter by user
   */
  static async fetchPrompts(params?: {
    campusID?: string;
    stateID?: string;
    categoryID?: string;
    userID?: string;
  }): Promise<AllPromptsResponse> {
    const response = await api.get<{ data: AllPromptsResponse }>(
      UrlConstants.fetchAllRequests(
        params?.campusID,
        params?.stateID,
        params?.categoryID,
        params?.userID
      )
    );
    return response.data.data;
  }

  /**
   * Submit a request to match with a prompt
   * @param requestID - The ID of the prompt to request
   */
  static async submitRequest(requestID: string): Promise<SubmitRequestResponse> {
    const response = await api.post<{ data: SubmitRequestResponse }>(
      UrlConstants.submitRequest,
      { requestID }
    );
    return {
      success: true,
      message: response.data.data.message || 'Request submitted successfully',
    };
  }

  /**
   * Join a public group from a prompt
   * @param groupID - The public group ID
   */
  static async joinPublicGroup(groupID: string): Promise<void> {
    await api.post(UrlConstants.fetchGroupDetails(groupID), {});
  }
}