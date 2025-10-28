import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabsList } from '../../navigation/BottomTabsList';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageControl from '../../components/LanguageControl';
import { ArrowRight } from 'lucide-react-native';
import { HomeStackParamList } from '../../navigation/HomeStackParamList';
import { useTheme } from '../../../context/ThemeContext';
import { getErpSystems } from '../../../lib/hey-api/client/sdk.gen';

type HomeNavigationProp = BottomTabNavigationProp<BottomTabsList, 'Home'> & {
  navigate: (screen: keyof HomeStackParamList) => void;
};

export interface ErpSystem {
  id: string;
  name: string;
  formCount: number;
}

const ERP: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeNavigationProp>();
  const { theme } = useTheme();
  const [erpSystems, setErpSystems] = useState<ErpSystem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchERPSystems = async () => {
      try {
        const response = await getErpSystems();
        setErpSystems(response.data as ErpSystem[]);
        console.log('ERP Systems:', response.data);
      } catch (error: any) {
        console.error('Error fetching ERP systems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchERPSystems();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 gap-2"
      style={{ backgroundColor: theme.background }}
    >
      {/* Header */}
      <View className="px-6 pb-4 pt-10">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text
              className="font-inter text-lg font-semibold leading-8 tracking-[-0.006em]"
              style={{ color: theme.text }}
            >
              {t('welcome.title') || 'Welcome back!'}
            </Text>
            <Text
              className="font-inter text-xs font-normal leading-5 tracking-normal"
              style={{ color: theme.subtext }}
            >
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
          className="flex-row items-start justify-between rounded-lg border p-4"
          style={{
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          }}
        >
          <View className="mr-3 flex-1">
            <Text
              className="text-lg font-bold"
              style={{ color: theme.pendingText }}
            >
              {t('home.pendingForms', { count: 15 })}
            </Text>
            <TouchableOpacity>
              <View className="mt-2 flex-row items-center gap-2">
                <TouchableOpacity onPress={() => navigation.navigate('Files')}>
                  <Text
                    className="text-sm"
                    style={{ color: theme.pendingText }}
                  >
                    {t('home.viewPendingForms')}
                  </Text>
                </TouchableOpacity>
                <ArrowRight color={theme.pendingText} size={12} />
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="flex-shrink-0">
            <Text
              className="rounded-xl border px-3 py-2 text-sm"
              style={{
                borderColor: theme.pendingBorder,
                color: theme.pendingText,
              }}
            >
              {t('home.submitAllForms')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ERP Systems */}
      <ScrollView className="pb-8">
        <View className="flex-row flex-wrap justify-center px-4">
          {erpSystems.map((erp: ErpSystem, i) => (
            <TouchableOpacity
              key={i}
              className="m-2 min-h-[100px] w-[45%] items-center justify-center rounded-2xl border"
              style={{ borderColor: theme.border }}
              onPress={() => {
                if (i === 0) {
                  navigation.navigate('FormsList');
                }
              }}
            >
              <Text
                className="font-inter text-base font-semibold leading-7 tracking-[-0.006em]"
                style={{ color: theme.text }}
              >
                {erp.name}
              </Text>
              <Text
                className="font-inter text-center text-xs font-normal leading-5 tracking-normal"
                style={{ color: theme.subtext }}
              >
                {t('home.formCount', { count: erp.formCount })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ERP;
