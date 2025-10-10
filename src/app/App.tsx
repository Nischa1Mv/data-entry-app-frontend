import React from 'react';
import {StatusBar, SafeAreaView} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {enableScreens} from 'react-native-screens';
import Login from './screens/Login';
import {RootStackParamList} from './navigation/RootStackedList';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import '../i18n';
import '../../global.css';
import {NetworkProvider} from '../context/NetworkProvider';
import {ThemeProvider, useTheme} from '../context/ThemeContext';
import Home from './navigation/BottomTabs';

enableScreens();

// Inner component that uses theme
function AppContent(): React.JSX.Element {
  const {theme} = useTheme();
  const Stack = createNativeStackNavigator<RootStackParamList>();

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView
        className="flex-1"
        style={{backgroundColor: theme.background}}>
        <StatusBar
          barStyle={theme.statusBarStyle}
          backgroundColor={theme.background}
        />
        <NetworkProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{headerShown: false}}>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="MainApp" component={Home} />
            </Stack.Navigator>
          </NavigationContainer>
        </NetworkProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
