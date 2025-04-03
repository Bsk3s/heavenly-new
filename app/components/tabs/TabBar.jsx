import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

function TabBar({ activeTab, onTabChange }) {
  const { width } = useWindowDimensions();

  const tabs = [
    { id: 'chat', label: 'Chat' },
    { id: 'index', label: 'Home' },
    { id: 'bible', label: 'Bible' },
    { id: 'study', label: 'Study' }
  ];

  const contentWidth = width - 32; // 16px padding on each side
  const tabWidth = contentWidth / tabs.length;

  const handleTabPress = async (tabId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange(tabId);
  };

  const indicatorStyle = useAnimatedStyle(() => {
    const index = tabs.findIndex(tab => tab.id === activeTab);
    return {
      transform: [{ translateX: withSpring(index * tabWidth, { damping: 15 }) }],
    };
  });

  return (
    <View className="px-4 py-2">
      <View className="bg-[#F3F4F6] rounded-full h-[45px] flex-row relative overflow-hidden">
        <Animated.View
          style={[
            { 
              width: tabWidth,
              position: 'absolute',
              height: 36,
              top: 4.5,
              borderRadius: 9999, // Full rounded
              backgroundColor: 'white'
            },
            indicatorStyle,
          ]}
        />
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handleTabPress(tab.id)}
            style={{ 
              width: tabWidth,
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <Text 
              style={{ 
                fontSize: 16,
                fontWeight: '500',
                zIndex: 10,
                color: activeTab === tab.id ? '#000000' : '#6B7280'
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default TabBar;

