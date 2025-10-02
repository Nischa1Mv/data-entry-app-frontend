import { ArrowLeft } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Modal, TouchableOpacity, View, Text } from 'react-native'
import { ScrollView, TextInput } from 'react-native-gesture-handler'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import LanguageControl from '../../components/LanguageControl'
import { useTranslation } from 'react-i18next'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SubmissionItem } from '../../../types'
import { getQueue } from '../../pendingQueue'
import { FormStackParamList } from '@/app/navigation/FormStackParamList'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

type PreviewFormRouteProp = RouteProp<FormStackParamList, 'PreviewForm'>;
type PreviewFormNavigationProp = NativeStackNavigationProp<FormStackParamList, 'PreviewForm'>;

function PreviewForm() {
    const { t } = useTranslation();
    const route = useRoute<PreviewFormRouteProp>();
    const navigation = useNavigation<PreviewFormNavigationProp>();

    // State for form data
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submissionItem, setSubmissionItem] = useState<SubmissionItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

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
            } else {
                console.error('Form not found with ID:', formId);
            }
        } catch (error) {
            console.error('Error loading form data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (fieldName: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
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
            // Add your deletion logic here
            console.log('Deleting form:', submissionItem);
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

    // Create fields from the form data for display
    const fields = Object.keys(formData).map(key => ({
        fieldname: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        fieldtype: typeof formData[key] === 'boolean' ? 'Check' : 'Data',
        value: formData[key]
    }));

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
                <ScrollView className="p-6 gap-3">

                    <Text className="text-3xl font-bold text-gray-800 mb-1">{formName}</Text>
                    <Text className="text-base text-gray-500 mb-6">{t('previewForm.subtitle')}</Text>
                    <View className='flex-col'>
                        {fields.map((field) => (
                            <View key={field.fieldname} className="mb-4">
                                <Text className="font-sans font-medium text-sm leading-5 tracking-normal text-[#020617]">{field.label}</Text>
                                <TextInput
                                    className="w-full h-[40px] rotate-0 opacity-100 rounded-md border pt-2.5 pr-3 pb-2.5 pl-3 border-[#E2E8F0]"
                                    placeholder={field.label}
                                    value={String(formData[field.fieldname] || '')}
                                    onChangeText={(text) => handleChange(field.fieldname, text)}
                                    editable={true}
                                />
                            </View>
                        ))}
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
                            {t('previewForm.confirmDeleteMessage')}
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