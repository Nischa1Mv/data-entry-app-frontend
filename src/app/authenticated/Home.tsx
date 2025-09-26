import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageControl from '../components/LanguageControl'

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ERP'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const ERP: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 items-center w-full pt-20">
      <View className="flex-row justify-between items-center w-4/5 mb-5">
        <View>
          <Text className="text-xl font-bold">{t('welcome.title') || 'Welcome back!'}</Text>
          <Text className="text-sm text-gray-400">
            {t('welcome.subtitle') || 'Here is a List of ERP Systems available to you.'}
          </Text>
        </View>
        <LanguageControl />
      </View>
      <ScrollView contentContainerStyle={{ alignItems: 'center', margin: 10, width: '100%' }}>
        <View className="flex-row w-[95%] justify-center">
          <TouchableOpacity 
            className="w-[45%] min-h-[100px] rounded-2xl border border-black items-center justify-center m-2" 
            onPress={() => navigation.navigate('FormsList')}
          >
            <Text>ERP 1</Text>
            <Text>15 {t('navigation.forms') || 'Forms'}</Text>
          </TouchableOpacity>
          <View className="w-[45%] min-h-[100px] rounded-2xl border border-black items-center justify-center m-2">
            <Text>ERP 2</Text>
            <Text>15 {t('navigation.forms') || 'Forms'}</Text>
          </View>
        </View>

        <View className="flex-row w-[95%] justify-center">
          <View className="w-[45%] min-h-[100px] rounded-2xl border border-black items-center justify-center m-2">
            <Text>ERP 3</Text>
            <Text>15 {t('navigation.forms') || 'Forms'}</Text>
          </View>
          <View className="w-[45%] min-h-[100px] rounded-2xl border border-black items-center justify-center m-2">
            <Text>ERP 4</Text>
            <Text>15 {t('navigation.forms') || 'Forms'}</Text>
          </View>
        </View>

        <View className="flex-row w-[95%] justify-center">
          <View className="w-[45%] min-h-[100px] rounded-2xl border border-black items-center justify-center m-2">
            <Text>ERP 5</Text>
            <Text>15 {t('navigation.forms') || 'Forms'}</Text>
          </View>
          <View className="w-[45%] min-h-[100px] rounded-2xl border border-black items-center justify-center m-2">
            <Text>ERP 6</Text>
            <Text>15 {t('navigation.forms') || 'Forms'}</Text>
          </View>
        </View>
        <TouchableOpacity
          className="w-[95%] min-h-[100px] rounded-2xl border border-black items-center justify-center m-2 mt-5"
          onPress={() => navigation.navigate('Downloads')}
        >
          <Text className="text-base font-bold">{t('navigation.downloads') || 'Downloads'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ERP;
