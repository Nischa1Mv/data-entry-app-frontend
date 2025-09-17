
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define translations inline to avoid import issues
const resources = {
    en: {
        translation: {
            welcome: {
                title: "Welcome back!",
                subtitle: "Ready to start your workflow?",
                getStarted: "Get Started"
            },
            navigation: {
                forms: "Forms",
                downloads: "Downloads",
                back: "Back",
                home: "Home"
            },
            forms: {
                title: "Available Forms",
                loading: "Loading forms...",
                noForms: "No forms available",
                download: "Download",
                downloaded: "Downloaded",
                fillForm: "Fill Form",
                refresh: "Refresh"
            },
            formDetail: {
                loading: "Loading...",
                submit: "Submit",
                save: "Save",
                cancel: "Cancel",
                required: "This field is required",
                success: "Form submitted successfully!",
                error: "Error submitting form",
                subtitle: "Fill in the form below",
                selectPlaceholder: "Select {{label}}",
                enterPlaceholder: "Enter {{label}}",
                discardChanges: "Discard changes?",
                unsavedDataMessage: "You have unsaved data. Are you sure you want to go back?",
                discard: "Discard",
                modalTitle: "Form is ready to upload!",
                modalDescription: "Form needs to be uploaded after the network is available.",
                errorSaving: "Failed to save submission.",
                requiredFields: "Please fill in the required fields: {{fields}}",
                noData: "Please enter some data before submitting.",
                missingDoctype: "Form configuration is missing. Please try again."
            },
            common: {
                ok: "OK",
                cancel: "Cancel",
                yes: "Yes",
                no: "No",
                save: "Save",
                delete: "Delete",
                edit: "Edit",
                loading: "Loading...",
                retry: "Retry",
                offline: "You are offline",
                online: "You are online",
                error: "Error"
            },
            login: {
                title: "Login",
                subtitle: "Enter your email below to login to your account",
                email: "Email",
                emailPlaceholder: "Admin@example",
                password: "Password",
                passwordPlaceholder: "Password",
                signIn: "Login",
                signInWithGoogle: "Login with Google",
                forgotPassword: "Forgot password ?",
                noAccount: "Don't have an account? Sign up",
                welcomeMessage: "Welcome {{name}}",
                successTitle: "Success",
                cancelledTitle: "Cancelled",
                cancelledMessage: "User cancelled sign-in",
                errorTitle: "Error",
                errorMessage: "Google sign-in failed",
                backendError: "Backend token verification failed"
            }
        }
    },
    hi: {
        translation: {
            welcome: {
                title: "वापस स्वागत है!",
                subtitle: "अपना वर्कफ़्लो शुरू करने के लिए तैयार हैं?",
                getStarted: "शुरू करें"
            },
            navigation: {
                forms: "फॉर्म",
                downloads: "डाउनलोड",
                back: "वापस",
                home: "होम"
            },
            forms: {
                title: "उपलब्ध फॉर्म",
                loading: "फॉर्म लोड हो रहे हैं...",
                noForms: "कोई फॉर्म उपलब्ध नहीं",
                download: "डाउनलोड",
                downloaded: "डाउनलोड किया गया",
                fillForm: "फॉर्म भरें",
                refresh: "रीफ्रेश"
            },
            formDetail: {
                loading: "लोड हो रहा है...",
                submit: "जमा करें",
                save: "सेव",
                cancel: "रद्द करें",
                required: "यह फील्ड आवश्यक है",
                success: "फॉर्म सफलतापूर्वक जमा किया गया!",
                error: "फॉर्म जमा करने में त्रुटि",
                subtitle: "नीचे दिया गया फॉर्म भरें",
                selectPlaceholder: "{{label}} चुनें",
                enterPlaceholder: "{{label}} दर्ज करें",
                discardChanges: "बदलाव रद्द करें?",
                unsavedDataMessage: "आपका डेटा सेव नहीं हुआ है। क्या आप वापस जाना चाहते हैं?",
                discard: "रद्द करें",
                modalTitle: "फॉर्म अपलोड के लिए तैयार है!",
                modalDescription: "नेटवर्क उपलब्ध होने के बाद फॉर्म अपलोड करना होगा।",
                errorSaving: "सबमिशन सेव करने में विफल।",
                requiredFields: "कृपया आवश्यक फील्ड भरें: {{fields}}",
                noData: "कृपया सबमिट करने से पहले कुछ डेटा दर्ज करें।",
                missingDoctype: "फॉर्म कॉन्फ़िगरेशन अनुपलब्ध है। कृपया फिर से कोशिश करें।"
            },
            common: {
                ok: "ठीक",
                cancel: "रद्द करें",
                yes: "हाँ",
                no: "नहीं",
                save: "सेव",
                delete: "डिलीट",
                edit: "संपादित करें",
                loading: "लोड हो रहा है...",
                retry: "फिर कोशिश करें",
                offline: "आप ऑफ़लाइन हैं",
                online: "आप ऑनलाइन हैं",
                error: "त्रुटि"
            },
            login: {
                title: "लॉगिन",
                subtitle: "अपने खाते में लॉगिन करने के लिए नीचे अपना ईमेल दर्ज करें",
                email: "ईमेल",
                emailPlaceholder: "Admin@example",
                password: "पासवर्ड",
                passwordPlaceholder: "पासवर्ड",
                signIn: "लॉगिन",
                signInWithGoogle: "Google के साथ लॉगिन करें",
                forgotPassword: "पासवर्ड भूल गए?",
                noAccount: "खाता नहीं है? साइन अप करें",
                welcomeMessage: "स्वागत है {{name}}",
                successTitle: "सफलता",
                cancelledTitle: "रद्द किया गया",
                cancelledMessage: "उपयोगकर्ता ने साइन-इन रद्द किया",
                errorTitle: "त्रुटि",
                errorMessage: "Google साइन-इन विफल",
                backendError: "बैकएंड टोकन सत्यापन विफल"
            }
        }
    },
    te: {
        translation: {
            welcome: {
                title: "మళ్లీ స్వాగతం!",
                subtitle: "మీ వర్క్‌ఫ్లో ప్రారంభించడానికి సిద్ధంగా ఉన్నారా?",
                getStarted: "ప్రారంభించండి"
            },
            navigation: {
                forms: "ఫారాలు",
                downloads: "డౌన్‌లోడ్‌లు",
                back: "వెనుకకు",
                home: "హోమ్"
            },
            forms: {
                title: "అందుబాటులో ఉన్న ఫారాలు",
                loading: "ఫారాలు లోడ్ అవుతున్నాయి...",
                noForms: "ఎలాంటి ఫారాలు అందుబాటులో లేవు",
                download: "డౌన్‌లోడ్",
                downloaded: "డౌన్‌లోడ్ చేయబడింది",
                fillForm: "ఫారం పూరించండి",
                refresh: "రిఫ్రెష్"
            },
            formDetail: {
                loading: "లోడ్ అవుతోంది...",
                submit: "సమర్పించండి",
                save: "సేవ్",
                cancel: "రద్దు చేయండి",
                required: "ఈ ఫీల్డ్ అవసరం",
                success: "ఫారం విజయవంతంగా సమర్పించబడింది!",
                error: "ఫారం సమర్పించడంలో లోపం",
                subtitle: "దిగువ ఫారం పూరించండి",
                selectPlaceholder: "{{label}} ఎంచుకోండి",
                enterPlaceholder: "{{label}} నమోదు చేయండి",
                discardChanges: "మార్పులను రద్దు చేయాలా?",
                unsavedDataMessage: "మీకు సేవ్ చేయని డేటా ఉంది. మీరు ఖచ్చితంగా వెనుకకు వెళ్లాలనుకుంటున్నారా?",
                discard: "రద్దు చేయండి",
                modalTitle: "ఫారం అప్‌లోడ్ చేయడానికి సిద్ధంగా ఉంది!",
                modalDescription: "నెట్‌వర్క్ అందుబాటులో ఉన్న తర్వాత ఫారం అప్‌లోడ్ చేయాలి.",
                errorSaving: "సబ్మిషన్ సేవ్ చేయడంలో విఫలమైంది.",
                requiredFields: "దయచేసి అవసరమైన ఫీల్డ్‌లను పూరించండి: {{fields}}",
                noData: "దయచేసి సమర్పించే ముందు కొంత డేటా నమోదు చేయండి।",
                missingDoctype: "ఫారం కాన్ఫిగరేషన్ లేదు। దయచేసి మళ్లీ ప్రయత్నించండి।"
            },
            common: {
                ok: "సరే",
                cancel: "రద్దు చేయండి",
                yes: "అవును",
                no: "లేదు",
                save: "సేవ్",
                delete: "తొలగించండి",
                edit: "సవరించండి",
                loading: "లోడ్ అవుతోంది...",
                retry: "మళ్లీ ప్రయత్నించండి",
                offline: "మీరు ఆఫ్‌లైన్‌లో ఉన్నారు",
                online: "మీరు ఆన్‌లైన్‌లో ఉన్నారు",
                error: "లోపం"
            },
            login: {
                title: "లాగిన్",
                subtitle: "మీ ఖాతాలో లాగిన్ చేయడానికి దిగువ మీ ఇమెయిల్ నమోదు చేయండి",
                email: "ఇమెయిల్",
                emailPlaceholder: "Admin@example",
                password: "పాస్‌వర్డ్",
                passwordPlaceholder: "పాస్‌వర్డ్",
                signIn: "లాగిన్",
                signInWithGoogle: "Google తో లాగిన్ చేయండి",
                forgotPassword: "పాస్‌వర్డ్ మర్చిపోయారా?",
                noAccount: "ఖాతా లేదా? సైన్ అప్ చేయండి",
                welcomeMessage: "స్వాగతం {{name}}",
                successTitle: "విజయం",
                cancelledTitle: "రద్దు చేయబడింది",
                cancelledMessage: "వినియోగదారు సైన్-ఇన్ రద్దు చేశారు",
                errorTitle: "లోపం",
                errorMessage: "Google సైన్-ఇన్ విఫలమైంది",
                backendError: "బ్యాకెండ్ టోకెన్ ధృవీకరణ విఫలమైంది"
            }
        }
    }
};

const LANGUAGE_DETECTOR = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lng: string) => void) => {
        try {
            // Get the saved language from AsyncStorage
            const savedLanguage = await AsyncStorage.getItem('user-language');
            if (savedLanguage) {
                callback(savedLanguage);
                return;
            }
            // If no saved language, use default
            callback('en');
        } catch (error) {
            console.log('Error reading language from AsyncStorage', error);
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem('user-language', language);
        } catch (error) {
            console.log('Error saving language to AsyncStorage', error);
        }
    },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    fallbackLng: 'en',
    debug: false, // Disable debug to avoid console errors
    
    resources,
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    
    // Add these options to prevent navigation issues
    load: 'languageOnly',
    ns: ['translation'],
    defaultNS: 'translation',
  });export default i18n;
