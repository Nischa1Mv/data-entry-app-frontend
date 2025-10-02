// src/navigation/FilesStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FormsList from "../screens/files/FormsList";
import FormDetail from "../screens/files/FormDetail";
import Downloads from "../screens/files/downloads";

const Stack = createNativeStackNavigator();

export default function FilesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Downloads" component={Downloads} />
    </Stack.Navigator>
  );
}
