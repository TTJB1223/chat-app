
import { Tabs } from 'expo-router';
import { BarChart, LayoutGrid, MessageCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  // Custom colors for light/dark mode
  // Using hardcoded colors for now to match style
  // Active tint color: new primary theme
  const activeColor = '#3966A2'; // primary theme
  const inactiveColor = '#9CA3AF'; // gray-400

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="memos"
        options={{
          title: '备忘',
          tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: '分析',
          tabBarIcon: ({ color }) => <BarChart size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
