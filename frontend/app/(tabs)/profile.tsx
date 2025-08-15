import { Text, View, Image, TouchableOpacity } from "react-native";
import icon from "../../assets/images/icon.png";

export default function Profile() {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: 'white' }}>
      {/* Top container for user profile */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Image 
          source={icon}
          style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 10 }}
        />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          @accountname
    </Text>
        <Text style={{ textAlign: 'center', marginTop: 8 }}>
          Add bio or bio text
        </Text>
    </View>

      {/* Stats container */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>120</Text>
          <Text>Following</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>350</Text>
          <Text>Followers</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>1.2K</Text>
          <Text>Likes</Text>
        </View>
    </View>

      {/* Edit profile button */}
      <TouchableOpacity style={{ 
        backgroundColor: '#007AFF', 
        padding: 12, 
        borderRadius: 8, 
        alignItems: 'center',
        marginBottom: 20 
      }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit Profile</Text>
      </TouchableOpacity>


    </View>
  );
}