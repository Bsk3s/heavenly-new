import React from 'react';
import { ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const PageWrapper = ({ children, withScrollView = true }) => {
  const content = (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="px-4 flex-1">
        {children}
      </View>
    </View>
  );

  if (withScrollView) {
    return (
      <ScrollView className="flex-1 bg-white">
        {content}
      </ScrollView>
    );
  }

  return content;
};

export default PageWrapper; 