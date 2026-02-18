import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { Note, CreateNotePayload } from '../types/note';

/**
 * Parameters for fetching notes with pagination and search
 */
export interface FetchNotesParams {
  page?: number;
  perPage?: number;
  search?: string;
}

/**
 * Response structure for fetching notes
 */
export interface FetchNotesResponse {
  notes: Note[];
  totalPages: number;
}

const API_BASE_URL = 'https://notehub-public.goit.study/api';

let accessToken: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJwb2x1Ym90a2E4NjVAZ21haWwuY29tIiwiaWF0IjoxNzcxNDI2OTg2fQ.pqLH1Gh1MSV0x1FwjUNxmL9mdZIOv2AgIdZdiaUj7oc';

/**
 * Auth token response
 */
export interface AuthResponse {
  token: string;
}

/**
 * Set the authorization token for requests
 */
const setAuthToken = (token: string) => {
  accessToken = token;
};

/**
 * Get or create access token
 */
const getAccessToken = async (): Promise<string> => {
  if (accessToken) {
    return accessToken;
  }

  // Avoid multiple simultaneous auth requests
  // This block won't be reached since we have a default token
  if (false) {
    return '';
  }

  return accessToken;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to ensure token is set before each request
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to set auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Fetch notes with optional pagination and search filtering
 * @param params - Query parameters including page, perPage, and search
 * @returns Promise with notes data and pagination info
 */
export const fetchNotes = async (
  params: FetchNotesParams = {}
): Promise<AxiosResponse<FetchNotesResponse>> => {
  const { page = 1, perPage = 12, search = '' } = params;

  return axiosInstance.get<FetchNotesResponse>('/notes', {
    params: {
      page,
      perPage,
      ...(search && { search }),
    },
  });
};

/**
 * Create a new note on the server
 * @param payload - Note content to create
 * @returns Promise with the created note
 */
export const createNote = async (
  payload: CreateNotePayload
): Promise<AxiosResponse<Note>> => {
  return axiosInstance.post<Note>('/notes', payload);
};

/**
 * Delete a note by its ID
 * @param id - The note ID to delete
 * @returns Promise with the deleted note information
 */
export const deleteNote = async (id: string): Promise<AxiosResponse<Note>> => {
  return axiosInstance.delete<Note>(`/notes/${id}`);
};
