import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/RootStackedList';
import React, {useEffect} from 'react';
import {Languages, Mail} from 'lucide-react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {GOOGLE_WEB_CLIENT_ID} from '@env';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const Login: React.FC<Props> = ({navigation}) => {
  const isDarkMode = useColorScheme() === 'dark';

  // Theme-aware colors
  const theme = {
    background: isDarkMode ? '#000000' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
    subtext: isDarkMode ? '#cccccc' : '#666666',
    buttonBackground: isDarkMode ? '#ffffff' : '#000000',
    buttonText: isDarkMode ? '#000000' : '#ffffff',
    iconColor: isDarkMode ? '#000000' : '#ffffff',
  };
  useEffect(() => {
    // Configure Google Sign-In with Web Client ID from environment
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      console.log('User Info:', userInfo);

      // Navigate to main app after successful sign-in
      navigation.navigate('ERP');

      Alert.alert('Success', `Welcome ${userInfo.data?.user.name}!`);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated');
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        console.log('Some other error happened:', error);
        Alert.alert('Error', 'Failed to sign in with Google');
      }
    }
  };
  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={styles.head}>
        <View>
          <Text style={[styles.heading, {color: theme.text}]}>Login</Text>
          <Text style={[styles.subtext, {color: theme.subtext}]}>
            Sign in with your Google account to continue
          </Text>
        </View>
        <Languages size={42} color={theme.text} />
      </View>
      <TouchableOpacity
        style={[styles.loginbtn, {backgroundColor: theme.buttonBackground}]}
        onPress={signInWithGoogle}>
        <View style={styles.buttonContent}>
          <Mail size={20} color={theme.iconColor} />
          <Text style={[styles.buttonText, {color: theme.buttonText}]}>
            Sign in with Google
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '85%',
  },
  heading: {fontSize: 20, fontWeight: 'bold', marginBottom: 1},
  subtext: {fontSize: 14, textAlign: 'center'},
  loginbtn: {
    width: '85%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {fontSize: 16},
});

export default Login;
