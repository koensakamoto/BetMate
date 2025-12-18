import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { PENDING_INVITE_KEY } from '../../app/invite/[groupId]';

/**
 * Invisible component that checks for pending group invites after login.
 *
 * When a user clicks an invite link while not logged in:
 * 1. The groupId is saved to SecureStore
 * 2. User is redirected to login
 * 3. After login, this component checks for the pending invite
 * 4. If found, navigates to the group preview page
 */
export default function PendingInviteHandler() {
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only check once per mount
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkPendingInvite = async () => {
      try {
        const pendingGroupId = await SecureStore.getItemAsync(PENDING_INVITE_KEY);
        if (pendingGroupId) {
          // Clear the pending invite (consume it)
          await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
          // Navigate to the group preview
          router.replace(`/group/${pendingGroupId}/preview`);
        }
      } catch (error) {
        console.error('Error checking pending invite:', error);
      }
    };

    checkPendingInvite();
  }, []);

  return null;
}
