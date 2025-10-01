import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import React, { useState, useEffect, use } from 'react';
import { SelectList } from 'react-native-dropdown-select-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNetwork } from "../../../../context/NetworkProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enqueue } from '../../../pendingQueue';
import { fetchDocType, getDocTypeFromLocal, saveDocTypeToLocal, extractFields } from '../../../../api';
import { RawField } from '../../../../types';
import { useTranslation } from 'react-i18next';
import LanguageControl from "../../../components/LanguageControl"
import generateSchemaHash from "../../../../helper/hashFunction"
import { ArrowLeft } from 'lucide-react-native';

type FormDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FormDetail'
>;

type FormDetailRouteProp = RouteProp<RootStackParamList, "FormDetail">;

type Props = {
  navigation: FormDetailNavigationProp;
};

const FormDetail: React.FC<Props> = ({ navigation }) => {
  //this is the network status , make it true/false to simulate offline/online
  const { isConnected } = useNetwork();
  const route = useRoute<FormDetailRouteProp>();
  const { formName } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [fields, setFields] = useState<RawField[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

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

  const handleSubmit = async () => {
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
    try {
      await enqueue(newSubmission);
      setFormData({});
      await AsyncStorage.removeItem("tempFormData");
    } catch (e) {
      Alert.alert(t("common.error"), t("formDetail.errorSaving"));
    } finally {
      setLoading(false);
      setModalVisible(true);
    }
  };

  //to remove the temp data after user uses naigation
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (Object.keys(formData).length === 0) {
        // no data to save, don't prompt
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

  //to restore the temp data when user losses internet and wants to continue filling the form 
  useEffect(() => {
    const restoreForm = async () => {
      const saved = await AsyncStorage.getItem("tempFormData");
      if (saved) {
        setFormData(JSON.parse(saved));
      }
    };
    restoreForm();
  }, []);

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
          <Text className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center">ERP 1</Text>
        </View>
        <LanguageControl />
      </View>

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
          <TouchableOpacity className="w-[345px] h-[40px] min-w-[80px] opacity-100 rounded-md p-4 gap-1 justify-center items-center bg-[#0F172A]" onPress={handleSubmit}>
            <Text className="w-[55px] h-[24px] text-[#F8FAFC] 
">{t('formDetail.submit')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>


      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/30 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 w-4/5 shadow-lg"></View>
          <Text className="text-xl font-bold mb-3 text-gray-900">{t('formDetail.modalTitle')}</Text>
          <Text className="text-sm text-gray-600 mb-6">
            {t('formDetail.modalDescription')}
          </Text>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              className="py-2.5 px-4 rounded-lg border border-gray-400 bg-white"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-sm text-gray-800">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-2.5 px-4 rounded-lg bg-slate-700"
              onPress={() => {
                setModalVisible(false);
              }}
            >
              <Text className="text-sm text-white font-semibold">{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView >

  );
};

export default FormDetail;
