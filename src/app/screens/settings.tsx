import React, { useState } from 'react';
import { View, Text, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LanguageControl from '../components/LanguageControl';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getQueue } from '../pendingQueue';
import { SubmissionItem } from '../../types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabsList } from '../navigation/BottomTabsList';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackedList';

type SettingsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabsList, 'Settings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function Settings() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { t } = useTranslation();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [pendingFormsModalVisible, setPendingFormsModalVisible] = useState(false);

  const handleLogoutPress = async () => {
    const hasPendingForms = await checkForPendingForms();
    if (hasPendingForms) {
      setPendingFormsModalVisible(true);
    } else {
      setLogoutModalVisible(true);
    }
  };

  const checkForPendingForms = async (): Promise<boolean> => {
    try {
      const pendingSubmissions = await getQueue() as SubmissionItem[];
      
      if (Array.isArray(pendingSubmissions) && pendingSubmissions.length > 0) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking for pending forms:", error);
      return false;
    }
  };

  const handleLogoutConfirm = () => {
    // Add your logout logic here
    console.log('User logged out');
    setLogoutModalVisible(false);
    navigation.getParent()?.navigate('Login');
  };

  const handleLogoutCancel = () => {
    setLogoutModalVisible(false);
  };

  const handlePendingFormsCancel = () => {
    setPendingFormsModalVisible(false);
  };

  const handleUploadNow = () => {
    // Close the modal and navigate to the Files tab which contains the Forms screen
    setPendingFormsModalVisible(false);
    // Navigate to Files tab (which will show the Forms screen by default)
    navigation.navigate('Files');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 pt-10 bg-white border-gray-200 border-b ">
        <View className="flex-1 items-center">
          <Text className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center">Settings</Text>
        </View>
        <LanguageControl />
      </View>
      <KeyboardAwareScrollView>
        {[
          { title: 'Notification Settings', onPress: () => {} },
          { title: 'Privacy & Security', onPress: () => {} },
          { title: 'Support & Help', onPress: () => {} },
          { title: 'App Info', onPress: () => {} },
          { title: 'Logout', onPress: handleLogoutPress, isLogout: true }
        ].map((item, index) => (
          <TouchableOpacity 
            key={index} 
            className='border-1 border-b border-[#E2E8F0] px-4 py-6 flex-row items-center gap-2'
            onPress={item.onPress}
          >
            <Text className={`font-inter font-normal text-[16px] leading-[100%] text-center ${item.isLogout ? 'text-[#FF0000]' : ''}`}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </KeyboardAwareScrollView >

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={handleLogoutCancel}
      >
        <View className="flex-1 bg-[#00000033] justify-center items-center p-[1.25rem]">
          <View className="w-full max-w-[400px] opacity-100 gap-4 rounded-[6px] border p-6 border-[#E2E8F0] bg-white">
            <Text className="font-inter font-semibold text-[18px] leading-[28px] tracking-[-0.006em] text-[#020617]">
              Are you sure you want to logout?
            </Text>
            <Text className="font-inter font-normal text-[14px] leading-[20px] tracking-normal text-[#64748B]">
              All forms are uploaded, you can safely logout.
            </Text>
            <View className="flex-row justify-end gap-3 mt-4">
              <TouchableOpacity
                className="px-4 py-2 opacity-100 gap-2 rounded-md border border-[#E2E8F0] items-center justify-center"
                onPress={handleLogoutCancel}
              >
                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#020617]">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 rounded-lg bg-[#EF2226]"
                onPress={handleLogoutConfirm}
              >
                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#F8FAFC]">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={pendingFormsModalVisible}
        onRequestClose={handlePendingFormsCancel}
      >
        <View className="flex-1 bg-[#00000033] justify-center items-center p-[1.25rem]">
          <View className="w-full max-w-[400px] opacity-100 gap-4 rounded-[6px] border p-6 border-[#E2E8F0] bg-white">
            <Text className="font-inter font-semibold text-[18px] leading-[28px] tracking-[-0.006em] text-[#020617]">
              Pending forms not uploaded!
            </Text>
            <Text className="font-inter font-normal text-[14px] leading-[20px] tracking-normal text-[#64748B]">
              Please connect to the internet and upload them before logging out.
            </Text>
            <View className="flex-row justify-end gap-3 mt-4">
              <TouchableOpacity
                className="px-4 py-2 opacity-100 gap-2 rounded-md border border-[#E2E8F0] items-center justify-center"
                onPress={handlePendingFormsCancel}
              >
                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#020617]">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 rounded-lg bg-[#0F172A]"
                onPress={handleUploadNow}
              >
                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#F8FAFC]">
                  Upload Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default Settings;