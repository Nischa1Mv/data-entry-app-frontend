import { ArrowLeft, ChevronDown } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Modal, TouchableOpacity, View, Text } from 'react-native'
import { ScrollView, TextInput } from 'react-native-gesture-handler'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import LanguageControl from '../../components/LanguageControl'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SubmissionItem, RawField } from '../../../types'
import { getQueue, removeFromQueue } from '../../pendingQueue'
import { FormStackParamList } from '@/app/navigation/FormStackParamList'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import AsyncStorage from '@react-native-async-storage/async-storage'

type PreviewFormRouteProp = RouteProp<FormStackParamList, 'PreviewForm'>;
type PreviewFormNavigationProp = NativeStackNavigationProp<FormStackParamList, 'PreviewForm'>;

function PreviewForm() {
    const { t } = useTranslation();
    const route = useRoute<PreviewFormRouteProp>();
    const navigation = useNavigation<PreviewFormNavigationProp>();

    // State for form data
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submissionItem, setSubmissionItem] = useState<SubmissionItem | null>(null);
    const [formFields, setFormFields] = useState<RawField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>({});
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

    // Get the formId from route params
    const { formId } = route.params;

    useEffect(() => {
        console.log('PreviewForm mounted with formId:', formId);
        console.log('Route params:', route.params);
        console.log('All route data:', route);
        loadFormData();
    }, [formId]);

    const loadFormData = async () => {
        try {
            console.log('Loading form data for formId:', formId);
            setIsLoading(true);
            const queue = await getQueue();
            console.log('Queue data:', queue);

            const foundForm = queue.find((item: SubmissionItem) => item.id === formId);
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
    };

    // Helper function to parse JSON safely
    const tryParseJSON = (jsonString: string | null) => {
        try {
            return jsonString ? JSON.parse(jsonString) : null;
        } catch (e) {
            return null;
        }
    };

    // Fetch form schema using form name
    const fetchFormSchema = async (formName: string) => {
        try {
            console.log('Fetching form schema for:', formName);
            
            // Check if there's downloadDoctypes data
            const downloadDoctypesData = await AsyncStorage.getItem('downloadDoctypes');
            if (downloadDoctypesData) {
                const doctypes = tryParseJSON(downloadDoctypesData);
                if (doctypes && doctypes[formName]) {
                    console.log('Found form schema in downloadDoctypes:', doctypes[formName]);
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
                    if (parsedData && (parsedData.name === formName || parsedData.doctype === formName)) {
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
    };

    const handleChange = (fieldName: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
        // Close dropdown after selection
        if (dropdownStates[fieldName]) {
            setDropdownStates(prev => ({
                ...prev,
                [fieldName]: false
            }));
        }
    };

    const toggleDropdown = (fieldName: string) => {
        setDropdownStates(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
    };

    const closeAllDropdowns = () => {
        setDropdownStates({});
        setSearchTerms({});
    };

    const updateSearchTerm = (fieldName: string, term: string) => {
        setSearchTerms(prev => ({
            ...prev,
            [fieldName]: term
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
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-row items-center justify-between px-4 py-3 pt-10 bg-white border-gray-200">
                    <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#020617" size={16} />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center">{t('common.loading')}</Text>
                    </View>
                    <LanguageControl />
                </View>
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">{t('previewForm.loadingForm')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!submissionItem) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-row items-center justify-between px-4 py-3 pt-10 bg-white border-gray-200">
                    <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#020617" size={16} />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center">{t('common.error')}</Text>
                    </View>
                    <LanguageControl />
                </View>
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500 text-center mb-4">{t('previewForm.formNotFound')}</Text>
                    <Text className="text-gray-400 text-center mb-4">{t('previewForm.formId')}: {formId}</Text>
                    <TouchableOpacity
                        className="mt-4 px-4 py-2 bg-blue-500 rounded"
                        onPress={() => navigation.goBack()}
                    >
                        <Text className="text-white">{t('previewForm.goBack')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const formName = submissionItem.formName || 'Form Preview';

    // Create fields from the form schema if available, otherwise fallback to form data keys
    const fieldsToRender = formFields.length > 0 
        ? formFields.map(field => ({
            fieldname: field.fieldname,
            label: field.label || field.fieldname.charAt(0).toUpperCase() + field.fieldname.slice(1).replace(/([A-Z])/g, ' $1'),
            fieldtype: field.fieldtype || 'Data',
            options: field.options,
            value: formData[field.fieldname]
        }))
        : Object.keys(formData).map(key => ({
            fieldname: key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            fieldtype: typeof formData[key] === 'boolean' ? 'Check' : 'Data',
            options: undefined,
            value: formData[key]
        }));

    // Helper function to render field based on type
    const renderField = (field: any, index: number = 0) => {
        const { fieldname, label, fieldtype, options, value } = field;

        switch (fieldtype) {
            case 'Select':
                if (options) {
                    const optionsList = options.split('\n').filter((opt: string) => opt.trim());
                    const isOpen = dropdownStates[fieldname] || false;
                    const searchTerm = searchTerms[fieldname] || '';
                    
                    // Filter options based on search term
                    const filteredOptions = optionsList.filter((option: string) => 
                        option.trim().toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    
                    return (
                        <View key={fieldname} className="mb-4" style={{ zIndex: 1000 - index }}>
                            <Text className="font-sans font-medium text-sm leading-5 tracking-normal text-[#020617] mb-2">{label}</Text>
                            
                            <View style={{ position: 'relative' }}>
                                {/* Dropdown Toggle Button */}
                                <TouchableOpacity
                                    className="w-full h-[40px] flex-row items-center justify-between rounded-md border border-[#E2E8F0] px-3 bg-white"
                                    onPress={() => toggleDropdown(fieldname)}
                                >
                                    <Text className={`flex-1 ${value ? 'text-[#020617]' : 'text-[#64748B]'}`}>
                                        {value || `Select ${label}`}
                                    </Text>
                                    <ChevronDown 
                                        size={16} 
                                        color="#64748B" 
                                        style={{ 
                                            transform: [{ rotate: isOpen ? '180deg' : '0deg' }] 
                                        }} 
                                    />
                                </TouchableOpacity>
                                
                                {/* Dropdown Options */}
                                {isOpen && (
                                    <View style={{
                                        position: 'absolute',
                                        top: 45,
                                        left: 0,
                                        right: 0,
                                        zIndex: 2000,
                                        backgroundColor: 'white',
                                        borderWidth: 1,
                                        borderColor: '#E2E8F0',
                                        borderRadius: 6,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 4,
                                        elevation: 15,
                                        maxHeight: 200
                                    }}>
                                        {/* Search Input */}
                                        <View className="p-2 border-b border-[#E2E8F0]">
                                            <TextInput
                                                className="w-full h-[35px] rounded border border-[#E2E8F0] px-3 text-sm"
                                                placeholder={`Search ${label.toLowerCase()}...`}
                                                value={searchTerm}
                                                onChangeText={(text) => updateSearchTerm(fieldname, text)}
                                                autoFocus={false}
                                            />
                                        </View>
                                        
                                        {/* Options List */}
                                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }}>
                                            {filteredOptions.length > 0 ? (
                                                filteredOptions.map((option: string, optIndex: number) => (
                                                    <TouchableOpacity
                                                        key={optIndex}
                                                        className={`p-3 ${value === option.trim() ? 'bg-blue-50' : 'bg-white'} ${optIndex < filteredOptions.length - 1 ? 'border-b border-[#E2E8F0]' : ''}`}
                                                        onPress={() => {
                                                            handleChange(fieldname, option.trim());
                                                            updateSearchTerm(fieldname, ''); // Clear search after selection
                                                        }}
                                                    >
                                                        <Text className={`${value === option.trim() ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                                                            {option.trim()}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))
                                            ) : (
                                                <View className="p-3">
                                                    <Text className="text-gray-500 text-center">
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
                                <View style={{ 
                                    height: Math.min(filteredOptions.length * 48 + 50, 200) + 5, // +50 for search input
                                    width: '100%'
                                }} />
                            )}
                        </View>
                    );
                }
                // Fallback to text input if no options
                return (
                    <View key={fieldname} className="mb-4">
                        <Text className="font-sans font-medium text-sm leading-5 tracking-normal text-[#020617]">{label}</Text>
                        <TextInput
                            className="w-full h-[40px] rotate-0 opacity-100 rounded-md border pt-2.5 pr-3 pb-2.5 pl-3 border-[#E2E8F0]"
                            placeholder={label}
                            value={String(value || '')}
                            onChangeText={(text) => handleChange(fieldname, text)}
                            editable={true}
                        />
                    </View>
                );
            
            case 'Check':
                return (
                    <View key={fieldname} className="mb-4">
                        <TouchableOpacity 
                            className="flex-row items-center"
                            onPress={() => handleChange(fieldname, !value)}
                        >
                            <View className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${value ? 'bg-blue-500 border-blue-500' : 'border-[#E2E8F0]'}`}>
                                {value && <Text className="text-white text-xs">✓</Text>}
                            </View>
                            <Text className="font-sans font-medium text-sm leading-5 tracking-normal text-[#020617]">{label}</Text>
                        </TouchableOpacity>
                    </View>
                );
            
            case 'Text':
                return (
                    <View key={fieldname} className="mb-4">
                        <Text className="font-sans font-medium text-sm leading-5 tracking-normal text-[#020617]">{label}</Text>
                        <TextInput
                            className="w-full min-h-[80px] rotate-0 opacity-100 rounded-md border pt-2.5 pr-3 pb-2.5 pl-3 border-[#E2E8F0]"
                            placeholder={label}
                            value={String(value || '')}
                            onChangeText={(text) => handleChange(fieldname, text)}
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
                        <Text className="font-sans font-medium text-sm leading-5 tracking-normal text-[#020617]">{label}</Text>
                        <TextInput
                            className="w-full h-[40px] rotate-0 opacity-100 rounded-md border pt-2.5 pr-3 pb-2.5 pl-3 border-[#E2E8F0]"
                            placeholder={label}
                            value={String(value || '')}
                            onChangeText={(text) => handleChange(fieldname, text)}
                            editable={true}
                        />
                    </View>
                );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-3 pt-10 bg-white border-gray-200">
                <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
                    <ArrowLeft color="#020617" size={16} />
                </TouchableOpacity>
                <View className="flex-1 items-center">
                    <Text className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center">{t('previewForm.title')}</Text>
                </View>
                <LanguageControl />
            </View>

            <KeyboardAwareScrollView
                // contentContainerStyle={{ padding: 24 }}
                extraScrollHeight={50}
                enableOnAndroid={true}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={handleOutsidePress}
                    className="flex-1"
                >
                    <ScrollView className="p-6 gap-3">

                        <Text className="text-3xl font-bold text-gray-800 mb-1">{formName}</Text>
                        <Text className="text-base text-gray-500 mb-6">{t('previewForm.subtitle')}</Text>
                        
                        <View className='flex-col'>
                            {fieldsToRender.map((field, index) => renderField(field, index))}
                            <View className='flex flex-col gap-3'>
                                <TouchableOpacity className="w-full min-w-[80px] opacity-100 rounded-md p-4 gap-1 justify-center items-center bg-[#0F172A]" onPress={handleSubmitConfirmation}>
                                    <Text className="text-[#F8FAFC]">{t('formDetail.submit')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="w-full min-w-[80px] opacity-100 rounded-md p-4 gap-1 justify-center items-center bg-[#EF2226]" onPress={handleDeleteConfirmation}>
                                    <Text className="text-[#F8FAFC]">{t('formDetail.deleteForm')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableOpacity>
            </KeyboardAwareScrollView >

            <Modal
                animationType="fade"
                transparent={true}
                visible={confirmModalVisible}
                onRequestClose={() => setConfirmModalVisible(false)}
            >
                <View className="flex-1 bg-[#00000033] justify-center items-center p-[1.25rem]">
                    <View className="w-full h-[176px] max-w-[512px] opacity-100 gap-4 rounded-[6px] border p-6 border-[#E2E8F0] bg-white">
                        <Text className="font-inter font-semibold text-[18px] leading-[28px] tracking-[-0.006em] text-[#020617]">
                            {t('formDetail.confirmSubmission')}
                        </Text>

                        <Text className="font-inter font-normal text-[14px] leading-[20px] tracking-normal text-[#64748B]">
                            {t('formDetail.confirmSubmissionMessage')}
                        </Text>

                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                className="w-[78px] h-[36px] opacity-100 gap-2 rounded-md border px-4 items-center justify-center border-[#E2E8F0]"
                                onPress={() => setConfirmModalVisible(false)}
                            >
                                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#020617]">{t('common.cancel')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="py-2.5 px-4 rounded-lg bg-[#0F172A]"
                                onPress={handleSubmit}
                            >
                                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#F8FAFC]">{t('common.ok')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View className="flex-1 bg-[#00000033] justify-center items-center p-[1.25rem]">
                    <View className="w-full h-[176px] max-w-[512px] opacity-100 gap-4 rounded-[6px] border p-6 border-[#E2E8F0] bg-white">
                        <Text className="font-inter font-semibold text-[18px] leading-[28px] tracking-[-0.006em] text-[#020617]">
                            {t('previewForm.deleteThisForm')}
                        </Text>

                        <Text className="font-inter font-normal text-[14px] leading-[20px] tracking-normal text-[#64748B]">
                            {t('previewForm.confirmDeleteMessage', { formName: formName })}
                        </Text>

                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                className="w-[78px] h-[36px] opacity-100 gap-2 rounded-md border px-4 items-center justify-center border-[#E2E8F0]"
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#020617]">{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="py-2.5 px-4 rounded-lg bg-[#EF2226]"
                                onPress={handleDelete}
                            >
                                <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#F8FAFC]">{t('common.delete')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >

    )
}

export default PreviewForm