import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
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
    return <Text style={styles.loading}>{t('formDetail.loading')}</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{formName}</Text>
        <LanguageControl />

      </View >

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{formName}</Text>
        <Text style={styles.subtitle}>{t('formDetail.subtitle')}</Text>

        {fields.map((field) => (
          <View key={field.fieldname} style={styles.inputContainer}>
            <Text style={styles.label}>{field.label || field.fieldname}</Text>

            {field.fieldtype === 'Select' && field.options ? (
              <SelectList
                setSelected={(val: string) => handleChange(field.fieldname, val)}
                data={field.options.split('\n').map(opt => ({ key: opt, value: opt }))}
                save="value"
                defaultOption={
                  field.default ? { key: field.default, value: field.default } : undefined
                }
                placeholder={t('formDetail.selectPlaceholder', { label: field.label || field.fieldname })}
                boxStyles={{ borderColor: '#ccc', marginTop: 8 }}
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder={t('formDetail.enterPlaceholder', { label: field.label || field.fieldname })}
                value={formData[field.fieldname] || ''}
                onChangeText={(text) => handleChange(field.fieldname, text)}
              />
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{t('formDetail.submit')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('formDetail.modalTitle')}</Text>
            <Text style={styles.modalDescription}>
              {t('formDetail.modalDescription')}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalUploadButton}
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalUploadText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  loading: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  backArrow: {
    fontSize: 24,
    color: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  content: {
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6e6e6e',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: '#2C3E50',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1E1E1E',
  },
  modalDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    backgroundColor: '#ffffff',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#333',
  },
  modalUploadButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2C3E50',
  },
  modalUploadText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default FormDetail;
