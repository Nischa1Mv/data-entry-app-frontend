import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native'
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
        <View style={styles.languageContainer}>
            <TouchableOpacity
                style={styles.languageSelector}
                onPress={() => setShowLanguageOptions(!showLanguageOptions)}
            >
                <Languages size={20} color="#666" />
                <Text style={styles.languageText}>{getCurrentLanguage()}</Text>
                <ChevronDown size={16} color="#666" />
            </TouchableOpacity>

            {showLanguageOptions && (
                <View style={styles.languageDropdown}>
                    {languages.map((language) => (
                        <TouchableOpacity
                            key={language.code}
                            style={[
                                styles.languageOption,
                                i18n.language === language.code && styles.activeLanguageOption
                            ]}
                            onPress={() => changeLanguage(language.code)}
                        >
                            <Text style={[
                                styles.languageOptionText,
                                i18n.language === language.code && styles.activeLanguageOptionText
                            ]}>
                                {language.nativeName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    )
}
const styles = StyleSheet.create({
    languageContainer: {
        position: 'relative',
        zIndex: 1000,
    } as ViewStyle,
    languageSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        minWidth: 80,
    } as ViewStyle,
    languageText: {
        marginLeft: 4,
        marginRight: 2,
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    } as TextStyle,
    languageDropdown: {
        position: 'absolute',
        top: '100%',
        right: 0,
        backgroundColor: 'white',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 100,
        zIndex: 1001,
    } as ViewStyle,
    languageOption: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    } as ViewStyle,
    activeLanguageOption: {
        backgroundColor: '#007AFF',
    } as ViewStyle,
    languageOptionText: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    } as TextStyle,
    activeLanguageOptionText: {
        color: 'white',
        fontWeight: '600',
    } as TextStyle,
});

export default languageControl