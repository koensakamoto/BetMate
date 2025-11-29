import React from 'react';
import { Text, View } from 'react-native';

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  return (
    <View style={{
      alignItems: 'center',
      marginVertical: 16,
      paddingHorizontal: 20
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <View style={{
          flex: 1,
          height: 1,
          backgroundColor: '#2a2a3e',
          marginRight: 12
        }} />
        <Text style={{
          color: '#6b7280',
          fontSize: 12,
          fontWeight: '500'
        }}>
          {date}
        </Text>
        <View style={{
          flex: 1,
          height: 1,
          backgroundColor: '#2a2a3e',
          marginLeft: 12
        }} />
      </View>
    </View>
  );
};

export default React.memo(DateSeparator);
