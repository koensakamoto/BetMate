import React from 'react';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const icon = require("../../assets/images/icon.png");

interface BetCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryIcon: string;
  timeRemaining: string;
  participantCount: number;
  participantAvatars: any[];
  stakeAmount: number;
  yourPosition?: string;
  status: 'open' | 'active' | 'resolved';
  isJoined: boolean;
  creatorName: string;
  resolution?: string;
}

export default function BetCard({
  id,
  title,
  description,
  category,
  categoryIcon,
  timeRemaining,
  participantCount,
  participantAvatars,
  stakeAmount,
  yourPosition,
  status,
  isJoined,
  creatorName,
  resolution
}: BetCardProps) {
  
  const handlePress = () => {
    // Navigate to bet details
    router.push(`/bet-details/${id}`);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
      }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          {/* Title */}
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginBottom: 4,
            lineHeight: 22
          }} numberOfLines={2}>
            {title}
          </Text>

          {/* Creator */}
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: 2
          }}>
            by {creatorName}
          </Text>
        </View>

        {/* Time & Stake */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 14,
            color: '#ffffff',
            fontWeight: '600',
            marginBottom: 2
          }}>
            ${stakeAmount}
          </Text>
          <Text style={{
            fontSize: 12,
            color: timeRemaining.includes('h') && !timeRemaining.includes('d') ? 
              '#FF4757' : 'rgba(255, 255, 255, 0.5)',
            fontWeight: '500'
          }}>
            {timeRemaining}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Participants & Category */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1
        }}>
          {/* Avatar Stack */}
          <View style={{
            flexDirection: 'row',
            marginRight: 8
          }}>
            {participantAvatars.slice(0, 2).map((avatar, index) => (
              <Image
                key={index}
                source={avatar}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  marginLeft: index > 0 ? -6 : 0,
                  borderWidth: 1.5,
                  borderColor: '#0a0a0f'
                }}
              />
            ))}
          </View>

          {/* Participant Count & Category */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)',
              marginRight: 8
            }}>
              {participantCount}
            </Text>
            
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 10, marginRight: 3 }}>{categoryIcon}</Text>
              <Text style={{
                fontSize: 10,
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500'
              }}>
                {category}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {!isJoined && status === 'open' ? (
          <TouchableOpacity
            style={{
              backgroundColor: '#00D4AA',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16
            }}
            onPress={(e) => {
              e.stopPropagation();
              // Handle join bet
              console.log('Join bet:', id);
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#000000'
            }}>
              Join
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{
            backgroundColor: isJoined ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: isJoined ? '#00D4AA' : 'rgba(255, 255, 255, 0.6)'
            }}>
              {isJoined ? 'Joined' : 'View'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}