import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SelectList } from 'react-native-dropdown-select-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/RootStackedList';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNetwork } from '../../../context/NetworkProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueue } from '../../pendingQueue';
import {
  fetchDocType,
  getDocTypeFromLocal,
  saveDocTypeToLocal,
  extractFields,
} from '../../../api';
import { RawField } from '../../../types';
import { useTranslation } from 'react-i18next';
import LanguageControl from '../../components/LanguageControl';
import generateSchemaHash from '../../../helper/hashFunction';
import { ArrowLeft } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { HomeStackParamList } from '@/app/navigation/HomeStackParamList';
import { useTheme } from '../../../context/ThemeContext';

type FormDetailRouteProp = RouteProp<HomeStackParamList, 'FormDetail'>;
type FormDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainApp'
>;

type Props = {
  navigation: FormDetailNavigationProp;
};

const FormDetail: React.FC<Props> = ({ navigation }) => {
  //this is the network status , make it true/false to simulate offline/online
  const { isConnected } = useNetwork();
  const route = useRoute<FormDetailRouteProp>();
  const { formName } = route.params;
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [fields, setFields] = useState<RawField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isSubmittedRef = useRef(false);

  //what is happening here
  // When online → login → fetch → save for offline.
  // When offline → load from AsyncStorage.

  const loginAndFetchFields = useCallback(async () => {
    let allFields: RawField[] = [];

    try {
      let savedDoctypeData = await getDocTypeFromLocal(formName);
      if (!savedDoctypeData && isConnected) {
        // fetch + save if not available locally
        const fetched = await fetchDocType(formName);
        await saveDocTypeToLocal(formName, fetched);
        savedDoctypeData = fetched;
      }
      if (savedDoctypeData) {
        allFields = extractFields(savedDoctypeData);
      } else {
        console.warn('No cached data available for offline use');
      }

      const inputFields = allFields.filter(field =>
        ['Data', 'Select', 'Text', 'Int', 'Link'].includes(field.fieldtype)
      );

      const defaults: Record<string, any> = {};
      inputFields.forEach(field => {
        if (field.default) {
          defaults[field.fieldname] = field.default;
        }
      });
      setFormData(defaults);
      setFields(inputFields);
      setLoading(false);
    } catch (error: any) {
      console.error('Error in loginAndFetchFields:', error);
    } finally {
      setLoading(false);
    }
  }, [formName, isConnected]);

  useEffect(() => {
    if (isConnected != null) {
      loginAndFetchFields();
    }
  }, [formName, isConnected, loginAndFetchFields]);

  const handleSubmitConfirmation = () => {
    if (!formName || !formData) {
      return;
    }

    const missingFields = fields.filter(
      field =>
        !formData[field.fieldname] ||
        formData[field.fieldname].toString().trim() === ''
    );

    if (missingFields.length > 0) {
      const fieldNames = missingFields
        .map(field => field.label || field.fieldname)
        .join(', ');
      Alert.alert(
        t('common.error'),
        t('formDetail.requiredFields', { fields: fieldNames })
      );
      return;
    }

    if (Object.keys(formData).length === 0) {
      Alert.alert(t('common.error'), t('formDetail.noData'));
      return;
    }
    setConfirmModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formData) {
      return;
    }

    const doctype = await getDocTypeFromLocal(formName);
    if (!doctype) {
      Alert.alert(t('common.error'), t('formDetail.missingDoctype'));
      return;
    }
    const schemaHash = generateSchemaHash(doctype.fields);

    const newSubmission = {
      id: Date.now().toString(),
      formName,
      data: formData,
      schemaHash,
      status: 'pending' as 'pending' | 'submitted' | 'failed',
    };

    setLoading(true);
    setConfirmModalVisible(false);
    try {
      await enqueue(newSubmission);
      isSubmittedRef.current = true;
      await AsyncStorage.removeItem('tempFormData');
      setFormData({});
      setTimeout(() => {
        navigation.goBack();
      }, 100);
    } catch (e) {
      Alert.alert(t('common.error'), t('formDetail.errorSaving'));
      isSubmittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isSubmittedRef.current || Object.values(formData).length === 0) {
        // no data to save or form was submitted, don't prompt
        return;
      }
      // Prevent default back action
      e.preventDefault();
      Alert.alert(
        t('formDetail.discardChanges'),
        t('formDetail.unsavedDataMessage'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
          {
            text: t('formDetail.discard'),
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.removeItem('tempFormData'); // clear saved draft
              navigation.dispatch(e.data.action); // continue with back navigation
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, formData, t]);

  useEffect(() => {
    const restoreForm = async () => {
      const saved = await AsyncStorage.getItem('tempFormData');
      if (saved) {
        setFormData(JSON.parse(saved));
      }
    };
    restoreForm();
  }, []);

  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      isSubmittedRef.current = false;
    }
  }, [formData]);

  const handleChange = async (fieldname: string, value: any) => {
    const updated = { ...formData, [fieldname]: value };
    setFormData(updated);
    //store the temp data on every change
    await AsyncStorage.setItem('tempFormData', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.background }}
      >
        <Text
          className="mt-12 text-center text-lg"
          style={{ color: theme.text }}
        >
          {t('formDetail.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <View
        className="flex-row items-center justify-between border-b px-4 py-3 pt-10"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        }}
      >
        <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.text} size={16} />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text
            className="font-inter text-center text-[18px] font-semibold leading-[32px] tracking-[-0.006em]"
            style={{ color: theme.text }}
          >
            {t('formsList.title')}
          </Text>
        </View>
        <LanguageControl />
      </View>

      <KeyboardAwareScrollView
        // contentContainerStyle={{ padding: 24 }}
        extraScrollHeight={50}
        enableOnAndroid={true}
      >
        <ScrollView className="gap-3 p-6">
          <Text
            className="mb-1 text-3xl font-bold"
            style={{ color: theme.text }}
          >
            {formName}
          </Text>
          <Text className="mb-6 text-base" style={{ color: theme.subtext }}>
            {t('formDetail.subtitle')}
          </Text>
          <View className="flex-col">
            {fields.map(field => (
              <View key={field.fieldname} className="mb-4">
                <Text
                  className="font-sans text-sm font-medium leading-5 tracking-normal"
                  style={{ color: theme.text }}
                >
                  {field.label || field.fieldname}
                </Text>
                {field.fieldtype === 'Select' && field.options ? (
                  <View
                    className="z-50 w-full overflow-hidden rounded-md"
                    style={{ backgroundColor: theme.background }}
                  >
                    <SelectList
                      setSelected={(val: string) =>
                        handleChange(field.fieldname, val)
                      }
                      data={
                        field.options
                          ?.split('\n')
                          .map(opt => ({ key: opt, value: opt })) || []
                      }
                      save="value"
                      defaultOption={
                        field.default
                          ? { key: field.default, value: field.default }
                          : undefined
                      }
                      placeholder={t('formDetail.selectPlaceholder', {
                        label: field.label || field.fieldname,
                      })}
                      boxStyles={{
                        height: 45,
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 6,
                        backgroundColor: theme.background,
                      }}
                      dropdownStyles={{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 10,
                        backgroundColor: theme.dropdownBg,
                        shadowColor: theme.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 5,
                        zIndex: 1000,
                      }}
                      dropdownItemStyles={{
                        paddingVertical: 12,
                        paddingHorizontal: 15,
                      }}
                      dropdownTextStyles={{
                        fontSize: 16,
                        color: theme.text,
                      }}
                    />
                  </View>
                ) : (
                  <TextInput
                    className="h-[40px] w-full rotate-0 rounded-md border pb-2.5 pl-3 pr-3 pt-2.5 opacity-100"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      color: theme.text,
                    }}
                    placeholder={t('formDetail.enterPlaceholder', {
                      label: field.label || field.fieldname,
                    })}
                    placeholderTextColor={theme.subtext}
                    value={formData[field.fieldname] || ''}
                    onChangeText={text => handleChange(field.fieldname, text)}
                  />
                )}
              </View>
            ))}
            <TouchableOpacity
              className="w-full min-w-[80px] items-center justify-center gap-1 rounded-md p-4 opacity-100"
              style={{ backgroundColor: theme.buttonBackground }}
              onPress={handleSubmitConfirmation}
            >
              <Text className="" style={{ color: theme.buttonText }}>
                {t('formDetail.submit')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAwareScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View
          className="flex-1 items-center justify-center p-[1.25rem]"
          style={{ backgroundColor: theme.modalOverlay }}
        >
          <View
            className="h-[176px] w-full max-w-[512px] gap-4 rounded-[6px] border p-6 opacity-100"
            style={{
              backgroundColor: theme.modalBackground,
              borderColor: theme.border,
            }}
          >
            <Text
              className="font-inter text-[18px] font-semibold leading-[28px] tracking-[-0.006em]"
              style={{ color: theme.text }}
            >
              {t('formDetail.confirmSubmission') || 'Confirm Submission'}
            </Text>

            <Text
              className="font-inter text-[14px] font-normal leading-[20px] tracking-normal"
              style={{ color: theme.subtext }}
            >
              {t('formDetail.confirmSubmissionMessage') ||
                'Are you sure you want to submit this form? This action cannot be undone.'}
            </Text>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="h-[36px] w-[78px] items-center justify-center gap-2 rounded-md border px-4 opacity-100"
                style={{ borderColor: theme.border }}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text
                  className="font-inter align-middle text-[14px] font-medium leading-[20px] tracking-[-0.006em]"
                  style={{ color: theme.text }}
                >
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-lg px-4 py-2.5"
                style={{ backgroundColor: theme.buttonBackground }}
                onPress={handleSubmit}
              >
                <Text
                  className="font-inter align-middle text-[14px] font-medium leading-[20px] tracking-[-0.006em]"
                  style={{ color: theme.buttonText }}
                >
                  {t('common.ok')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default FormDetail;
