import React from 'react';
import { Text, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

interface GroupCardProps {
    name: string;
    memberCount: number;
    img?: any;
    description?: string;
    memberAvatars?: any[];
    isJoined?: boolean;
    groupId?: string;
}

const GroupCard: React.FC<GroupCardProps> = ({ 
    name, 
    img, 
    description,
    memberCount, 
    memberAvatars, 
    isJoined = false,
    groupId


}) => {
    const handlePress = () => {
        if (groupId) {
            router.push(`/group/${groupId}`);
        }
    };
    const renderMemberAvatars = () => {
        if (!memberAvatars || memberAvatars.length === 0) return null;

        return (
            <View style={styles.avatarsContainer}>
                {memberAvatars.slice(0, 3).map((avatar, index) => (
                    <Image
                        key={index}
                        source={avatar}
                        style={[
                            styles.avatar,
                            index > 0 && { marginLeft: -6 }
                        ]}
                    />
                ))}
                {memberAvatars.length > 3 && (
                    <View style={[styles.avatar, styles.avatarExtra, { marginLeft: -6 }]}>
                        <Text style={styles.avatarExtraText}>
                            +{memberAvatars.length - 3}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress}>
            {/* Profile Image */}
            {img && (
                <View style={styles.imageContainer}>
                    <Image source={img} style={styles.profileImage} />
                </View>
            )}
            
            {/* Group Info */}
            <Text 
                style={styles.title}
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {name}
            </Text>
            
            <Text 
                style={styles.description}
                numberOfLines={3}
                ellipsizeMode="tail"
            >
                {description || ''}
            </Text>
            
            {/* Member Avatars */}
            {renderMemberAvatars()}
            
            {/* Bottom Info */}
            <Text style={styles.memberInfo}>
                {memberCount} members
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginVertical: 6,
        padding: 18,
        flex: 1,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        minHeight: 200,
        maxHeight: 280,
        alignItems: 'center',
    },
    imageContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: -0.3,
        lineHeight: 20,
        textAlign: 'center',
    },
    description: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 18,
        marginBottom: 16,
        fontWeight: '400',
        textAlign: 'center',
    },
    avatarsContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarExtra: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarExtraText: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
    },
    memberInfo: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
        letterSpacing: 0.1,
        textAlign: 'center',
    },
});

export default GroupCard;