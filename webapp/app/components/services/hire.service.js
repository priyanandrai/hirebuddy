import { apiClient } from '../lib/apiClient';
import { HIRE_ENDPOINTS } from '../lib/endpoints';

export const hireBuddy = (payload) => {
  return apiClient(HIRE_ENDPOINTS.HIRE_BUDDY, {
    method: 'POST',
    body: payload,
  });
};

export default { hireBuddy };
