import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {View, Text, TouchableOpacity} from 'react-native';
import {Languages, ChevronDown} from 'lucide-react-native';
import {useTheme} from '../../context/ThemeContext';

const languages = [
  {code: 'en', name: 'English', nativeName: 'English'},
  {code: 'hi', name: 'Hindi', nativeName: 'हिंदी'},
  {code: 'te', name: 'Telugu', nativeName: 'తెలుగు'},
];

function LanguageControl() {
  const {i18n} = useTranslation();
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const {theme} = useTheme();

  // Shadow styles for dropdown
  const shadowStyles = {
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  };

  // Helper functions for dynamic styles
  const getItemBackgroundColor = (languageCode: string) => {
    return i18n.language === languageCode ? theme.selectedBg : 'transparent';
  };

  const getItemTextColor = (languageCode: string) => {
    return i18n.language === languageCode ? theme.selectedText : theme.text;
  };

  const getItemFontWeight = (languageCode: string) => {
    return i18n.language === languageCode ? '600' : 'normal';
  };

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
        className="flex-row items-center px-2 py-1.5 rounded-md border min-w-[80px]"
        style={{
          backgroundColor: theme.background,
          borderColor: theme.border,
        }}
        onPress={() => setShowLanguageOptions(!showLanguageOptions)}>
        <Languages size={20} color={theme.iconColor} />
        <Text
          className="ml-1 mr-0.5 text-xs font-medium"
          style={{color: theme.text}}>
          {getCurrentLanguage()}
        </Text>
        <ChevronDown size={16} color={theme.iconColor} />
      </TouchableOpacity>

      {showLanguageOptions && (
        <View
          className="absolute top-full right-0 rounded-md border shadow-lg min-w-[100px] z-[1001]"
          style={{
            backgroundColor: theme.dropdownBg,
            borderColor: theme.border,
            ...shadowStyles,
          }}>
          {languages.map(language => (
            <TouchableOpacity
              key={language.code}
              className="px-3 py-2.5 border-b"
              style={{
                backgroundColor: getItemBackgroundColor(language.code),
                borderBottomColor: theme.border,
              }}
              onPress={() => changeLanguage(language.code)}>
              <Text
                className="text-xs text-center"
                style={{
                  color: getItemTextColor(language.code),
                  fontWeight: getItemFontWeight(language.code),
                }}>
                {language.nativeName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default LanguageControl;
