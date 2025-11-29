import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BaseToast, ErrorToast, ToastConfig as ToastConfigType } from 'react-native-toast-message';

interface CustomToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
}

const SuccessToast = ({ text1, text2 }: CustomToastProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#00D4AA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(0, 212, 170, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name="check-circle" size={22} color="#00D4AA" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const CustomErrorToast = ({ text1, text2 }: CustomToastProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name="error" size={22} color="#FF6B6B" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const InfoToast = ({ text1, text2 }: CustomToastProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#4A9EFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(74, 158, 255, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name="info" size={22} color="#4A9EFF" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const WarningToast = ({ text1, text2 }: CustomToastProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        marginHorizontal: 16,
        backgroundColor: '#1a1a1f',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#FFB84D',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 184, 77, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name="warning" size={22} color="#FFB84D" />
      </View>
      <View style={{ flex: 1 }}>
        {text1 && (
          <Text
            style={{
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '600',
              marginBottom: text2 ? 2 : 0,
            }}
          >
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 13,
            }}
            numberOfLines={2}
          >
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

export const toastConfig: ToastConfigType = {
  success: (props) => <SuccessToast text1={props.text1} text2={props.text2} />,
  error: (props) => <CustomErrorToast text1={props.text1} text2={props.text2} />,
  info: (props) => <InfoToast text1={props.text1} text2={props.text2} />,
  warning: (props) => <WarningToast text1={props.text1} text2={props.text2} />,
};
