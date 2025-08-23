import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import { Languages } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetwork } from "../../../../context/NetworkProvider";
// import { fetchDocType } from '@/api';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FormsList'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

interface FormItem {
  name: string;
}

const FormsList: React.FC<Props> = ({ navigation }) => {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadStates, setDownloadStates] = useState<{ [key: string]: { isDownloaded: boolean, isDownloading: boolean } }>({});
  const isConnected = useNetwork();

  const API_BASE = 'https://erp.kisanmitra.net';

  useEffect(() => {
    if (isConnected !== null) {
      loginAndFetchForms();
    }
  }, [isConnected]);

  const loginAndFetchForms = async () => {
    setLoading(true);
    try {
      if (isConnected) {
        try {
          await axios.post(
            `${API_BASE}/api/method/login`,
            {
              usr: 'ads@aegiondynamic.com',
              pwd: 'Csa@2025',
            },
            { withCredentials: true }
          );

          const response = await axios.get(`${API_BASE}/api/resource/DocType`, {
            withCredentials: true,
          });

          const data = response.data.data;
          setForms(data);
        } catch (onlineError: any) {
          console.error('Error while online:', onlineError.message);
          // You can show a toast or alert to the user here
        }
      } else {
        try {
          const stored = await AsyncStorage.getItem("downloadedDoctypes");
          if (stored) {
            setForms(JSON.parse(stored));
          } else {
            setForms([]);
          }
        } catch (offlineError: any) {
          console.error('Error while offline:', offlineError.message);
          // Show offline-specific error to user
        }
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const checkAllDownloaded = async () => {
      const existingDoctypes = await AsyncStorage.getItem("downloadedDoctypes");
      const doctypes: FormItem[] = existingDoctypes ? JSON.parse(existingDoctypes) : [];

      const newDownloadStates: { [key: string]: { isDownloaded: boolean, isDownloading: boolean } } = {};
      forms.forEach(form => {
        const exists = doctypes.some((doctype) => doctype.name === form.name);
        newDownloadStates[form.name] = { isDownloaded: exists, isDownloading: false };
      });
      setDownloadStates(newDownloadStates);
    };

    if (forms.length > 0) {
      checkAllDownloaded();
    }
  }, [forms]);

  const handleDownload = async (docTypeName: string) => {
    setDownloadStates(prev => ({
      ...prev,
      [docTypeName]: { ...prev[docTypeName], isDownloading: true }
    }));

    try {
      await axios.post(
        `${API_BASE}/api/method/login`,
        {
          usr: 'ads@aegiondynamic.com',
          pwd: 'Csa@2025',
        },
        { withCredentials: true }
      );

      const response = await axios.get(`${API_BASE}/api/resource/DocType/${docTypeName}`, {
        withCredentials: true,
      });
      const docTypeData = response.data;

      //saves the doctype data
      await AsyncStorage.setItem(`docType_${docTypeName}`, JSON.stringify(docTypeData));

      //saves the list of downloaded doctypes
      const existingDoctypes = await AsyncStorage.getItem("downloadedDoctypes");
      const doctypes: FormItem[] = existingDoctypes ? JSON.parse(existingDoctypes) : [];

      const formItem = forms.find(form => form.name === docTypeName);
      if (formItem && !doctypes.some((doctype) => doctype.name === docTypeName)) {
        doctypes.push(formItem);
        await AsyncStorage.setItem("downloadedDoctypes", JSON.stringify(doctypes));
        setDownloadStates(prev => ({
          ...prev,
          [docTypeName]: { isDownloaded: true, isDownloading: false }
        }));
      }
    } catch (error) {
      console.error('Error downloading doctype:', error);
      setDownloadStates(prev => ({
        ...prev,
        [docTypeName]: { ...prev[docTypeName], isDownloading: false }
      }));
    }
  };

  const renderFormItem = ({ item }: { item: FormItem }) => {
    const itemState = downloadStates[item.name] || { isDownloaded: false, isDownloading: false };

    return (
      <TouchableOpacity style={styles.formItem}
        onPress={() => {

          navigation.navigate('FormDetail', { formName: item.name });

        }}
      >
        <Text style={styles.formName}>{item.name}</Text>
        {
          isConnected && (
            itemState.isDownloading ? (
              <ActivityIndicator size="small" color="blue" />
            ) : itemState.isDownloaded ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: 'green', fontSize: 16, marginRight: 4 }}>✓</Text>
                <Text style={{ color: 'green' }}>Downloaded</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: "blue", padding: 8, borderRadius: 5 }}
                onPress={() => { handleDownload(item.name) }}
              >
                <Text style={{ color: "white" }}>Download</Text>
              </TouchableOpacity>
            ))
        }
      </TouchableOpacity >
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>ERP 1</Text>
          <Text style={styles.subtitle}>{forms.length} Forms</Text>
        </View>
        <TouchableOpacity style={styles.translateButton}>
          <Languages size={42} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={forms}
        renderItem={renderFormItem}
        keyExtractor={(item) => item.name}
        style={styles.formsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 8 },
  backArrow: { fontSize: 20, color: '#333' },
  titleContainer: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  translateButton: { padding: 8 },
  formsList: { flex: 1, backgroundColor: '#ffffff' },
  formItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formName: { fontSize: 16, color: '#333', fontWeight: '400' },
  formStatus: { fontSize: 16, color: '#666' },
});

export default FormsList;
