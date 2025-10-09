import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SelectList } from 'react-native-dropdown-select-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/RootStackedList';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNetwork } from "../../../context/NetworkProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enqueue } from '../../pendingQueue';
import { fetchDocType, getDocTypeFromLocal, saveDocTypeToLocal, extractFields } from '../../../api';
import { RawField } from '../../../types';
import { useTranslation } from 'react-i18next';
import LanguageControl from "../../components/LanguageControl"
import generateSchemaHash from "../../../helper/hashFunction"
import { ArrowLeft } from 'lucide-react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { HomeStackParamList } from '@/app/navigation/HomeStackParamList';

type FormDetailRouteProp = RouteProp<HomeStackParamList, 'FormDetail'>;
type FormDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainApp'>;

type Props = {
  navigation: FormDetailNavigationProp;
};

const FormDetail: React.FC<Props> = ({ navigation }) => {
  //this is the network status , make it true/false to simulate offline/online
  const { isConnected } = useNetwork();
  const route = useRoute<FormDetailRouteProp>();
  const { formName } = route.params;
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [fields, setFields] = useState<RawField[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    (isConnected != null) &&
      loginAndFetchFields();
  }, [formName]);

  //what is happening here
  // When online → login → fetch → save for offline.
  // When offline → load from AsyncStorage.

  const loginAndFetchFields = async () => {
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
        console.warn("No cached data available for offline use");
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
      console.error("Error in loginAndFetchFields:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitConfirmation = () => {
    if (!formName || !formData) return;

    const missingFields = fields.filter(field =>
      (!formData[field.fieldname] || formData[field.fieldname].toString().trim() === '')
    );

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => field.label || field.fieldname).join(', ');
      Alert.alert(t("common.error"), t("formDetail.requiredFields", { fields: fieldNames }));
      return;
    }

    if (Object.keys(formData).length === 0) {
      Alert.alert(t("common.error"), t("formDetail.noData"));
      return;
    }
    setConfirmModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formData) return;

    const doctype = await getDocTypeFromLocal(formName);
    if (!doctype) {
      Alert.alert(t("common.error"), t("formDetail.missingDoctype"));
      return;
    }
    const schemaHash = generateSchemaHash(doctype.fields);

    const newSubmission = {
      id: Date.now().toString(),
      formName,
      data: formData,
      schemaHash,
      status: "pending" as 'pending' | 'submitted' | 'failed',
    };

    setLoading(true);
    setConfirmModalVisible(false);
    try {
      await enqueue(newSubmission);
      isSubmittedRef.current = true;
      await AsyncStorage.removeItem("tempFormData");
      setFormData({});
      setTimeout(() => {
        navigation.goBack();
      }, 100);
    } catch (e) {
      Alert.alert(t("common.error"), t("formDetail.errorSaving"));
      isSubmittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
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
          { text: t('common.cancel'), style: "cancel", onPress: () => { } },
          {
            text: t('formDetail.discard'),
            style: "destructive",
            onPress: async () => {
              await AsyncStorage.removeItem("tempFormData"); // clear saved draft
              navigation.dispatch(e.data.action); // continue with back navigation
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, formData]);

  useEffect(() => {
    const restoreForm = async () => {
      const saved = await AsyncStorage.getItem("tempFormData");
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
    await AsyncStorage.setItem("tempFormData", JSON.stringify(updated));
  };

  if (loading) {
    return <Text className="text-lg text-center mt-12">{t('formDetail.loading')}</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 pt-10 bg-white border-gray-200">
        <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
          <ArrowLeft color="#020617" size={16} />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center">{t('formsList.title')}</Text>
        </View>
        <LanguageControl />
      </View>

      <KeyboardAwareScrollView
        // contentContainerStyle={{ padding: 24 }}
        extraScrollHeight={50}
        enableOnAndroid={true}
      >
        <ScrollView className="p-6 gap-3">

          <Text className="text-3xl font-bold text-gray-800 mb-1">{formName}</Text>
          <Text className="text-base text-gray-500 mb-6">{t('formDetail.subtitle')}</Text>
          <View className='flex-col'>
            {fields.map((field) => (
              <View key={field.fieldname} className="mb-4">
                <Text className="font-sans font-medium text-sm leading-5 tracking-normal text-[#020617]">{field.label || field.fieldname}</Text>
                {field.fieldtype === 'Select' && field.options ? (
                  <View className="w-full bg-white rounded-md overflow-hidden z-50">
                    <SelectList
                      setSelected={(val: string) => handleChange(field.fieldname, val)}
                      data={
                        field.options?.split('\n').map(opt => ({ key: opt, value: opt })) || []
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
                        borderColor: '#E2E8F0',
                        borderRadius: 6,
                        backgroundColor: '#FFFFFF',
                      }}
                      dropdownStyles={{
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 10,
                        backgroundColor: '#FFFFFF',
                        shadowColor: '#000',
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
                        color: '#111827',
                      }}
                    />
                  </View>
                ) : (
                  <TextInput
                    className="w-full h-[40px] rotate-0 opacity-100 rounded-md border pt-2.5 pr-3 pb-2.5 pl-3  border-[#E2E8F0]"
                    placeholder={t('formDetail.enterPlaceholder', { label: field.label || field.fieldname })}
                    value={formData[field.fieldname] || ''}
                    onChangeText={(text) => handleChange(field.fieldname, text)}
                  />
                )}
              </View>
            ))}
            <TouchableOpacity className="w-full min-w-[80px] opacity-100 rounded-md p-4 gap-1 justify-center items-center bg-[#0F172A]" onPress={handleSubmitConfirmation}>
              <Text className=" text-[#F8FAFC]">{t('formDetail.submit')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAwareScrollView >

      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View className="flex-1 bg-[#00000033] justify-center items-center p-[1.25rem]">
          <View className="w-full h-[176px] max-w-[512px] opacity-100 gap-4 rounded-[6px] border p-6 border-[#E2E8F0] bg-white">
            <Text className="font-inter font-semibold text-[18px] leading-[28px] tracking-[-0.006em] text-[#020617]">
              {t('formDetail.confirmSubmission') || 'Confirm Submission'}
            </Text>

            <Text className="font-inter font-normal text-[14px] leading-[20px] tracking-normal text-[#64748B]">
              {t('formDetail.confirmSubmissionMessage') || 'Are you sure you want to submit this form? This action cannot be undone.'}
            </Text>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="w-[78px] h-[36px] opacity-100 gap-2 rounded-md border px-4 items-center justify-center border-[#E2E8F0]"
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#020617]">{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-2.5 px-4 rounded-lg bg-[#0F172A]"
                onPress={handleSubmit}
              >
                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#F8FAFC]">{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView >

  );
};

export default FormDetail;
