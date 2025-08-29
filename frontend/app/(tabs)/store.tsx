import { Text, View } from "react-native";

export default function Store() {
  return (
    <View className="flex-1 justify-center items-center bg-white px-5">
      <Text className="text-3xl font-bold text-gray-800 mb-4 text-center">
        Store
      </Text>
      <Text className="text-lg text-blue-500 text-center">
        Shop for items and rewards
      </Text>
    </View>
  );
}