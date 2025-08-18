import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import React from 'react';
import { Languages } from 'lucide-react-native';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const Login: React.FC<Props> = ({ navigation }) => {
  const [mail, onEntermail] = React.useState('');
  const [pass, onEnterpass] = React.useState('');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '904251205616-f80brecsb4c6jebtjm8eebdbkfo0c5q4.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();

      // 👇 Fix: idToken may not be typed correctly
      const idToken = (userInfo as any)?.idToken;

      if (!idToken) {
        throw new Error('ID token not found in user info');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);

      const response = await fetch('http://192.168.29.202:8000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });

      if (!response.ok) {
        throw new Error('Backend token verification failed');
      }

      const data = await response.json();
      Alert.alert('Success', `Welcome ${data.user.name}`);
      navigation.navigate('ERP');
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Cancelled', 'User cancelled sign-in');
      } else {
        console.error('Google Sign-In Error:', error);
        Alert.alert('Error', error.message || 'Google sign-in failed');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <View>
          <Text style={styles.heading}>Login</Text>
          <Text style={styles.subtext}>
            Enter your email below to login to your account
          </Text>
        </View>
        <Languages size={42}></Languages>
      </View>
      <View style={styles.credentials}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={onEntermail}
          value={mail}
          placeholder="Admin@example"
          keyboardType="email-address"
        />
        <View style={styles.password}>
          <Text style={styles.label}>Password</Text>
          <Text style={styles.forgot}>Forgot password ?</Text>
        </View>
        <TextInput
          style={styles.input}
          onChangeText={onEnterpass}
          value={pass}
          placeholder="Password"
          secureTextEntry
        />
      </View>
      <TouchableOpacity style={styles.loginbtn} onPress={() => navigation.navigate('ERP')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.loginbtn, styles.googlebtn]} onPress={handleGoogleLogin}>
        <Text style={[styles.buttonText, styles.googlebtnText]}>Login with Google</Text>
      </TouchableOpacity>
      <Text style={styles.signUp}>Don't have an account? Sign up</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '85%' },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 1 },
  subtext: { fontSize: 14, textAlign: 'center', color: '#999999' },
  image: { height: 20, color: '#ffffff' },
  credentials: { flexDirection: 'column', alignItems: 'flex-start', padding: 10, width: '90%' },
  label: { fontSize: 14, fontWeight: '400' },
  input: {
    height: 40,
    width: '100%',
    marginVertical: 10,
    borderWidth: 0.5,
    borderRadius: 10,
    borderColor: '#999999',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  password: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '95%' },
  forgot: { fontSize: 14, textAlign: 'right', color: '#999999' },
  loginbtn: {
    width: '85%',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 16 },
  googlebtn: { backgroundColor: '#fff' },
  googlebtnText: { color: '#000' },
  signUp: { margin: 10 },
});

export default Login;
