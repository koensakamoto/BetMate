import { Text, View } from "react-native";

export default function Servers() {
  return (
    <View className="flex-1 justify-center items-center bg-white px-5">
      <Text className="text-3xl font-bold text-gray-800 mb-4 text-center">
        Servers
      </Text>
      <Text className="text-lg text-blue-500 text-center">
        Connect to your servers
      </Text>
    </View>
  );
}