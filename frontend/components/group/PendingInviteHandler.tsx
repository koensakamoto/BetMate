import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { PENDING_INVITE_KEY, PENDING_INVITE_TOKEN_KEY } from '../../app/invite/[groupId]';
import { groupService } from '../../services/group/groupService';

/**
 * Invisible component that checks for pending group invites after login.
 *
 * When a user clicks an invite link while not logged in:
 * 1. The groupId and optional token are saved to SecureStore
 * 2. User is redirected to login
 * 3. After login, this component checks for the pending invite
 * 4. If found, checks membership and navigates appropriately with token
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
        const pendingToken = await SecureStore.getItemAsync(PENDING_INVITE_TOKEN_KEY);

        if (pendingGroupId) {
          // Clear the pending invite data (consume it)
          await SecureStore.deleteItemAsync(PENDING_INVITE_KEY);
          if (pendingToken) {
            await SecureStore.deleteItemAsync(PENDING_INVITE_TOKEN_KEY);
          }

          // Check membership status
          try {
            const groupData = await groupService.getGroupById(parseInt(pendingGroupId, 10));

            if (groupData.userMembershipStatus === 'APPROVED') {
              // Already a member - go directly to the group
              router.replace(`/group/${pendingGroupId}`);
            } else {
              // Not a member - go to preview to join with token if available
              if (pendingToken) {
                router.replace(`/group/${pendingGroupId}/preview?token=${pendingToken}`);
              } else {
                router.replace(`/group/${pendingGroupId}/preview`);
              }
            }
          } catch (error) {
            // Group doesn't exist or error - go to preview which will handle the error
            if (pendingToken) {
              router.replace(`/group/${pendingGroupId}/preview?token=${pendingToken}`);
            } else {
              router.replace(`/group/${pendingGroupId}/preview`);
            }
          }
        }
      } catch (error) {
        console.error('Error checking pending invite:', error);
      }
    };

    checkPendingInvite();
  }, []);

  return null;
}
