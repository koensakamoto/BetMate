import { BaseApiService } from '../api/baseService';
import { API_ENDPOINTS } from '../../config/api';
import { ContactMessageRequest, ContactMessageResponse } from '../../types/api';

/**
 * Service for contact/support operations
 */
export class ContactService extends BaseApiService {
  constructor() {
    super(''); // Contact endpoints use the root API path
  }

  /**
   * Submit a contact/support message
   */
  async submitContactMessage(request: ContactMessageRequest): Promise<ContactMessageResponse> {
    return this.post<ContactMessageResponse>(API_ENDPOINTS.CONTACT_SUBMIT, request);
  }
}

// Export singleton instance
export const contactService = new ContactService();
