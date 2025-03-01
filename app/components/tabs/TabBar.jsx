import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const TabBar = ({ activeTab, onTabChange }) => {
  const { width } = useWindowDimensions();

  const tabs = [
    { id: 'chat', label: 'Chat' },
    { id: 'index', label: 'Home' },
    { id: 'bible', label: 'Bible' },
    { id: 'study', label: 'Study' }
  ];

  const tabWidth = (width - 32) / tabs.length;

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
            { width: tabWidth },
            indicatorStyle,
          ]}
          className="absolute h-[36px] bg-white rounded-full top-[4.5px] left-[3px]"
        />
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handleTabPress(tab.id)}
            style={{ width: tabWidth }}
            className="items-center justify-center"
          >
            <Text className={`
              text-base font-medium z-10
              ${activeTab === tab.id ? 'text-black' : 'text-gray-500'}
            `}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default React.memo(TabBar);

