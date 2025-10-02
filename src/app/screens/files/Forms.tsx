import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LanguageControl from "../../components/LanguageControl";
import { getQueue } from "../../pendingQueue";
import { useTranslation } from "react-i18next";
import { SubmissionItem } from "../../../types";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FormStackParamList } from "../../navigation/FormStackParamList";

type FormsNavigationProp = NativeStackNavigationProp<FormStackParamList, 'Forms'>;

function Forms() {
    const [queueData, setQueueData] = useState<SubmissionItem[]>([]);
    const [pendingFormsCount, setPendingFormsCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { t } = useTranslation();
    const navigation = useNavigation<FormsNavigationProp>();

    useEffect(() => {
        fetchPendingForms();
    }, []);

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

    const handleViewPendingForms = () => {
        // Navigate to pending forms view or show modal
        console.log("Viewing pending forms:", queueData);
        // You can add navigation logic here or show a modal with pending forms
    };

    const handleSubmitAllForms = async () => {
        if (pendingFormsCount === 0) {
            Alert.alert("No Forms", "There are no pending forms to submit.");
            return;
        }

        Alert.alert(
            "Submit All Forms",
            `Are you sure you want to submit all ${pendingFormsCount} pending forms?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Submit",
                    onPress: async () => {
                        // Add your submission logic here
                        console.log("Submitting all forms:", queueData);
                        // You can call your submission function here
                    }
                }
            ]
        );
    };

    const handleSubmitSingleForm = async (index: number, formData: SubmissionItem) => {
        Alert.alert(
            "Submit Form",
            `Are you sure you want to submit "${formData?.formName || `Form ${index + 1}`}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Submit",
                    onPress: async () => {
                        try {
                            // Add your single form submission logic here
                            console.log("Submitting single form:", formData);
                            // After successful submission, refresh the pending forms
                            fetchPendingForms();
                        } catch (error) {
                            console.error("Error submitting form:", error);
                            Alert.alert("Error", "Failed to submit form. Please try again.");
                        }
                    }
                }
            ]
        );
    };
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-3 pt-10 bg-white border-b border-gray-200">
                <View className="flex-1 items-center">
                    <Text className="font-inter font-semibold text-[18px] leading-[32px] tracking-[-0.006em] text-center">Forms</Text>
                </View>
                <LanguageControl />
            </View>
            <View className="mx-6 mb-5 p-4 w-[356px] h-[76px] border border-[##E2E8F0] rounded-lg bg-[#FFFCF0] flex-row justify-between items-center">
                <View>
                    <Text className="text-[#DC7609] text-2xl font-bold">
                        {isLoading ? "..." : `${pendingFormsCount} Forms Pending`}
                    </Text>
                    <TouchableOpacity onPress={handleViewPendingForms} disabled={isLoading}>
                        <View className="flex-row items-center mt-2 gap-2">
                            <Text className="text-[#DC7609]">View Pending Forms</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleSubmitAllForms} disabled={isLoading || pendingFormsCount === 0}>
                    <Text className={`border border-[#DC7609] px-3 py-2 text-base rounded-xl ${isLoading || pendingFormsCount === 0
                            ? 'text-gray-400 border-gray-400'
                            : 'text-[#DC7609] border-[#DC7609]'
                        }`}>
                        Submit all forms
                    </Text>
                </TouchableOpacity>
            </View>
            <View>
                <Text className="font-inter font-semibold text-base leading-8 tracking-[-0.006em] text-center">
                    Pending Forms
                </Text>
            </View>
            {isLoading ? (
                <View className="flex items-center justify-center py-8">
                    <Text className="text-gray-500">Loading pending forms...</Text>
                </View>
            ) : queueData.length === 0 ? (
                <View className="flex items-center justify-center py-8">
                    <Text className="text-gray-500">No pending forms found</Text>
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
                                    <Text className="font-inter font-light text-[10px] leading-5 text-left">Filled on {formattedDate}, </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSubmitSingleForm(index, formData)}>
                                <View className="flex w-[117px] h-[40px] items-center justify-center">
                                    <Text className="font-inter font-medium text-sm leading-5 text-right">SubmitForm</Text>
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