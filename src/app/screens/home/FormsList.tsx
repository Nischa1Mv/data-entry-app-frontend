import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNetwork} from '../../../context/NetworkProvider';
import {useFocusEffect} from '@react-navigation/native';
import {
  fetchDocType,
  fetchAllDocTypeNamess,
  saveDocTypeToLocal,
  getAllDocTypeNames,
} from '../../../api';
import {FormItem} from '../../../types';
import {useTranslation} from 'react-i18next';
import LanguageControl from '../../components/LanguageControl';
import {ArrowLeft, Download, Check} from 'lucide-react-native';
import {HomeStackParamList} from '@/app/navigation/HomeStackParamList';
import {useTheme} from '../../../context/ThemeContext';

type FormsListNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'FormsList'
>;

const FormsList = () => {
  const navigation = useNavigation<FormsListNavigationProp>();
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadStates, setDownloadStates] = useState<{
    [key: string]: {isDownloaded: boolean; isDownloading: boolean};
  }>({});
  const {isConnected} = useNetwork();
  const {t} = useTranslation();
  const {theme} = useTheme();

  useEffect(() => {
    const loadForms = async () => {
      // if connected fetch from server
      setLoading(true);
      try {
        if (isConnected) {
          const docTypeNames = (await loginAndFetchForms()) as FormItem[];
          setForms(docTypeNames);
        } else {
          // else get form local storage
          const stored = (await getAllDocTypeNames()) as FormItem[];
          setForms(stored);
        }
      } catch (error) {
        console.error('Error loading forms:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isConnected !== null) {
      loadForms();
    }
  }, [isConnected]);

  const loginAndFetchForms = async (): Promise<FormItem[]> => {
    try {
      const data = (await fetchAllDocTypeNamess()) as FormItem[];
      return data;
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  };

  useFocusEffect(() => {
    const checkDownloadStatus = async () => {
      const existingDoctypeData =
        await AsyncStorage.getItem('downloadDoctypes');
      const allDocTypeStorage: Record<string, any> = existingDoctypeData
        ? JSON.parse(existingDoctypeData)
        : {};
      const initialDownloadStates = forms.reduce(
        (acc, f) => {
          acc[f.name] = {
            isDownloaded: !!allDocTypeStorage[f.name], // true if exists in storage
            isDownloading: false,
          };
          return acc;
        },
        {} as Record<string, {isDownloaded: boolean; isDownloading: boolean}>,
      );

      setDownloadStates(initialDownloadStates);
    };

    if (forms.length > 0 && isConnected) {
      checkDownloadStatus();
    }
  });

  const handleDownload = async (docTypeName: string) => {
    setDownloadStates(prev => ({
      ...prev,
      [docTypeName]: {...prev[docTypeName], isDownloading: true},
    }));

    try {
      const docTypeData = await fetchDocType(docTypeName);

      //saves the doctype data
      await saveDocTypeToLocal(docTypeName, docTypeData);

      // Update download state to show as downloaded
      setDownloadStates(prev => ({
        ...prev,
        [docTypeName]: {isDownloaded: true, isDownloading: false},
      }));
    } catch (error) {
      console.error('Error downloading doctype:', error);
      // Reset download state on error
      setDownloadStates(prev => ({
        ...prev,
        [docTypeName]: {...prev[docTypeName], isDownloading: false},
      }));
    }
  };

  const renderFormItem = ({item}: {item: FormItem}) => {
    const itemState = downloadStates[item.name] || {
      isDownloaded: false,
      isDownloading: false,
    };

    return (
      <TouchableOpacity
        className="flex-row justify-between items-center px-5 py-4 border-b"
        style={{borderBottomColor: theme.border}}
        onPress={() => {
          navigation.navigate('FormDetail', {formName: item.name});
        }}>
        <Text className="text-base font-normal" style={{color: theme.text}}>
          {item.name}
        </Text>
        <View className="flex-row items-center">
          {isConnected &&
            (itemState.isDownloading ? (
              <ActivityIndicator size="small" color={theme.buttonBackground} />
            ) : itemState.isDownloaded ? (
              <View className="mr-3">
                <Check color="#16a34a" size={20} />
              </View>
            ) : (
              <TouchableOpacity
                className="mr-3 p-2"
                onPress={() => {
                  handleDownload(item.name);
                }}>
                <Download color={theme.buttonBackground} size={20} />
              </TouchableOpacity>
            ))}
          <Text className="text-base font-normal" style={{color: theme.text}}>
            {t('formsList.open')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{backgroundColor: theme.background}}>
        <ActivityIndicator
          size="large"
          color={theme.buttonBackground}
          className="mt-10"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{backgroundColor: theme.background}}>
      <View
        className="flex-row items-center justify-between px-4 py-3 pt-10 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        }}>
        <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.text} size={16} />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text
            className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center"
            style={{color: theme.text}}>
            {t('formsList.title')}
          </Text>
          <Text className="text-sm mt-0.5" style={{color: theme.subtext}}>
            {forms.length} {t('navigation.forms') || 'Forms'}
          </Text>
        </View>
        <LanguageControl />
      </View>

      <FlatList
        data={forms}
        renderItem={renderFormItem}
        keyExtractor={item => item.name}
        className="flex-1"
        style={{backgroundColor: theme.background}}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default FormsList;
