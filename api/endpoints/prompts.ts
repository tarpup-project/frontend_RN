import { UrlConstants } from '../../constants/apiUrls';
import {
    AllPromptsResponse,
    Category,
    SubmitRequestResponse
} from '../../types/prompts';
import { api } from '../client';

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
    
    const url = UrlConstants.fetchAllRequests(
      params?.campusID,
      params?.stateID,
      params?.categoryID,
      params?.userID
    );    
    const response = await api.get<{ data: AllPromptsResponse }>(url);
    
    // Console log the entire response JSON stringified
    console.log('Prompts API Response:', JSON.stringify(response, null, 2));
    
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

  static async reportPrompt(promptID: string): Promise<void> {
    await api.post(`/activities/requests/report/${promptID}`, {});
  }
}