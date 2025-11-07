import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: number;
  reason: string;
  timestamp: string;
  balanceBefore: number;
  balanceAfter: number;
  correlationId?: string;
}

interface TransactionHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'CREDIT':
      return 'add-circle';
    case 'DEBIT':
      return 'remove-circle';
    case 'TRANSFER_IN':
      return 'call-received';
    case 'TRANSFER_OUT':
      return 'call-made';
    default:
      return 'receipt';
  }
};

const getTransactionColor = (type: Transaction['type']) => {
  switch (type) {
    case 'CREDIT':
    case 'TRANSFER_IN':
      return '#4CAF50'; // Green for credits/incoming
    case 'DEBIT':
    case 'TRANSFER_OUT':
      return '#F44336'; // Red for debits/outgoing
    default:
      return '#ffffff';
  }
};

const getTransactionPrefix = (type: Transaction['type']) => {
  switch (type) {
    case 'CREDIT':
    case 'TRANSFER_IN':
      return '+';
    case 'DEBIT':
    case 'TRANSFER_OUT':
      return '-';
    default:
      return '';
  }
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default function TransactionHistoryModal({ visible, onClose, transactions }: TransactionHistoryModalProps) {
  const insets = useSafeAreaInsets();

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.08)'
    }}>
      {/* Transaction Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <MaterialIcons
            name={getTransactionIcon(item.type)}
            size={20}
            color={getTransactionColor(item.type)}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: 2
            }}>
              {item.reason}
            </Text>
            <Text style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: getTransactionColor(item.type),
          letterSpacing: -0.3
        }}>
          {getTransactionPrefix(item.type)}{item.amount.toLocaleString()}
        </Text>
      </View>

      {/* Balance Change */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        <Text style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          Balance: {item.balanceBefore.toLocaleString()} → {item.balanceAfter.toLocaleString()}
        </Text>

        <Text style={{
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.3)',
          fontFamily: 'monospace'
        }}>
          {item.type}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: '#0a0a0f'
      }}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#ffffff'
            }}>
              Transaction History
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <MaterialIcons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions List */}
        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: insets.bottom + 20
            }}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            getItemLayout={(data, index) => {
              const ITEM_HEIGHT = 110; // Estimated height of transaction item
              return {
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              };
            }}
            initialNumToRender={8}
            maxToRenderPerBatch={5}
            windowSize={7}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
          />
        ) : (
          /* Empty State */
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40
          }}>
            <MaterialIcons
              name="receipt-long"
              size={64}
              color="rgba(255, 255, 255, 0.2)"
              style={{ marginBottom: 16 }}
            />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.6)',
              textAlign: 'center',
              marginBottom: 8
            }}>
              No Transactions Yet
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.4)',
              textAlign: 'center',
              lineHeight: 20
            }}>
              Your credit transactions will appear here when you earn, spend, or transfer credits.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}