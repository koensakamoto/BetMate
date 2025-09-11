import { AxiosRequestConfig } from 'axios';
import { apiClient, handleApiResponse, retryRequest, ApiError } from './baseClient';
import { ApiResponse, PagedResponse } from '../../types/api';

export abstract class BaseApiService {
  protected baseEndpoint: string;

  constructor(baseEndpoint: string) {
    this.baseEndpoint = baseEndpoint;
  }

  // Generic GET request
  protected async get<T>(
    endpoint: string = '',
    config?: AxiosRequestConfig
  ): Promise<T> {
    return retryRequest(async () => {
      const response = await apiClient.get<ApiResponse<T> | T>(
        `${this.baseEndpoint}${endpoint}`,
        config
      );
      return handleApiResponse(response);
    });
  }

  // Generic POST request
  protected async post<T, D = any>(
    endpoint: string = '',
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return retryRequest(async () => {
      const response = await apiClient.post<ApiResponse<T> | T>(
        `${this.baseEndpoint}${endpoint}`,
        data,
        config
      );
      return handleApiResponse(response);
    });
  }

  // Generic PUT request
  protected async put<T, D = any>(
    endpoint: string = '',
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return retryRequest(async () => {
      const response = await apiClient.put<ApiResponse<T> | T>(
        `${this.baseEndpoint}${endpoint}`,
        data,
        config
      );
      return handleApiResponse(response);
    });
  }

  // Generic PATCH request
  protected async patch<T, D = any>(
    endpoint: string = '',
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return retryRequest(async () => {
      const response = await apiClient.patch<ApiResponse<T> | T>(
        `${this.baseEndpoint}${endpoint}`,
        data,
        config
      );
      return handleApiResponse(response);
    });
  }

  // Generic DELETE request
  protected async delete<T>(
    endpoint: string = '',
    config?: AxiosRequestConfig
  ): Promise<T> {
    return retryRequest(async () => {
      const response = await apiClient.delete<ApiResponse<T> | T>(
        `${this.baseEndpoint}${endpoint}`,
        config
      );
      return handleApiResponse(response);
    });
  }

  // Paginated GET request
  protected async getPaginated<T>(
    endpoint: string = '',
    params?: {
      page?: number;
      size?: number;
      sort?: string;
      direction?: 'asc' | 'desc';
      [key: string]: any;
    },
    config?: AxiosRequestConfig
  ): Promise<PagedResponse<T>> {
    return retryRequest(async () => {
      const response = await apiClient.get<ApiResponse<PagedResponse<T>> | PagedResponse<T>>(
        `${this.baseEndpoint}${endpoint}`,
        {
          ...config,
          params: {
            page: params?.page || 0,
            size: params?.size || 20,
            sort: params?.sort,
            direction: params?.direction || 'desc',
            ...params,
          },
        }
      );
      return handleApiResponse(response);
    });
  }

  // Upload file
  protected async uploadFile<T>(
    endpoint: string = '',
    file: File | Blob,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return retryRequest(async () => {
      const response = await apiClient.post<ApiResponse<T> | T>(
        `${this.baseEndpoint}${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return handleApiResponse(response);
    });
  }

  // Check if endpoint is reachable
  protected async healthCheck(): Promise<boolean> {
    try {
      await apiClient.get(`${this.baseEndpoint}/health`);
      return true;
    } catch (error) {
      console.warn(`Health check failed for ${this.baseEndpoint}:`, error);
      return false;
    }
  }

  // Cancel ongoing requests (useful for component unmounting)
  protected createCancelToken() {
    return apiClient.getUri();
  }
}