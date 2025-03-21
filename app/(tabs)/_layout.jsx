import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import TabBar from '../components/tabs/TabBar';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  // Get the active tab from the path
  const pathSegments = pathname.split('/');
  let activeTab = pathSegments[pathSegments.length - 1] || 'index';
  
  // If we're in a nested study route, set activeTab to 'study'
  if (pathname.includes('/(tabs)/study/')) {
    activeTab = 'study';
  }

  const handleTabChange = (tabId) => {
    if (tabId === 'index') {
      router.replace('/(tabs)/'); // Navigate to home tab with replace to avoid stacking
    } else if (tabId === 'study') {
      router.replace('/(tabs)/study/'); // Navigate to study directory index with replace
    } else if (tabId === 'bible') {
      router.replace('/(tabs)/bible'); // Navigate to bible with replace
    } else if (tabId === 'chat') {
      router.replace('/(tabs)/chat'); // Navigate to chat with replace
    } else {
      router.replace(`/(tabs)/${tabId}`); // Navigate to other tabs with replace
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-white px-4 py-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-semibold">Heavenly Hub</Text>
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity>
              <Text className="text-blue-500">Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Menu size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <TabBar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />

      {/* Content */}
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  );
}
