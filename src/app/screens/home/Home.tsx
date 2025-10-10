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
import {useTheme} from '../../../context/ThemeContext';

type HomeNavigationProp = BottomTabNavigationProp<BottomTabsList, 'Home'> & {
  navigate: (screen: keyof HomeStackParamList) => void;
};

const ERP: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<HomeNavigationProp>();
  const {theme} = useTheme();

  return (
    <SafeAreaView
      className="flex-1 gap-2"
      style={{backgroundColor: theme.background}}>
      {/* Header */}
      <View className="px-6 pt-10 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text
              className="font-inter font-semibold text-lg leading-8 tracking-[-0.006em]"
              style={{color: theme.text}}>
              {t('welcome.title') || 'Welcome back!'}
            </Text>
            <Text
              className="font-inter font-normal text-xs leading-5 tracking-normal"
              style={{color: theme.subtext}}>
              {t('welcome.subtitle') ||
                "Here's a list of your ERP Systems for you!"}
            </Text>
          </View>
          <LanguageControl />
        </View>
      </View>

      {/* Pending Forms Card */}
      <View className="mx-6 mb-6">
        <View
          className="p-4 border rounded-lg flex-row justify-between items-start"
          style={{
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          }}>
          <View className="flex-1 mr-3">
            <Text
              className="text-lg font-bold"
              style={{color: theme.pendingText}}>
              {t('home.pendingForms', {count: 15})}
            </Text>
            <TouchableOpacity>
              <View className="flex-row items-center mt-2 gap-2">
                <TouchableOpacity onPress={() => navigation.navigate('Files')}>
                  <Text className="text-sm" style={{color: theme.pendingText}}>
                    {t('home.viewPendingForms')}
                  </Text>
                </TouchableOpacity>
                <ArrowRight color={theme.pendingText} size={12} />
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="flex-shrink-0">
            <Text
              className="border px-3 py-2 text-sm rounded-xl"
              style={{
                borderColor: theme.pendingBorder,
                color: theme.pendingText,
              }}>
              {t('home.submitAllForms')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ERP Systems */}
      <ScrollView contentContainerStyle={{paddingBottom: 30}}>
        <View className="flex-row flex-wrap justify-center px-4">
          {['ERP 1', 'ERP 2', 'ERP 3', 'ERP 4', 'ERP 5', 'ERP 6'].map(
            (label, i) => (
              <TouchableOpacity
                key={i}
                className="w-[45%] min-h-[100px] rounded-2xl border items-center justify-center m-2"
                style={{borderColor: theme.border}}
                onPress={() => {
                  if (i === 0) {
                    navigation.navigate('FormsList');
                  }
                }}>
                <Text
                  className="font-inter font-semibold text-base leading-7 tracking-[-0.006em]"
                  style={{color: theme.text}}>
                  {label}
                </Text>
                <Text
                  className="font-inter font-normal text-xs leading-5 tracking-normal text-center"
                  style={{color: theme.subtext}}>
                  {t('home.formCount', {count: 15})}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
        {/* Downloads */}
        <TouchableOpacity
          className="w-[35%] min-h-[100px] rounded-2xl border items-center justify-center mx-auto mt-6"
          style={{borderColor: theme.border}}
          onPress={() => navigation.navigate('Files')}>
          <Text
            className="font-inter font-semibold text-sm leading-6 tracking-[-0.006em]"
            style={{color: theme.text}}>
            {t('navigation.downloads') || 'Downloads'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ERP;
