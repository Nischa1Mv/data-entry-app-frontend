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
import React, { useState, useEffect } from 'react';
import { SelectList } from 'react-native-dropdown-select-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import axios from 'axios';
import { Languages } from 'lucide-react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNetwork } from "../../../../context/NetworkProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enqueue } from '../../../pendingQueue';

type FormDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FormDetail'
>;

type FormDetailRouteProp = RouteProp<RootStackParamList, "FormDetail">;

type Props = {
  navigation: FormDetailNavigationProp;
};

interface FormItem {
  name: string;
}

type Field = {
  fieldname: string;
  fieldtype: string;
  label: string;
  options?: string;
  default?: string;
};

const FormDetail: React.FC<Props> = ({ navigation }) => {
  //this is the network status , make it true/false to simulate offline/online
  const isConnected = useNetwork();
  const route = useRoute<FormDetailRouteProp>();
  const { formName } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const API_BASE = 'https://erp.kisanmitra.net';

  useEffect(() => {
    (isConnected != null) &&
      loginAndFetchFields();
  }, [formName]);

  //what is happening here
  // When online → login → fetch → save for offline.
  // When offline → load from AsyncStorage.

  const loginAndFetchFields = async () => {
    try {
      let allFields: Field[] = [];
      const cached = await AsyncStorage.getItem(`docType_${formName}`);
      if (isConnected) {
        if (!cached) {
          await axios.post(
            `${API_BASE}/api/method/login`,
            {
              usr: 'ads@aegiondynamic.com',
              pwd: 'Csa@2025',
            },
            {
              withCredentials: true,
            }
          );

          const response = await axios.get(
            `${API_BASE}/api/resource/DocType/${formName}`,
            {
              withCredentials: true,
            }
          );

          allFields = response.data.data.fields;
          //saves for offline use 
          await AsyncStorage.setItem(`docType_${formName}`, JSON.stringify(response.data));
          const existingDoctypes = await AsyncStorage.getItem("downloadedDoctypes");
          const doctypes: FormItem[] = existingDoctypes ? JSON.parse(existingDoctypes) : [];
          //syncs the list of downloaded doctypes
          const newItem: FormItem = { name: formName };
          if (!doctypes.some((doctype) => doctype.name === newItem.name)) {
            doctypes.push(newItem);
            await AsyncStorage.setItem("downloadedDoctypes", JSON.stringify(doctypes));
          }
        } else {
          // Already cached, use it
          const parsedData = JSON.parse(cached);
          allFields = parsedData.data.fields || [
            { fieldname: 'name', fieldtype: 'Data', label: 'Name' }
          ];
        }
      } else {
        // Offline: use cached data
        if (cached) {
          const parsedData = JSON.parse(cached);
          allFields = parsedData.data.fields || [
            { fieldname: 'name', fieldtype: 'Data', label: 'Name' }
          ];
        } else {
          console.warn("No cached data available for offline use");
          allFields = [];
        }
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
      console.error('Error fetching data:', error.message);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const newSubmission = {
      id: Date.now().toString(),
      formName,
      data: formData,
      status: "pending",
    };
    setLoading(true);
    try {
      await enqueue(newSubmission);
      setFormData({}); 
    } catch (e) {
      Alert.alert("Error", "Failed to save submission.");
    } finally {
      setLoading(false); 
      setModalVisible(true);
    }
  };

  const handleChange = (fieldname: string, value: any) => {
    setFormData({ ...formData, [fieldname]: value });
  };

  if (loading) {
    return <Text style={styles.loading}>Loading...</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{formName}</Text>
        <TouchableOpacity>
          <Languages size={42} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{formName}</Text>
        <Text style={styles.subtitle}>Fill in the form below</Text>

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
                placeholder={`Select ${field.label}`}
                boxStyles={{ borderColor: '#ccc', marginTop: 8 }}
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder={`Enter ${field.label || field.fieldname}`}
                value={formData[field.fieldname] || ''}
                onChangeText={(text) => handleChange(field.fieldname, text)}
              />
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
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
            <Text style={styles.modalTitle}>Form is ready to upload!</Text>
            <Text style={styles.modalDescription}>
              Form needs to be uploaded after the network is available.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalUploadButton}
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalUploadText}>ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
