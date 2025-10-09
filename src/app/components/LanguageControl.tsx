import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native'
import { Languages, ChevronDown } from 'lucide-react-native';

const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

function languageControl() {

    const { i18n } = useTranslation();
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);

    const getCurrentLanguage = () => {
        const currentLang = languages.find(lang => lang.code === i18n.language);
        return currentLang ? currentLang.nativeName : 'English';
    };

    const changeLanguage = (languageCode: string) => {
        i18n.changeLanguage(languageCode);
        setShowLanguageOptions(false);
    };
    return (
        <View className="relative z-[1000]">
            <TouchableOpacity
                className="flex-row items-center px-2 py-1.5 bg-gray-100 rounded-md border border-gray-300 min-w-[80px]"
                onPress={() => setShowLanguageOptions(!showLanguageOptions)}
            >
                <Languages size={20} color="#666" />
                <Text className="ml-1 mr-0.5 text-xs text-gray-800 font-medium">{getCurrentLanguage()}</Text>
                <ChevronDown size={16} color="#666" />
            </TouchableOpacity>

            {showLanguageOptions && (
                <View className="absolute top-full right-0 bg-white rounded-md border border-gray-300 shadow-lg min-w-[100px] z-[1001]">
                    {languages.map((language) => (
                        <TouchableOpacity
                            key={language.code}
                            className={`px-3 py-2.5 border-b border-gray-100 ${
                                i18n.language === language.code ? 'bg-blue-500' : ''
                            }`}
                            onPress={() => changeLanguage(language.code)}
                        >
                            <Text className={`text-xs text-center ${
                                i18n.language === language.code 
                                    ? 'text-white font-semibold' 
                                    : 'text-gray-800'
                            }`}>
                                {language.nativeName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    )
}

export default languageControl
