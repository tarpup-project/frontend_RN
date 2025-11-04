import { api } from '../client';
import { UrlConstants } from '../../constants/apiUrls';
import {
  Category,
  AllPromptsResponse,
  SubmitRequestPayload,
  SubmitRequestResponse,
} from '../../types/prompts';

export class PromptsAPI {

  static async fetchCategories(): Promise<Category[]> {
    const response = await api.get<{ data: Category[] }>(UrlConstants.fetchAllCatgories);
    return response.data.data;
  }


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


  static async joinPublicGroup(groupID: string): Promise<void> {
    await api.post(UrlConstants.fetchGroupDetails(groupID), {});
  }
}