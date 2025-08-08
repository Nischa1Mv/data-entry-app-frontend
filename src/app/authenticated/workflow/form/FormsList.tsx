import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import { Languages } from 'lucide-react-native';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FormsList'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

interface FormItem {
  id: string;
  name: string;
  status: string;
}

const FormsList: React.FC<Props> = ({ navigation }) => {
  const forms: FormItem[] = [
    { id: '1', name: 'Form 1', status: 'Open' },
    { id: '2', name: 'Form 2', status: 'Open' },
    { id: '3', name: 'Form 3', status: 'Open' },
    { id: '4', name: 'Form 4', status: 'Open' },
    { id: '5', name: 'Form 5', status: 'Open' },
    { id: '6', name: 'Form 6', status: 'Open' },
    { id: '7', name: 'Form 7', status: 'Open' },
    { id: '8', name: 'Form 8', status: 'Open' },
    { id: '9', name: 'Form 9', status: 'Open' },
    { id: '10', name: 'Form 10', status: 'Open' },
  ];

  const renderFormItem = ({ item }: { item: FormItem }) => (
    <TouchableOpacity style={styles.formItem} onPress={() => navigation.navigate('FormDetail')}>
      <Text style={styles.formName}>{item.name}</Text>
      <Text style={styles.formStatus}>{item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>ERP 1</Text>
          <Text style={styles.subtitle}>15 Forms</Text>
        </View>
        <TouchableOpacity style={styles.translateButton}>
          <Languages size={42}></Languages>
        </TouchableOpacity>
      </View>

      <FlatList
        data={forms}
        renderItem={renderFormItem}
        keyExtractor={(item) => item.id}
        style={styles.formsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
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
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 20,
    color: '#333',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  translateButton: {
    padding: 8,
  },
  image: {
    height: 30,
    width: 30,
  },
  formsList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  formItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  formStatus: {
    fontSize: 16,
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  navIcon: {
    fontSize: 20,
  },
});

export default FormsList;