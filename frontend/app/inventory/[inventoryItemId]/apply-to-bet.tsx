import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { inventoryService, EligibleBetsResponse, EligibleBet } from '../../../services/inventory/inventoryService';
import { insuranceService } from '../../../services/insurance/insuranceService';
import { errorLog, debugLog } from '../../../config/env';

export default function ApplyToBetScreen() {
  const insets = useSafeAreaInsets();
  const { inventoryItemId } = useLocalSearchParams<{ inventoryItemId: string }>();
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [data, setData] = useState<EligibleBetsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inventoryItemId) {
      loadEligibleBets();
    }
  }, [inventoryItemId]);

  const loadEligibleBets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryService.getEligibleBets(parseInt(inventoryItemId));
      setData(response);
      debugLog('Eligible bets loaded:', response);
    } catch (err: any) {
      errorLog('Failed to load eligible bets:', err);
      setError(err.message || 'Failed to load eligible bets');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyInsurance = async (bet: EligibleBet) => {
    if (!bet.canApply || applying) return;

    try {
      setApplying(bet.betId);
      await insuranceService.applyInsuranceToBet(bet.betId, parseInt(inventoryItemId));
      router.back();
    } catch (err: any) {
      errorLog('Failed to apply insurance:', err);
      setError(err.message || 'Failed to apply insurance');
      setApplying(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const eligibleBets = data?.eligibleBets?.filter(bet => bet.canApply) || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Solid background behind status bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />

      {/* Header */}
      <View style={{
        marginTop: insets.top,
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#0a0a0f'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 22,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              Apply Insurance
            </Text>
          </View>
        </View>

        {data && (
          <View style={{
            backgroundColor: 'rgba(0, 212, 170, 0.06)',
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: 'rgba(0, 212, 170, 0.15)'
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 4
            }}>
              {data.itemName}
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: data.usesRemaining !== undefined ? 8 : 0
            }}>
              {data.description}
            </Text>
            {data.usesRemaining !== undefined && (
              <Text style={{
                fontSize: 12,
                color: '#00D4AA',
                fontWeight: '500'
              }}>
                {data.usesRemaining} use{data.usesRemaining !== 1 ? 's' : ''} remaining
              </Text>
            )}
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00D4AA" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <MaterialIcons name="error-outline" size={32} color="#EF4444" />
          </View>
          <Text style={{
            color: '#ffffff',
            fontSize: 17,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 8
          }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadEligibleBets}
            style={{
              backgroundColor: '#00D4AA',
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 12,
              marginTop: 16
            }}
          >
            <Text style={{ color: '#000000', fontWeight: '600', fontSize: 15 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20
          }}
          showsVerticalScrollIndicator={false}
        >
          {eligibleBets.length > 0 ? (
            <View>
              {eligibleBets.map((bet, index) => (
                <View
                  key={bet.betId}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.04)'
                  }}
                >
                  {/* Bet Title */}
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#ffffff',
                    marginBottom: 8,
                    lineHeight: 22
                  }} numberOfLines={2}>
                    {bet.title}
                  </Text>

                  {/* Group Name */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <MaterialIcons name="groups" size={14} color="rgba(255, 255, 255, 0.4)" />
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginLeft: 6
                    }}>
                      {bet.groupName}
                    </Text>
                  </View>

                  {/* Bet Details Row */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255, 255, 255, 0.06)',
                    marginBottom: 12
                  }}>
                    <View>
                      <Text style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.4)',
                        marginBottom: 4
                      }}>
                        Stake
                      </Text>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#ffffff'
                      }}>
                        {bet.betAmount}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.4)',
                        marginBottom: 4
                      }}>
                        Deadline
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}>
                        {formatDate(bet.deadline)}
                      </Text>
                    </View>
                  </View>

                  {/* Choice/Prediction */}
                  {bet.chosenOptionText && (
                    <View style={{
                      backgroundColor: 'rgba(0, 212, 170, 0.06)',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      marginBottom: 12
                    }}>
                      <Text style={{
                        fontSize: 12,
                        color: 'rgba(0, 212, 170, 0.6)',
                        marginBottom: 2
                      }}>
                        Your choice
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#00D4AA'
                      }}>
                        {bet.chosenOptionText}
                      </Text>
                    </View>
                  )}

                  {/* Apply Insurance Button */}
                  <TouchableOpacity
                    onPress={() => handleApplyInsurance(bet)}
                    disabled={applying === bet.betId}
                    style={{
                      paddingVertical: 12,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(0, 212, 170, 0.3)',
                      opacity: applying === bet.betId ? 0.5 : 1
                    }}
                    activeOpacity={0.6}
                  >
                    {applying === bet.betId ? (
                      <ActivityIndicator size="small" color="#00D4AA" />
                    ) : (
                      <Text style={{
                        color: '#00D4AA',
                        fontSize: 14,
                        fontWeight: '500'
                      }}>
                        Apply Insurance
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: 80
            }}>
              <MaterialIcons name="inbox" size={48} color="rgba(255, 255, 255, 0.15)" style={{ marginBottom: 16 }} />
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: 6
              }}>
                No eligible bets
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                Place a bet to use this item
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
