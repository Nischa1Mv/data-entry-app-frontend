import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackedList'
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageControl from '../components/LanguageControl';
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const Login: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

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
        throw new Error(t('login.backendError'));
      }

      const data = await response.json();
      Alert.alert(t('login.successTitle'), t('login.welcomeMessage', { name: data.user.name }));
      navigation.replace("MainApp");
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(t('login.cancelledTitle'), t('login.cancelledMessage'));
      } else {
        console.error('Google Sign-In Error:', error);
        Alert.alert(t('login.errorTitle'), error.message || t('login.errorMessage'));
      }
    }
  };

  return (
    <View className="flex-1 items-center justify-center w-full">
      <View className="flex-row justify-between items-center w-[85%]">
        <View className="flex-row items-center justify-between w-full">
          <Text className="text-xl font-bold mb-0.5 text-slate-900">{t('login.title')}</Text>
          <LanguageControl />
        </View>
      </View>
      <Text className="text-sm text-center text-slate-500">
        {t('login.subtitle')}
      </Text>
      <TouchableOpacity className="w-[85%] bg-slate-900 p-3 rounded-md items-center mt-2.5 border border-slate-200" onPress={() =>  navigation.replace("MainApp") }>
        <Text className="text-white text-base">{t('login.signInWithGoogle')}</Text>
      </TouchableOpacity>
    </View>
  );
};



export default Login;
