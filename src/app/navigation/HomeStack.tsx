// src/navigation/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './../screens/home/Home';
import FormsList from '../screens/home/FormsList';
import FormDetail from '../screens/home/FormDetail';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={Home} />
      <Stack.Screen name="FormsList" component={FormsList} />
      <Stack.Screen name="FormDetail" component={FormDetail} />
    </Stack.Navigator>
  );
}
