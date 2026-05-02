import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryMid,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'Sınavlar',
          tabBarIcon: ({ color, size }) => <FontAwesome name="calendar" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schools"
        options={{
          title: 'Okullar',
          tabBarIcon: ({ color, size }) => <FontAwesome name="institution" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Planım',
          tabBarIcon: ({ color, size }) => <FontAwesome name="bookmark" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Hesap',
          tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen name="admin" options={{ href: null }} />
    </Tabs>
  );
}
