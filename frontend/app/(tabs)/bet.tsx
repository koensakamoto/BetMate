import { Text, View } from "react-native";

export default function Bet() {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0a0a0f',
      paddingHorizontal: 20
    }}>
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 16,
        textAlign: 'center'
      }}>
        Bet
      </Text>
      <Text style={{
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center'
      }}>
        Place your bets and track winnings
      </Text>
    </View>
  );
}