import React, { useCallback } from 'react';
import { Text, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ENV } from '../../config/env';

interface MemberPreview {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
}

interface GroupCardProps {
    name: string;
    memberCount: number;
    img?: any;
    description?: string;
    memberPreviews?: MemberPreview[];
    isJoined?: boolean;
    groupId?: string;
}

const GroupCard: React.FC<GroupCardProps> = ({
    name,
    img,
    description,
    memberCount,
    memberPreviews,
    isJoined = false,
    groupId


}) => {
    const handlePress = useCallback(() => {
        if (groupId) {
            if (isJoined) {
                router.push(`/group/${groupId}`);
            } else {
                router.push(`/group/${groupId}/preview`);
            }
        }
    }, [groupId, isJoined]);

    // Get group initials from name
    const getGroupInitials = useCallback(() => {
        if (!name) return 'G';
        const words = name.trim().split(/\s+/);
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        }
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }, [name]);

    // Get user initials from member data
    const getUserInitials = useCallback((member: MemberPreview) => {
        const first = member.firstName?.charAt(0)?.toUpperCase() || '';
        const last = member.lastName?.charAt(0)?.toUpperCase() || '';
        return first + last || member.username?.charAt(0)?.toUpperCase() || '?';
    }, []);

    // Get full image URL
    const getFullImageUrl = useCallback((imageUrl: string | null | undefined): string | null => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        return `${ENV.API_BASE_URL}${imageUrl}`;
    }, []);

    const renderMemberAvatars = () => {
        // Debug logging
        console.log('[GroupCard]', name, '- memberPreviews:', memberPreviews, 'memberCount:', memberCount);

        // If no member data but we know there are members, return null (don't show empty state)
        if (!memberPreviews || memberPreviews.length === 0) {
            console.log('[GroupCard] No member previews available for:', name);
            // Don't show anything if no preview data
            return null;
        }

        const displayMembers = memberPreviews.slice(0, 3);
        const remainingCount = Math.max(0, memberCount - displayMembers.length);

        return (
            <View style={styles.avatarsContainer}>
                {displayMembers.map((member, index) => {
                    const profileImageUrl = getFullImageUrl(member.profileImageUrl);

                    return profileImageUrl ? (
                        <Image
                            key={member.id}
                            source={{ uri: profileImageUrl }}
                            style={[
                                styles.avatar,
                                index > 0 && { marginLeft: -6 }
                            ]}
                        />
                    ) : (
                        <View
                            key={member.id}
                            style={[
                                styles.avatar,
                                styles.avatarInitials,
                                index > 0 && { marginLeft: -6 }
                            ]}
                        >
                            <Text style={styles.avatarInitialsText}>
                                {getUserInitials(member)}
                            </Text>
                        </View>
                    );
                })}
                {remainingCount > 0 && (
                    <View style={[styles.avatar, styles.avatarExtra, { marginLeft: -6 }]}>
                        <Text style={styles.avatarExtraText}>
                            +{remainingCount}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress}>
            {/* Profile Image */}
            <View style={styles.imageContainer}>
                {img ? (
                    <Image source={img} style={styles.profileImage} />
                ) : (
                    <View style={styles.initialsContainer}>
                        <Text style={styles.initialsText}>
                            {getGroupInitials()}
                        </Text>
                    </View>
                )}
            </View>

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
    initialsContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 212, 170, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00D4AA',
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
    avatarInitials: {
        backgroundColor: 'rgba(0, 212, 170, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialsText: {
        fontSize: 9,
        color: '#00D4AA',
        fontWeight: '700',
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

export default React.memo(GroupCard);