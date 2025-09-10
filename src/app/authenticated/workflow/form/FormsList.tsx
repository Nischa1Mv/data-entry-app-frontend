import React, { use, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import { Languages } from 'lucide-react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetwork } from "../../../../context/NetworkProvider";
import { useFocusEffect } from "@react-navigation/native";
import { fetchDocType, fetchAllDocTypeNamess, getAllDoctypesFromLocal, saveDocTypeToLocal, getAllDocTypeNames } from '../../../../api';
import { DocType, FormItem } from '../../../../types';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FormsList'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const FormsList: React.FC<Props> = ({ navigation }) => {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadStates, setDownloadStates] = useState<{ [key: string]: { isDownloaded: boolean, isDownloading: boolean } }>({});
  const isConnected = useNetwork();

  const API_BASE = 'https://erp.kisanmitra.net';

  useEffect(() => {
    const loadForms = async () => {
      // if connected fetch from server
      setLoading(true);
      try {
        if (isConnected) {
          const docTypeNames = await loginAndFetchForms() as FormItem[];
          setForms(docTypeNames);
        }
        else {
          // else get form local storage
          const stored = await getAllDocTypeNames() as FormItem[];
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
      const data = await fetchAllDocTypeNamess() as FormItem[];
      return data;
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  }

  useFocusEffect(() => {
    const checkDownloadStatus = async () => {
      const existingDoctypeData = await AsyncStorage.getItem("downloadDoctypes");
      const allDocTypeStorage: Record<string, any> = existingDoctypeData
        ? JSON.parse(existingDoctypeData)
        : {};
      const initialDownloadStates = forms.reduce((acc, f) => {
        acc[f.name] = {
          isDownloaded: !!allDocTypeStorage[f.name], // true if exists in storage
          isDownloading: false
        };
        return acc;
      }, {} as Record<string, { isDownloaded: boolean; isDownloading: boolean }>);

      setDownloadStates(initialDownloadStates);
    };

    if (forms.length > 0 && isConnected) {
      checkDownloadStatus();
    }
  });


  const handleDownload = async (docTypeName: string) => {
    setDownloadStates(prev => ({
      ...prev,
      [docTypeName]: { ...prev[docTypeName], isDownloading: true }
    }));

    try {
      const docTypeData = await fetchDocType(docTypeName);

      //saves the doctype data
      await saveDocTypeToLocal(docTypeName, docTypeData);

      // Update download state to show as downloaded
      setDownloadStates(prev => ({
        ...prev,
        [docTypeName]: { isDownloaded: true, isDownloading: false }
      }));
    } catch (error) {
      console.error('Error downloading doctype:', error);
      // Reset download state on error
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
