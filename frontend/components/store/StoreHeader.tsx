import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StoreHeaderProps {
  credits: number;
  onEarnCredits: () => void;
  onTransactionHistory: () => void;
}

function StoreHeader({ credits, onEarnCredits, onTransactionHistory }: StoreHeaderProps) {
  return (
    <View style={{
      paddingHorizontal: 20,
      paddingTop: 0,
      marginBottom: 20
    }}>
      {/* Credits and Actions Row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24
      }}>
        {/* Credits Display */}
        <View style={{
          flex: 1
        }}>
          {/* Credits Balance */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            marginBottom: 8
          }}>
            <Text style={{
              fontSize: 32,
              fontWeight: '600',
              color: '#ffffff',
              letterSpacing: -0.8
            }}>
              {credits.toLocaleString()}
            </Text>
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.5)',
              marginLeft: 8,
              fontWeight: '400'
            }}>
              credits
            </Text>
          </View>

          {/* Simple Earn Button */}
          <TouchableOpacity
            onPress={onEarnCredits}
            style={{
              alignSelf: 'flex-start',
              marginTop: 4
            }}
          >
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500',
              textDecorationLine: 'underline'
            }}>
              Earn more
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History Button */}
        <TouchableOpacity
          onPress={onTransactionHistory}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            marginTop: 4
          }}
        >
          <MaterialIcons name="receipt-long" size={18} color="rgba(255, 255, 255, 0.8)" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(StoreHeader);