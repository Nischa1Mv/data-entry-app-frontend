// src/navigation/BottomTabs.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { House, Files, Settings as SettingsIcon } from "lucide-react-native";
import HomeStack from "./HomeStack";
import FilesStack from "./FormStack";
import Settings from "../screens/settings";
import { BottomTabsList } from "./BottomTabsList";

const Tab = createBottomTabNavigator<BottomTabsList>();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Home") {
            return <House size={24} color={color} />;
          } else if (route.name === "Files") {
            return <Files size={24} color={color} />;
          } else if (route.name === "Settings") {
            return <SettingsIcon size={24} color={color} />;
          }
          
          // Default fallback icon
          return <House size={24} color={color} />;
        },
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#64748B",
        tabBarShowLabel: false,
        headerShown: false,
         tabBarStyle: {
          backgroundColor: "#E4E5E5",
          height: 62,
          paddingBottom: 5,
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Files" component={FilesStack} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}
