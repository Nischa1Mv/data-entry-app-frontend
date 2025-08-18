import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/shared/RootStackedList';
import React from 'react';
import { Languages } from 'lucide-react-native';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ERP'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const ERP: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <View>
          <Text style={styles.heading}>Welcome back!</Text>
          <Text style={styles.subtext}>
            Here's a list of your ERP Systems for you!
          </Text>
        </View>
        <Languages size={42}></Languages>
      </View>

      <ScrollView contentContainerStyle={styles.block}>
        <View style={styles.top}>
          <TouchableOpacity style={styles.box} onPress={() => navigation.navigate('FormsList')}>
              <Text>ERP 1</Text>
              <Text>15 Forms</Text>
          </TouchableOpacity>
          <View style={styles.box}>
            <Text>ERP 2</Text>
            <Text>15 Forms</Text>
          </View>
        </View>

        <View style={styles.top}>
          <View style={styles.box}>
            <Text>ERP 3</Text>
            <Text>15 Forms</Text>
          </View>
          <View style={styles.box}>
            <Text>ERP 4</Text>
            <Text>15 Forms</Text>
          </View>
        </View>

        <View style={styles.top}>
          <View style={styles.box}>
            <Text>ERP 5</Text>
            <Text>15 Forms</Text>
          </View>
          <View style={styles.box}>
            <Text>ERP 6</Text>
            <Text>15 Forms</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    paddingTop: 80,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '85%',
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 14,
    color: '#999999',
  },
  image: {
    height: 30,
    width: 30,
  },
  block: {
    alignItems: 'center',
    margin: 10,
    width: '100%',
  },
  top: {
    flexDirection: 'row',
    width: '95%',
    justifyContent: 'center',
  },
  box: {
    width: '45%',
    minHeight: 100,
    borderRadius: 20,
    borderColor: '#000',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
});

export default ERP;
