import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import { Languages } from 'lucide-react-native';
import axios from 'axios';

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

  const API_BASE = 'https://erp.kisanmitra.net';

  useEffect(() => {
    loginAndFetchForms();
  }, []);

  const loginAndFetchForms = async () => {
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
    } catch (error: any) {
      console.error('Error fetching forms:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderFormItem = ({ item }: { item: FormItem }) => (
    <TouchableOpacity
      style={styles.formItem}
      onPress={() => navigation.navigate('FormDetail')}
    >
      <Text style={styles.formName}>{item.name}</Text>
      <Text style={styles.formStatus}>Open</Text>
    </TouchableOpacity>
  );

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
