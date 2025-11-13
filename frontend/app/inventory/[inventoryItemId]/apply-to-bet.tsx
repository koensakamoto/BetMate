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

  const handleApplyToBet = async (bet: EligibleBet) => {
    if (!bet.canApply || applying) return;

    try {
      setApplying(bet.betId);
      // Apply insurance to the bet
      await insuranceService.applyInsuranceToBet(bet.betId, parseInt(inventoryItemId));

      // Success - navigate back
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
  const ineligibleBets = data?.eligibleBets?.filter(bet => !bet.canApply) || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={true} />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#0a0a0f',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#ffffff'
            }}>
              Apply {data?.itemName || 'Item'}
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 2
            }}>
              Select a bet to protect
            </Text>
          </View>
        </View>

        {data && (
          <View style={{
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: 'rgba(0, 212, 170, 0.2)'
          }}>
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: 4
            }}>
              Item Details
            </Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {data.description}
            </Text>
            {data.usesRemaining !== undefined && (
              <Text style={{
                fontSize: 12,
                color: '#00D4AA',
                marginTop: 4
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 18, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadEligibleBets}
            style={{
              backgroundColor: '#00D4AA',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 20
            }}
          >
            <Text style={{ color: '#000000', fontWeight: '600', fontSize: 16 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Eligible Bets */}
          {eligibleBets.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 12
              }}>
                Eligible Bets ({eligibleBets.length})
              </Text>

              {eligibleBets.map((bet) => (
                <TouchableOpacity
                  key={bet.betId}
                  onPress={() => handleApplyToBet(bet)}
                  disabled={applying !== null}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(0, 212, 170, 0.3)',
                    opacity: applying && applying !== bet.betId ? 0.5 : 1
                  }}
                  activeOpacity={0.7}
                >
                  {applying === bet.betId && (
                    <View style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1
                    }}>
                      <ActivityIndicator size="large" color="#00D4AA" />
                    </View>
                  )}

                  {/* Bet Title */}
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: 8
                  }} numberOfLines={2}>
                    {bet.title}
                  </Text>

                  {/* Group Name */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <MaterialIcons name="groups" size={14} color="rgba(255, 255, 255, 0.5)" />
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginLeft: 6
                    }}>
                      {bet.groupName}
                    </Text>
                  </View>

                  {/* Bet Details */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 12,
                    borderTopWidth: 0.5,
                    borderTopColor: 'rgba(255, 255, 255, 0.1)'
                  }}>
                    <View>
                      <Text style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: 2
                      }}>
                        Your Bet
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="monetization-on" size={14} color="#FFD700" />
                        <Text style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: '#FFD700',
                          marginLeft: 4
                        }}>
                          {bet.betAmount}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: 2
                      }}>
                        Deadline
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#ffffff'
                      }}>
                        {formatDate(bet.deadline)}
                      </Text>
                    </View>
                  </View>

                  {/* Choice/Prediction */}
                  {bet.chosenOptionText && (
                    <View style={{
                      marginTop: 12,
                      backgroundColor: 'rgba(0, 212, 170, 0.1)',
                      padding: 10,
                      borderRadius: 8
                    }}>
                      <Text style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: 2
                      }}>
                        Your Choice
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#00D4AA'
                      }}>
                        {bet.chosenOptionText}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Ineligible Bets */}
          {ineligibleBets.length > 0 && (
            <View>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: 12
              }}>
                Not Eligible ({ineligibleBets.length})
              </Text>

              {ineligibleBets.map((bet) => (
                <View
                  key={bet.betId}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    opacity: 0.6
                  }}
                >
                  {/* Bet Title */}
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: 8
                  }} numberOfLines={2}>
                    {bet.title}
                  </Text>

                  {/* Reason */}
                  {bet.reason && (
                    <View style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 8
                    }}>
                      <Text style={{
                        fontSize: 13,
                        color: '#EF4444',
                        fontWeight: '500'
                      }}>
                        {bet.reason}
                      </Text>
                    </View>
                  )}

                  {/* Group Name */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <MaterialIcons name="groups" size={14} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={{
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginLeft: 6
                    }}>
                      {bet.groupName}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* No Bets */}
          {eligibleBets.length === 0 && ineligibleBets.length === 0 && (
            <View style={{
              alignItems: 'center',
              paddingVertical: 60
            }}>
              <MaterialIcons name="inbox" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                marginTop: 16,
                fontWeight: '500'
              }}>
                No active bets found
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
                marginTop: 8
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
