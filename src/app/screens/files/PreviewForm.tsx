import {ArrowLeft, ChevronDown} from 'lucide-react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {Modal, TouchableOpacity, View, Text} from 'react-native';
import {ScrollView, TextInput} from 'react-native-gesture-handler';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {SafeAreaView} from 'react-native-safe-area-context';
import LanguageControl from '../../components/LanguageControl';
import {useTranslation} from 'react-i18next';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {SubmissionItem, RawField} from '../../../types';
import {getQueue, removeFromQueue} from '../../pendingQueue';
import {FormStackParamList} from '@/app/navigation/FormStackParamList';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../../../context/ThemeContext';

type PreviewFormRouteProp = RouteProp<FormStackParamList, 'PreviewForm'>;
type PreviewFormNavigationProp = NativeStackNavigationProp<
  FormStackParamList,
  'PreviewForm'
>;

function PreviewForm() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const route = useRoute<PreviewFormRouteProp>();
  const navigation = useNavigation<PreviewFormNavigationProp>();

  // State for form data
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submissionItem, setSubmissionItem] = useState<SubmissionItem | null>(
    null,
  );
  const [formFields, setFormFields] = useState<RawField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>(
    {},
  );
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  // Get the formId from route params
  const {formId} = route.params;

  // Helper function to parse JSON safely
  const tryParseJSON = (jsonString: string | null) => {
    try {
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (e) {
      return null;
    }
  };

  // Fetch form schema using form name
  const fetchFormSchema = useCallback(async (formName: string) => {
    try {
      console.log('Fetching form schema for:', formName);

      // Check if there's downloadDoctypes data
      const downloadDoctypesData =
        await AsyncStorage.getItem('downloadDoctypes');
      if (downloadDoctypesData) {
        const doctypes = tryParseJSON(downloadDoctypesData);
        if (doctypes && doctypes[formName]) {
          console.log(
            'Found form schema in downloadDoctypes:',
            doctypes[formName],
          );
          if (doctypes[formName].fields) {
            setFormFields(doctypes[formName].fields);
          }
          return;
        }
      }

      // Fallback: search in all docType_ prefixed keys
      const keys = await AsyncStorage.getAllKeys();
      const docTypeKeys = keys.filter(key => key.startsWith('docType_'));

      for (const key of docTypeKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsedData = tryParseJSON(data);
          if (
            parsedData &&
            (parsedData.name === formName || parsedData.doctype === formName)
          ) {
            console.log('Found form schema in docType_:', parsedData);
            if (parsedData.fields) {
              setFormFields(parsedData.fields);
            }
            return;
          }
        }
      }

      console.log('No form schema found for:', formName);
    } catch (error) {
      console.error('Error fetching form schema:', error);
    }
  }, []);

  const loadFormData = useCallback(async () => {
    try {
      console.log('Loading form data for formId:', formId);
      setIsLoading(true);
      const queue = await getQueue();
      console.log('Queue data:', queue);

      const foundForm = queue.find(
        (item: SubmissionItem) => item.id === formId,
      );
      console.log('Found form:', foundForm);

      if (foundForm) {
        setSubmissionItem(foundForm);
        setFormData(foundForm.data || {});
        console.log('Form data set:', foundForm.data);

        // Fetch form schema using form name
        await fetchFormSchema(foundForm.formName);
      } else {
        console.error('Form not found with ID:', formId);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formId, fetchFormSchema]);

  useEffect(() => {
    console.log('PreviewForm mounted with formId:', formId);
    console.log('Route params:', route.params);
    console.log('All route data:', route);
    loadFormData();
  }, [formId, loadFormData, route]);

  const handleChange = (fieldName: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    // Close dropdown after selection
    if (dropdownStates[fieldName]) {
      setDropdownStates(prev => ({
        ...prev,
        [fieldName]: false,
      }));
    }
  };

  const toggleDropdown = (fieldName: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const closeAllDropdowns = () => {
    setDropdownStates({});
    setSearchTerms({});
  };

  const updateSearchTerm = (fieldName: string, term: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [fieldName]: term,
    }));
  };

  // Close dropdowns when any other area is touched
  const handleOutsidePress = () => {
    const hasOpenDropdown = Object.values(dropdownStates).some(state => state);
    if (hasOpenDropdown) {
      closeAllDropdowns();
    }
  };

  const handleSubmitConfirmation = () => {
    setConfirmModalVisible(true);
  };

  const handleDeleteConfirmation = () => {
    setDeleteModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      // Add your submission logic here
      console.log('Submitting form:', submissionItem);
      setConfirmModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async () => {
    try {
      if (!submissionItem) return;
      console.log('Deleting form:', submissionItem);
      await removeFromQueue(submissionItem.id);
      console.log('Form deleted successfully');
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{backgroundColor: theme.background}}>
        <View
          className="flex-row items-center justify-between px-4 py-3 pt-10 border-b"
          style={{
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          }}>
          <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
            <ArrowLeft color={theme.text} size={16} />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text
              className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center"
              style={{color: theme.text}}>
              {t('common.loading')}
            </Text>
          </View>
          <LanguageControl />
        </View>
        <View className="flex-1 justify-center items-center">
          <Text style={{color: theme.subtext}}>
            {t('previewForm.loadingForm')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!submissionItem) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{backgroundColor: theme.background}}>
        <View
          className="flex-row items-center justify-between px-4 py-3 pt-10 border-b"
          style={{
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          }}>
          <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
            <ArrowLeft color={theme.text} size={16} />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text
              className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center"
              style={{color: theme.text}}>
              {t('common.error')}
            </Text>
          </View>
          <LanguageControl />
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-center mb-4" style={{color: theme.subtext}}>
            {t('previewForm.formNotFound')}
          </Text>
          <Text className="text-center mb-4" style={{color: theme.subtext}}>
            {t('previewForm.formId')}: {formId}
          </Text>
          <TouchableOpacity
            className="mt-4 px-4 py-2 rounded"
            style={{backgroundColor: theme.buttonBackground}}
            onPress={() => navigation.goBack()}>
            <Text style={{color: theme.buttonText}}>
              {t('previewForm.goBack')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formName = submissionItem.formName || 'Form Preview';

  // Create fields from the form schema if available, otherwise fallback to form data keys
  const fieldsToRender =
    formFields.length > 0
      ? formFields.map(field => ({
          fieldname: field.fieldname,
          label:
            field.label ||
            field.fieldname.charAt(0).toUpperCase() +
              field.fieldname.slice(1).replace(/([A-Z])/g, ' $1'),
          fieldtype: field.fieldtype || 'Data',
          options: field.options,
          value: formData[field.fieldname],
        }))
      : Object.keys(formData).map(key => ({
          fieldname: key,
          label:
            key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, ' $1'),
          fieldtype: typeof formData[key] === 'boolean' ? 'Check' : 'Data',
          options: undefined,
          value: formData[key],
        }));

  // Helper function to render field based on type
  const renderField = (field: any, index: number = 0) => {
    const {fieldname, label, fieldtype, options, value} = field;

    switch (fieldtype) {
      case 'Select':
        if (options) {
          const optionsList = options
            .split('\n')
            .filter((opt: string) => opt.trim());
          const isOpen = dropdownStates[fieldname] || false;
          const searchTerm = searchTerms[fieldname] || '';

          // Filter options based on search term
          const filteredOptions = optionsList.filter((option: string) =>
            option.trim().toLowerCase().includes(searchTerm.toLowerCase()),
          );

          return (
            <View
              key={fieldname}
              className="mb-4"
              style={{zIndex: 1000 - index}}>
              <Text
                className="font-sans font-medium text-sm leading-5 tracking-normal mb-2"
                style={{color: theme.text}}>
                {label}
              </Text>

              <View style={{position: 'relative'}}>
                {/* Dropdown Toggle Button */}
                <TouchableOpacity
                  className="w-full h-[40px] flex-row items-center justify-between rounded-md border px-3"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  }}
                  onPress={() => toggleDropdown(fieldname)}>
                  <Text
                    className="flex-1"
                    style={{color: value ? theme.text : theme.subtext}}>
                    {value || `Select ${label}`}
                  </Text>
                  <ChevronDown
                    size={16}
                    color={theme.subtext}
                    style={{
                      transform: [{rotate: isOpen ? '180deg' : '0deg'}],
                    }}
                  />
                </TouchableOpacity>

                {/* Dropdown Options */}
                {isOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 45,
                      left: 0,
                      right: 0,
                      zIndex: 2000,
                      backgroundColor: theme.dropdownBg,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 8,
                      shadowColor: theme.shadow,
                      shadowOffset: {width: 0, height: 4},
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 20,
                      maxHeight: 250,
                    }}>
                    {/* Search Input */}
                    <View
                      className="p-2 border-b"
                      style={{borderBottomColor: theme.border}}>
                      <TextInput
                        className="w-full h-[35px] rounded border px-3 text-sm"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                          color: theme.text,
                        }}
                        placeholder={`Search ${label.toLowerCase()}...`}
                        placeholderTextColor={theme.subtext}
                        value={searchTerm}
                        onChangeText={text => updateSearchTerm(fieldname, text)}
                        autoFocus={false}
                      />
                    </View>

                    {/* Options List */}
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={{maxHeight: 180}}>
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map(
                          (option: string, optIndex: number) => (
                            <TouchableOpacity
                              key={optIndex}
                              className={`px-4 py-3 ${optIndex < filteredOptions.length - 1 ? 'border-b' : ''}`}
                              style={{
                                backgroundColor:
                                  value === option.trim()
                                    ? theme.dropdownSelectedBg
                                    : theme.background,
                                borderBottomColor:
                                  optIndex < filteredOptions.length - 1
                                    ? theme.border
                                    : undefined,
                              }}
                              onPress={() => {
                                handleChange(fieldname, option.trim());
                                updateSearchTerm(fieldname, ''); // Clear search after selection
                              }}>
                              <Text
                                style={{
                                  color:
                                    value === option.trim()
                                      ? theme.selectedText
                                      : theme.text,
                                  fontWeight:
                                    value === option.trim() ? '600' : 'normal',
                                }}>
                                {option.trim()}
                              </Text>
                            </TouchableOpacity>
                          ),
                        )
                      ) : (
                        <View className="px-4 py-6">
                          <Text
                            className="text-center text-sm"
                            style={{color: theme.subtext}}>
                            No options found for "{searchTerm}"
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Add dynamic spacing when dropdown is open to push content down */}
              {isOpen && (
                <View
                  style={{
                    height: Math.min(filteredOptions.length * 48 + 60, 250) + 5, // +60 for search input
                    width: '100%',
                  }}
                />
              )}
            </View>
          );
        }
        // Fallback to text input if no options
        return (
          <View key={fieldname} className="mb-4">
            <Text
              className="font-sans font-medium text-sm leading-5 tracking-normal"
              style={{color: theme.text}}>
              {label}
            </Text>
            <TextInput
              className="w-full h-[40px] rotate-0 opacity-100 rounded-md border pt-2.5 pr-3 pb-2.5 pl-3"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.background,
                color: theme.text,
              }}
              placeholder={label}
              placeholderTextColor={theme.subtext}
              value={String(value || '')}
              onChangeText={text => handleChange(fieldname, text)}
              editable={true}
            />
          </View>
        );

      case 'Check':
        return (
          <View key={fieldname} className="mb-4">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => handleChange(fieldname, !value)}>
              <View
                className="w-5 h-5 rounded border-2 mr-3 flex items-center justify-center"
                style={{
                  backgroundColor: value
                    ? theme.buttonBackground
                    : 'transparent',
                  borderColor: value ? theme.buttonBackground : theme.border,
                }}>
                {value && (
                  <Text className="text-xs" style={{color: theme.buttonText}}>
                    ✓
                  </Text>
                )}
              </View>
              <Text
                className="font-sans font-medium text-sm leading-5 tracking-normal"
                style={{color: theme.text}}>
                {label}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'Text':
        return (
          <View key={fieldname} className="mb-4">
            <Text
              className="font-sans font-medium text-sm leading-5 tracking-normal"
              style={{color: theme.text}}>
              {label}
            </Text>
            <TextInput
              className="w-full min-h-[80px] rotate-0 opacity-100 rounded-md border pt-2.5 pr-3 pb-2.5 pl-3"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.background,
                color: theme.text,
              }}
              placeholder={label}
              placeholderTextColor={theme.subtext}
              value={String(value || '')}
              onChangeText={text => handleChange(fieldname, text)}
              multiline={true}
              textAlignVertical="top"
              editable={true}
            />
          </View>
        );

      default:
        // Default to regular text input
        return (
          <View key={fieldname} className="mb-4">
            <Text
              className="font-sans font-medium text-sm leading-5 tracking-normal"
              style={{color: theme.text}}>
              {label}
            </Text>
            <TextInput
              className="w-full h-[40px] rotate-0 opacity-100 rounded-md border pt-2.5 pr-3 pb-2.5 pl-3"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.background,
                color: theme.text,
              }}
              placeholder={label}
              placeholderTextColor={theme.subtext}
              value={String(value || '')}
              onChangeText={text => handleChange(fieldname, text)}
              editable={true}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{backgroundColor: theme.background}}>
      <View
        className="flex-row items-center justify-between px-4 py-3 pt-10 border-b"
        style={{
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        }}>
        <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.text} size={16} />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text
            className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center"
            style={{color: theme.text}}>
            {t('previewForm.title')}
          </Text>
        </View>
        <LanguageControl />
      </View>

      <KeyboardAwareScrollView
        // contentContainerStyle={{ padding: 24 }}
        extraScrollHeight={50}
        enableOnAndroid={true}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleOutsidePress}
          className="flex-1">
          <ScrollView className="p-6 gap-3">
            <Text
              className="text-3xl font-bold mb-1"
              style={{color: theme.text}}>
              {formName}
            </Text>
            <Text className="text-base mb-6" style={{color: theme.subtext}}>
              {t('previewForm.subtitle')}
            </Text>

            <View className="flex-col">
              {fieldsToRender.map((field, index) => renderField(field, index))}
              <View className="flex flex-col gap-3 mt-8">
                <TouchableOpacity
                  className="w-full min-w-[80px] opacity-100 rounded-md p-4 gap-1 justify-center items-center"
                  style={{backgroundColor: theme.buttonBackground}}
                  onPress={handleSubmitConfirmation}>
                  <Text style={{color: theme.buttonText}}>
                    {t('formDetail.submit')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-full min-w-[80px] opacity-100 rounded-md p-4 gap-1 justify-center items-center"
                  style={{backgroundColor: '#EF2226'}}
                  onPress={handleDeleteConfirmation}>
                  <Text className="text-white">
                    {t('formDetail.deleteForm')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}>
        <View
          className="flex-1 justify-center items-center p-[1.25rem]"
          style={{backgroundColor: theme.modalOverlay}}>
          <View
            className="w-full h-[176px] max-w-[512px] opacity-100 gap-4 rounded-[6px] border p-6"
            style={{
              backgroundColor: theme.modalBackground,
              borderColor: theme.border,
            }}>
            <Text
              className="font-inter font-semibold text-[18px] leading-[28px] tracking-[-0.006em]"
              style={{color: theme.text}}>
              {t('formDetail.confirmSubmission')}
            </Text>

            <Text
              className="font-inter font-normal text-[14px] leading-[20px] tracking-normal"
              style={{color: theme.subtext}}>
              {t('formDetail.confirmSubmissionMessage')}
            </Text>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="w-[78px] h-[36px] opacity-100 gap-2 rounded-md border px-4 items-center justify-center"
                style={{borderColor: theme.border}}
                onPress={() => setConfirmModalVisible(false)}>
                <Text
                  className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle"
                  style={{color: theme.text}}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-2.5 px-4 rounded-lg"
                style={{backgroundColor: theme.buttonBackground}}
                onPress={handleSubmit}>
                <Text
                  className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle"
                  style={{color: theme.buttonText}}>
                  {t('common.ok')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View
          className="flex-1 justify-center items-center p-[1.25rem]"
          style={{backgroundColor: theme.modalOverlay}}>
          <View
            className="w-full h-[176px] max-w-[512px] opacity-100 gap-4 rounded-[6px] border p-6"
            style={{
              backgroundColor: theme.modalBackground,
              borderColor: theme.border,
            }}>
            <Text
              className="font-inter font-semibold text-[18px] leading-[28px] tracking-[-0.006em]"
              style={{color: theme.text}}>
              {t('previewForm.deleteThisForm')}
            </Text>

            <Text
              className="font-inter font-normal text-[14px] leading-[20px] tracking-normal"
              style={{color: theme.subtext}}>
              {t('previewForm.confirmDeleteMessage', {formName: formName})}
            </Text>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="w-[78px] h-[36px] opacity-100 gap-2 rounded-md border px-4 items-center justify-center"
                style={{borderColor: theme.border}}
                onPress={() => setDeleteModalVisible(false)}>
                <Text
                  className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle"
                  style={{color: theme.text}}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-2.5 px-4 rounded-lg"
                style={{backgroundColor: '#EF2226'}}
                onPress={handleDelete}>
                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-white">
                  {t('common.delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
export default PreviewForm;
