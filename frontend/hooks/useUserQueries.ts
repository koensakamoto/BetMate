import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userService,
  UserProfileResponse,
  UserProfileUpdateRequest,
  UserStatistics,
  ProfileVisibility,
} from '../services/user/userService';

// Query keys for cache management
export const userKeys = {
  all: ['user'] as const,
  currentProfile: () => [...userKeys.all, 'currentProfile'] as const,
  profile: (userId: number) => [...userKeys.all, 'profile', userId] as const,
  statistics: (userId: number) => [...userKeys.all, 'statistics', userId] as const,
  search: (query: string) => [...userKeys.all, 'search', query] as const,
  visibility: () => [...userKeys.all, 'visibility'] as const,
  usernameAvailability: (username: string) => [...userKeys.all, 'usernameAvailability', username] as const,
  notificationPreferences: () => [...userKeys.all, 'notificationPreferences'] as const,
};

/**
 * Hook to fetch current user's profile
 */
export function useCurrentUserProfile() {
  return useQuery({
    queryKey: userKeys.currentProfile(),
    queryFn: () => userService.getCurrentUserProfile(),
  });
}

/**
 * Hook to fetch a user's profile by ID
 */
export function useUserProfile(userId: number | undefined) {
  return useQuery({
    queryKey: userKeys.profile(userId!),
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to fetch user statistics
 */
export function useUserStatistics(userId: number | undefined) {
  return useQuery({
    queryKey: userKeys.statistics(userId!),
    queryFn: () => userService.getUserStatistics(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook to search users
 */
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: userKeys.search(query),
    queryFn: () => userService.searchUsers(query),
    enabled: query.length > 0,
  });
}

/**
 * Hook to get profile visibility setting
 */
export function useProfileVisibility() {
  return useQuery({
    queryKey: userKeys.visibility(),
    queryFn: () => userService.getProfileVisibility(),
  });
}

/**
 * Hook to check username availability
 */
export function useUsernameAvailability(username: string) {
  return useQuery({
    queryKey: userKeys.usernameAvailability(username),
    queryFn: () => userService.checkUsernameAvailability(username),
    enabled: username.length >= 3,
  });
}

/**
 * Hook to get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: userKeys.notificationPreferences(),
    queryFn: () => userService.getNotificationPreferences(),
  });
}

/**
 * Hook to invalidate user caches
 */
export function useInvalidateUser() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
    invalidateCurrentProfile: () => queryClient.invalidateQueries({ queryKey: userKeys.currentProfile() }),
    invalidateProfile: (userId: number) => queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) }),
    invalidateStatistics: (userId: number) => queryClient.invalidateQueries({ queryKey: userKeys.statistics(userId) }),
  };
}

/**
 * Hook for updating user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserProfileUpdateRequest) => userService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(userKeys.currentProfile(), updatedProfile);
      if (updatedProfile.id) {
        queryClient.invalidateQueries({ queryKey: userKeys.profile(updatedProfile.id) });
      }
    },
  });
}

/**
 * Hook for uploading profile picture
 */
export function useUploadProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageUri, fileName }: { imageUri: string; fileName: string }) =>
      userService.uploadProfilePicture(imageUri, fileName),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(userKeys.currentProfile(), updatedProfile);
      if (updatedProfile.id) {
        queryClient.invalidateQueries({ queryKey: userKeys.profile(updatedProfile.id) });
      }
    },
  });
}

/**
 * Hook for updating profile visibility
 */
export function useUpdateProfileVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visibility: ProfileVisibility) => userService.updateProfileVisibility(visibility),
    onSuccess: (response) => {
      queryClient.setQueryData(userKeys.visibility(), response);
    },
  });
}

/**
 * Hook for changing username
 */
export function useChangeUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newUsername: string) => userService.changeUsername(newUsername),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.currentProfile() });
    },
  });
}

/**
 * Hook for updating notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Parameters<typeof userService.updateNotificationPreferences>[0]) =>
      userService.updateNotificationPreferences(preferences),
    onSuccess: (response) => {
      queryClient.setQueryData(userKeys.notificationPreferences(), response);
    },
  });
}
