import React from "react";
import { useLocalSearchParams } from 'expo-router';
import GroupMemberView from '../../components/group/GroupMemberView';
import GroupPreview from '../../components/group/GroupPreview';

const icon = require("../../assets/images/icon.png");

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();
  
  // Mock data based on groupId - replace with actual API call
  const getGroupData = (id: string | string[]) => {
    const groups: { [key: string]: any } = {
      // Member groups (1-4)
      "1": { name: "Elite Squad", description: "Your main gaming crew", memberCount: 12, totalBets: 47, userPosition: 3, isMember: true },
      "2": { name: "Weekend Warriors", description: "Casual weekend gaming sessions", memberCount: 8, totalBets: 23, userPosition: 2, isMember: true },
      "3": { name: "Strategy Masters", description: "Advanced tactics and competitive play", memberCount: 15, totalBets: 65, userPosition: 7, isMember: true },
      "4": { name: "Night Owls", description: "Late night gaming sessions", memberCount: 6, totalBets: 18, userPosition: 1, isMember: true },
      // Non-member groups (5-10)
      "5": { name: "Gaming Legends", description: "Elite gamers unite for epic battles", memberCount: 1247, totalBets: 892, userPosition: null, isMember: false },
      "6": { name: "Casual Players", description: "Friendly community for casual gaming", memberCount: 589, totalBets: 234, userPosition: null, isMember: false },
      "7": { name: "Speedrun Central", description: "Breaking records and sharing techniques", memberCount: 892, totalBets: 456, userPosition: null, isMember: false },
      "8": { name: "Retro Gamers", description: "Classic games, timeless fun", memberCount: 334, totalBets: 167, userPosition: null, isMember: false },
      "9": { name: "Mobile Masters", description: "Mobile gaming enthusiasts", memberCount: 445, totalBets: 223, userPosition: null, isMember: false },
      "10": { name: "Puzzle Pros", description: "Brain teasers and strategy", memberCount: 278, totalBets: 134, userPosition: null, isMember: false },
    };
    const groupId = Array.isArray(id) ? id[0] : id;
    return groups[groupId] || groups["1"];
  };

  const baseData = getGroupData(groupId);
  const groupData = {
    id: groupId,
    name: baseData.name,
    description: baseData.description,
    memberCount: baseData.memberCount,
    createdDate: "March 2024",
    isAdmin: false,
    isMember: baseData.isMember,
    image: icon,
    totalBets: baseData.totalBets,
    userPosition: baseData.userPosition,
    groupAchievements: 8
  };

  // Render appropriate component based on membership status
  return groupData.isMember 
    ? <GroupMemberView groupData={groupData} />
    : <GroupPreview groupData={groupData} />;
}