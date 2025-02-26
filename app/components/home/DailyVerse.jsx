import React from 'react';
import { View, Text } from 'react-native';

const DailyVerse = () => (
  <View className="bg-green-50 rounded-xl py-4 px-5">
    <Text className="text-sm font-medium text-green-800 mb-2">Daily Verse</Text>
    <Text className="text-lg text-gray-800 mb-2">
      "And we have known and believed the love that God has for us. God is love, and he who abides in love abides in God, and God in him."
    </Text>
    <Text className="text-sm text-gray-600">1 John 4:16 NKJV</Text>
  </View>
);

export default DailyVerse;
