import { BACKEND_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateClientConfig } from './client/client.gen';

export const createClientConfig: CreateClientConfig = config => {
  if (!config) {
    throw new Error('Config is not provided.');
  }

  console.log('Creating custom client config with provided');
  const backendUrl = BACKEND_URL;
  console.log('BACKEND_URL:', backendUrl);
  if (!backendUrl) {
    throw new Error('Environment variable BACKEND_URL is not set or is empty.');
  }

  return {
    ...config,
    baseUrl: backendUrl,
    headers: {
      ...config.headers,
      Accept: 'application/json',
    },
    // Use a custom fetch that handles auth properly
    fetch: async (input, init) => {
      // Get auth token
      let authToken = '';
      try {
        authToken = (await AsyncStorage.getItem('idToken')) || '';
      } catch (error) {
        console.error('Error getting auth token:', error);
      }

      // Handle both string URL and Request object
      let url: string;
      let options: RequestInit = {};

      if (typeof input === 'string') {
        url = input;
        options = init || {};
      } else if (input instanceof Request) {
        url = input.url;
        options = {
          method: input.method,
          headers: input.headers,
          ...init,
        };
      } else {
        throw new Error('Invalid input to fetch');
      }

      // Add auth header
      const headers = {
        ...options.headers,
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      };

      return fetch(url, {
        ...options,
        headers,
      });
    },
  };
};
