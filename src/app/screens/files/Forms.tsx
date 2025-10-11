import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, Modal, ScrollView, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LanguageControl from "../../components/LanguageControl";
import { getQueue, removeFromQueue } from "../../pendingQueue";
import { useTranslation } from "react-i18next";
import { SubmissionItem } from "../../../types";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FormStackParamList } from "../../navigation/FormStackParamList";
import { FileWarningIcon } from "lucide-react-native";
import { SubmitForm } from "../../../api";
import AsyncStorage from '@react-native-async-storage/async-storage'

type FormsNavigationProp = NativeStackNavigationProp<FormStackParamList, 'Forms'>;

function Forms() {
    const [queueData, setQueueData] = useState<SubmissionItem[]>([]);
    const [pendingFormsCount, setPendingFormsCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showSubmissionSummary, setShowSubmissionSummary] = useState<boolean>(false);
    const [submissionResults, setSubmissionResults] = useState<any[]>([]);
    const { t } = useTranslation();
    const navigation = useNavigation<FormsNavigationProp>();
    const STORAGE_KEY = "pendingSubmissions";

    useFocusEffect(
        useCallback(() => {
            console.log("📱📱📱 FORMS SCREEN LOADED 📱📱📱");
            fetchPendingForms();
        }, [])
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
            console.error("Error fetching pending forms:", e);
            setPendingFormsCount(0);
            setQueueData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAllForms = () => {
        if (pendingFormsCount === 0) {
            Alert.alert(
                t('formsScreen.noFormsAlert'),
                t('formsScreen.noFormsMessage')
            );
            return;
        }

        Alert.alert(
            t('formsScreen.submitAllFormsTitle'),
            t('formsScreen.submitAllFormsMessage', { count: pendingFormsCount }),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('formsScreen.submit'),
                    onPress: () => {
                        (async () => {
                            try {
                                const results = await Promise.allSettled(
                                    queueData.map(submissionItem => SubmitForm(submissionItem))
                                );

                                const processedResults = results.map((res, index) => {
                                    const currentSubmissionItem = queueData[index];

                                    if (res.status === 'fulfilled') {
                                        return { success: true, form: currentSubmissionItem, result: res.value };
                                    } else {
                                        return { success: false, form: currentSubmissionItem, reason: res.reason };
                                    }
                                });

                                const successfulIds = processedResults
                                    .filter(r => r.success)
                                    .map(r => r.form.id);

                                const queue = await getQueue();
                                const updatedQueue = queue.filter((item: any) => !successfulIds.includes(item.id));
                                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));

                                setQueueData(updatedQueue);

                                setSubmissionResults(processedResults);
                                setShowSubmissionSummary(true);

                            } catch (error) {
                                console.error("Unexpected error submitting forms:", error);
                                Alert.alert(
                                    t('formsScreen.submitError'),
                                    t('formsScreen.submitErrorMessage')
                                );
                            }
                        })();
                    }
                }
            ]
        );
    };


    const handleSubmitSingleForm = async (formData: SubmissionItem) => {
        Alert.alert(
            t('formsScreen.submitFormTitle'),
            t('formsScreen.submitFormMessage', { formName: formData?.formName }),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('formsScreen.submit'),
                    onPress: async () => {
                        try {
                            const response = await SubmitForm(formData);
                            
                            // Check if the response indicates success
                            const isSuccess = response && response.success === true;
                            
                            const processedResult = isSuccess
                                ? { success: true, form: formData, result: response }
                                : { success: false, form: formData, reason: response?.error || 'Submission failed' };

                            // Remove from queue & local storage if successful
                            if (processedResult.success) {
                                await removeFromQueue(formData.id);
                                fetchPendingForms();
                            }

                            // Set modal results using the same state as "Submit All"
                            setSubmissionResults([processedResult]); // single-item array
                            setShowSubmissionSummary(true);
                            
                        } catch (error: any) {
                            console.error("Error submitting form:", error);
                            
                            // Handle HTTP errors (like 500 status)
                            let errorMessage = 'Submission failed';
                            if (error?.response?.data?.detail?.error) {
                                errorMessage = error.response.data.detail.error;
                            } else if (error?.message) {
                                errorMessage = error.message;
                            }
                            
                            const processedResult = { 
                                success: false, 
                                form: formData, 
                                reason: errorMessage 
                            };
                            
                            setSubmissionResults([processedResult]);
                            setShowSubmissionSummary(true);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {showSubmissionSummary && (
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showSubmissionSummary}
                    onRequestClose={() => setShowSubmissionSummary(false)}
                >
                    <View className="flex-1 bg-[#00000033] justify-center items-center p-[1.25rem]">
                        <View className="w-full max-w-[400px] opacity-100 gap-4 rounded-[6px] border p-6 border-[#E2E8F0] bg-white">
                            <Text className="font-inter font-semibold text-[18px] leading-[28px] tracking-[-0.006em] text-[#020617]">
                                {t('formsScreen.submissionSummaryTitle')}
                            </Text>
                            {/* output for error */}
                            {/* raise HTTPException(
                                    status_code=500,
                                    detail={
                                        "success": False,
                                        "formname": submission_item.formName,
                                        "error": f"Forced failure for testing form"
                                    }
                                ) */}
                            {/* output for success
                            return {
                                "success": True,
                            "message": f"Submitted successfully",
                            "formName": submission_item.formName
                            } */}

                            <ScrollView className="max-h-[300px]">
                                {submissionResults.map((res, idx) => (
                                    <View key={idx} className="mb-2">
                                        <Text
                                            className={`font-inter font-normal text-[14px] leading-[20px] tracking-normal ${res.success ? 'text-[#16a34a]' : 'text-[#EF2226]'
                                                }`}
                                        >
                                            {res.form?.formName || res.form?.id || `Form ${idx + 1}`} —{' '}
                                            {res.success ? t('formsScreen.submissionSuccess') : t('formsScreen.submissionFailed')}
                                            {!res.success && res.reason ? ` (${res.reason})` : ''}
                                        </Text>

                                    </View>
                                ))}
                            </ScrollView>

                            <View className="flex-row justify-end gap-3 mt-4">
                                <TouchableOpacity
                                    className="px-4 py-2 opacity-100 gap-2 rounded-md border border-[#E2E8F0] items-center justify-center"
                                    onPress={() => setShowSubmissionSummary(false)}
                                >
                                    <Text className="font-inter font-medium text-[14px] leading-[20px] tracking-[-0.006em] align-middle text-[#020617]">
                                        {t('common.close')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>


            )}

            <View className="flex-row items-center justify-between px-4 py-3 pt-10 bg-white mb-5">
                <View className="flex-1 items-center">
                    <Text className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center">{t('formsScreen.title')}</Text>
                </View>
                <LanguageControl />
            </View>
            <View className="mx-6 mb-5 p-4 w-[356px] h-[76px] border border-[##E2E8F0] rounded-lg bg-[#FFFCF0] flex-row justify-between items-center">
                <View>
                    <View className="flex-row items-center mt-2 gap-2">

                        <FileWarningIcon color="#DC7609" size={16} />
                        <Text className="text-[#DC7609] font-inter font-medium text-sm leading-5 tracking-[-0.006em]">
                            {t('formsScreen.pendingForms')}
                        </Text>
                    </View>
                    <Text className="text-[#DC7609] font-inter font-semibold text-2xl leading-8 tracking-[-0.006em]">
                        {isLoading ? "..." : `${pendingFormsCount} FORMS`}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleSubmitAllForms} disabled={isLoading || pendingFormsCount === 0}>
                    <Text className={`border border-[#DC7609] p-4 rounded-xl font-inter font-semibold text-sm leading-5 text-right ${isLoading || pendingFormsCount === 0
                        ? 'text-[#64748B] border-[#64748B]'
                        : 'text-[#DC7609] border-[#DC7609]'
                        }`}>
                        {t('home.submitAllForms')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View>
                <Text className="font-inter font-semibold text-base leading-8 tracking-[-0.006em] text-center">
                    {t('formsScreen.pendingForms')}
                </Text>
            </View>
            {isLoading ? (
                <View className="flex items-center justify-center py-8">
                    <Text className="text-gray-500">{t('formsScreen.loadingPendingForms')}</Text>
                </View>
            ) : queueData.length === 0 ? (
                <View className="flex items-center justify-center py-8">
                    <Text className="text-gray-500">{t('formsScreen.noPendingForms')}</Text>
                </View>
            ) : (
                queueData.map((item, index) => {
                    const formData = item;
                    const formName = formData?.formName || `Form ${index + 1}`;
                    const formattedDate = new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });

                    return (
                        <View key={item.id} className="flex flex-row justify-between px-4 py-4 bg-white border border-[#E2E8F0] w-full">
                            <TouchableOpacity onPress={() => {
                                console.log('Navigating to PreviewForm with formId:', item.id);
                                navigation.navigate('PreviewForm', { formId: item.id });
                            }}>
                                <View className="flex flex-col items-start">
                                    <Text className="font-inter font-normal text-sm leading-5 text-left">{formName}</Text>
                                    <Text className="font-inter font-light text-[10px] leading-5 text-left">{t('formsScreen.filledOn', { date: formattedDate })}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSubmitSingleForm(formData)}>
                                <View className="flex w-[117px] h-[40px] items-center justify-center">
                                    <Text className="font-inter font-medium text-sm leading-5 text-right">{t('formsScreen.submitForm')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    );
                })
            )}
        </SafeAreaView>
    )
}

export default Forms