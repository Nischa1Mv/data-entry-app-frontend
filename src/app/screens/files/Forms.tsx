import React, {useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LanguageControl from '../../components/LanguageControl';
import {getQueue} from '../../pendingQueue';
import {useTranslation} from 'react-i18next';
import {SubmissionItem} from '../../../types';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FormStackParamList} from '../../navigation/FormStackParamList';
import {useTheme} from '../../../context/ThemeContext';

type FormsNavigationProp = NativeStackNavigationProp<
  FormStackParamList,
  'Forms'
>;

function Forms() {
  const [queueData, setQueueData] = useState<SubmissionItem[]>([]);
  const [pendingFormsCount, setPendingFormsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const {t} = useTranslation();
  const {theme} = useTheme();
  const navigation = useNavigation<FormsNavigationProp>();

  useFocusEffect(
    useCallback(() => {
      fetchPendingForms();
    }, []),
  );

  const fetchPendingForms = async () => {
    try {
      setIsLoading(true);

      const pendingSubmissions = await getQueue();

      if (Array.isArray(pendingSubmissions)) {
        setQueueData(pendingSubmissions);
        setPendingFormsCount(pendingSubmissions.length);
      } else {
        setQueueData([]);
        setPendingFormsCount(0);
      }
    } catch (e) {
      console.error('Error fetching pending forms:', e);
      setPendingFormsCount(0);
      setQueueData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAllForms = async () => {
    if (pendingFormsCount === 0) {
      Alert.alert(
        t('formsScreen.noFormsAlert'),
        t('formsScreen.noFormsMessage'),
      );
      return;
    }

    Alert.alert(
      t('formsScreen.submitAllFormsTitle'),
      t('formsScreen.submitAllFormsMessage', {count: pendingFormsCount}),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('formsScreen.submit'),
          onPress: async () => {
            // Add your submission logic here
            console.log('Submitting all forms:', queueData);
            // You can call your submission function here
          },
        },
      ],
    );
  };

  const handleSubmitSingleForm = async (
    index: number,
    formData: SubmissionItem,
  ) => {
    Alert.alert(
      t('formsScreen.submitFormTitle'),
      t('formsScreen.submitFormMessage', {
        formName: formData?.formName || `Form ${index + 1}`,
      }),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('formsScreen.submit'),
          onPress: async () => {
            try {
              // Add your single form submission logic here
              console.log('Submitting single form:', formData);
              // After successful submission, refresh the pending forms
              fetchPendingForms();
            } catch (error) {
              console.error('Error submitting form:', error);
              Alert.alert(
                t('formsScreen.submitError'),
                t('formsScreen.submitErrorMessage'),
              );
            }
          },
        },
      ],
    );
  };
  return (
    <SafeAreaView
      className="flex-1"
      style={{backgroundColor: theme.background}}>
      <View
        className="flex-row items-center justify-between px-4 py-3 pt-10 mb-5"
        style={{backgroundColor: theme.background}}>
        <View className="flex-1 items-center">
          <Text
            className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center"
            style={{color: theme.text}}>
            {t('formsScreen.title')}
          </Text>
        </View>
        <LanguageControl />
      </View>
      <View className="mx-6 mb-5">
        <View
          className="p-4 border rounded-lg flex-row justify-between items-start"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.cardBackground,
          }}>
          <View className="flex-1 mr-3">
            <Text
              className="text-lg font-bold"
              style={{color: theme.pendingText}}>
              {t('formsScreen.pendingForms', {count: pendingFormsCount})}
            </Text>
            <Text
              className="font-inter font-semibold text-2xl leading-8 tracking-[-0.006em]"
              style={{color: theme.pendingText}}>
              {isLoading ? '...' : `${pendingFormsCount} FORMS`}
            </Text>
          </View>
          <TouchableOpacity
            className="flex-shrink-0"
            onPress={handleSubmitAllForms}
            disabled={isLoading || pendingFormsCount === 0}>
            <Text
              className="border px-3 py-2 text-sm rounded-xl"
              style={{
                borderColor:
                  isLoading || pendingFormsCount === 0
                    ? theme.subtext
                    : theme.pendingBorder,
                color:
                  isLoading || pendingFormsCount === 0
                    ? theme.subtext
                    : theme.pendingText,
              }}>
              {t('home.submitAllForms')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="px-4">
        <Text
          className="font-inter font-semibold text-base leading-8 tracking-[-0.006em] text-center"
          style={{color: theme.text}}>
          {t('formsScreen.pendingForms')}
        </Text>

        {isLoading ? (
          <View className="flex items-center justify-center py-8">
            <Text style={{color: theme.subtext}}>
              {t('formsScreen.loadingPendingForms')}
            </Text>
          </View>
        ) : queueData.length === 0 ? (
          <View className="flex items-center justify-center py-8">
            <Text style={{color: theme.subtext}}>
              {t('formsScreen.noPendingForms')}
            </Text>
          </View>
        ) : (
          queueData.map((item, index) => {
            const formData = item;
            const formName = formData?.formName || `Form ${index + 1}`;
            const formattedDate = new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <View
                key={item.id}
                className="flex flex-row justify-between px-4 py-4 border w-full"
                style={{
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }}>
                <TouchableOpacity
                  onPress={() => {
                    console.log(
                      'Navigating to PreviewForm with formId:',
                      item.id,
                    );
                    navigation.navigate('PreviewForm', {formId: item.id});
                  }}>
                  <View className="flex flex-col items-start">
                    <Text
                      className="font-inter font-normal text-sm leading-5 text-left"
                      style={{color: theme.text}}>
                      {formName}
                    </Text>
                    <Text
                      className="font-inter font-light text-[10px] leading-5 text-left"
                      style={{color: theme.subtext}}>
                      {t('formsScreen.filledOn', {date: formattedDate})}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSubmitSingleForm(index, formData)}>
                  <View className="flex w-[117px] h-[40px] items-center justify-center">
                    <Text
                      className="font-inter font-medium text-sm leading-5 text-right"
                      style={{color: theme.text}}>
                      {t('formsScreen.submitForm')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </SafeAreaView>
  );
}

export default Forms;
