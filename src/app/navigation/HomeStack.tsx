// src/navigation/HomeStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../screens/Home";
import FormsList from "../screens/files/FormsList";
import FormDetail from "../screens/files/FormDetail";

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