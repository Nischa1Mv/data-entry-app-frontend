import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {BottomTabsList} from '../../navigation/BottomTabsList';
import React from 'react';
import {useTranslation} from 'react-i18next';
import LanguageControl from '../../components/LanguageControl';
import {ArrowRight} from 'lucide-react-native';
import {HomeStackParamList} from '../../navigation/HomeStackParamList';

type HomeNavigationProp = BottomTabNavigationProp<BottomTabsList, 'Home'> & {
  navigate: (screen: keyof HomeStackParamList) => void;
};

const ERP: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<HomeNavigationProp>();

  return (
    <SafeAreaView className="flex-1 bg-white gap-2">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-10 pb-4">
        <View>
          <Text className="font-inter font-semibold text-lg leading-8 tracking-[-0.006em]">
            {t('welcome.title') || 'Welcome back!'}
          </Text>
          <Text className="font-inter font-normal text-xs leading-5 tracking-normal text-[#64748B]">
            {t('welcome.subtitle') ||
              'Here is a List of ERP Systems available to you.'}
          </Text>
        </View>
        <LanguageControl />
      </View>

      {/* Pending Forms Card */}
      <View className="mx-6 mb-5 p-4 w-[356px] h-[76px] border border-[##E2E8F0] rounded-lg bg-[#FFFCF0] flex-row justify-between items-center">
        <View>
          <Text className="text-[#DC7609] text-2xl font-bold">
            {t('home.pendingForms', {count: 15})}
          </Text>
          <TouchableOpacity>
            <View className="flex-row items-center mt-2 gap-2">
              <TouchableOpacity onPress={() => navigation.navigate('Files')}>
                <Text className="text-[#DC7609]">
                  {t('home.viewPendingForms')}
                </Text>
              </TouchableOpacity>
              <ArrowRight color="#DC7609" size={12} />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Text className="border border-[#DC7609] px-3 py-2 text-base text-[#DC7609] rounded-xl">
            {t('home.submitAllForms')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ERP Systems */}
      <ScrollView contentContainerStyle={{paddingBottom: 30}}>
        <View className="flex-row flex-wrap justify-center">
          {['ERP 1', 'ERP 2', 'ERP 3', 'ERP 4', 'ERP 5', 'ERP 6'].map(
            (label, i) => (
              <TouchableOpacity
                key={i}
                className="w-[173px] min-h-[100px] rounded-2xl border border-black items-center justify-center m-2"
                onPress={() => {
                  if (i === 0) {
                    navigation.navigate('FormsList');
                  }
                }}>
                <Text className="w-[42px] h-[28px] font-inter font-semibold text-base leading-7 tracking-[-0.006em]">
                  {label}
                </Text>
                <Text className="font-inter font-normal text-xs leading-5 tracking-normal text-center">
                  {t('home.formCount', {count: 15})}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
        {/* Downloads */}
        <TouchableOpacity
          className="w-[35%] min-h-[100px] rounded-2xl border border-black items-center justify-center mx-auto mt-6"
          onPress={() => navigation.navigate('Files')}>
          <Text className="font-inter font-semibold text-sm leading-6 tracking-[-0.006em] text-gray-800">
            {t('navigation.downloads') || 'Downloads'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ERP;
