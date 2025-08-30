import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

interface GroupSettingsTabProps {
  groupData: {
    name: string;
    description: string;
    memberCount: number;
  };
}

const GroupSettingsTab: React.FC<GroupSettingsTabProps> = ({ groupData }) => {
  return (
    <View>
      {/* Group Settings Header */}
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 20
      }}>
        Group Settings
      </Text>

      {/* Basic Settings Section */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 16
        }}>
          Basic Information
        </Text>

        {/* Group Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 6
          }}>
            Group Name
          </Text>
          <TouchableOpacity style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 15
            }}>
              {groupData.name}
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14
            }}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Description */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 6
          }}>
            Description
          </Text>
          <TouchableOpacity style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 15,
              flex: 1
            }}>
              {groupData.description}
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14
            }}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Image */}
        <View>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 6
          }}>
            Group Image
          </Text>
          <TouchableOpacity style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 15
            }}>
              Change Group Photo
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14
            }}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy Settings */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 16
        }}>
          Privacy & Access
        </Text>

        {/* Group Privacy */}
        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12
          }}>
            <View>
              <Text style={{
                color: '#ffffff',
                fontSize: 15,
                marginBottom: 2
              }}>
                Group Privacy
              </Text>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: 13
              }}>
                Public • Anyone can find and join
              </Text>
            </View>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14
            }}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Join Approval */}
        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12
          }}>
            <View>
              <Text style={{
                color: '#ffffff',
                fontSize: 15,
                marginBottom: 2
              }}>
                Join Requests
              </Text>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: 13
              }}>
                Auto-approve new members
              </Text>
            </View>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14
            }}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invite Link */}
        <View>
          <TouchableOpacity style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12
          }}>
            <View>
              <Text style={{
                color: '#ffffff',
                fontSize: 15,
                marginBottom: 2
              }}>
                Invite Link
              </Text>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: 13
              }}>
                Share link to invite members
              </Text>
            </View>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14
            }}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Members Management */}
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#ffffff',
          marginBottom: 16
        }}>
          Member Management
        </Text>

        {/* View Members */}
        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12
          }}>
            <View>
              <Text style={{
                color: '#ffffff',
                fontSize: 15,
                marginBottom: 2
              }}>
                View All Members
              </Text>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: 13
              }}>
                {groupData.memberCount} members
              </Text>
            </View>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14
            }}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Admins */}
        <View>
          <TouchableOpacity style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12
          }}>
            <View>
              <Text style={{
                color: '#ffffff',
                fontSize: 15,
                marginBottom: 2
              }}>
                Group Admins
              </Text>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: 13
              }}>
                Manage admin permissions
              </Text>
            </View>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14
            }}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dangerous Actions */}
      <View style={{
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(239, 68, 68, 0.2)'
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#EF4444',
          marginBottom: 16
        }}>
          Danger Zone
        </Text>

        {/* Delete Group */}
        <TouchableOpacity style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 12
        }}>
          <View>
            <Text style={{
              color: '#EF4444',
              fontSize: 15,
              marginBottom: 2
            }}>
              Delete Group
            </Text>
            <Text style={{
              color: 'rgba(239, 68, 68, 0.7)',
              fontSize: 13
            }}>
              Permanently delete this group
            </Text>
          </View>
          <Text style={{
            color: 'rgba(239, 68, 68, 0.7)',
            fontSize: 14
          }}>
            ›
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupSettingsTab;