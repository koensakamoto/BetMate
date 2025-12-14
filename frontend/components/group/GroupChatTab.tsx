import React from 'react';
import { View, ImageSourcePropType } from 'react-native';
import { GroupMessagingChat } from '../messaging';

interface GroupChatTabProps {
  groupData: {
    id: string | string[];
    name: string;
    memberCount: number;
    createdDate: string;
    image?: ImageSourcePropType | string | null;
  };
}

const GroupChatTab: React.FC<GroupChatTabProps> = ({ groupData }) => {
  // Extract numeric group ID
  const groupId = Array.isArray(groupData.id)
    ? parseInt(groupData.id[0])
    : parseInt(groupData.id as string);

  return (
    <View style={{ flex: 1 }}>
      <GroupMessagingChat
        key={`group-chat-${groupId}`} // Force React to recreate component when groupId changes
        groupId={groupId}
        groupName={groupData.name}
      />
    </View>
  );
};

export default GroupChatTab;