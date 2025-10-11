import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Save,
  X,
  Trash2,
} from 'lucide-react-native'; // RN version
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../context/ThemeContext';

// Simple text encoder for React Native
const getTextSize = (text: string): number => {
  // Simple approximation: each character is roughly 1-4 bytes in UTF-8
  let size = 0;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode < 0x80) {
      size += 1;
    } else if (charCode < 0x800) {
      size += 2;
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      size += 3;
    } else {
      // Surrogate pair
      i++;
      size += 4;
    }
  }
  return size;
};

interface StorageItem {
  key: string;
  value: any;
  size: string;
}

const Downloads: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [downloadDoctypesData, setDownloadDoctypesData] = useState<
    StorageItem[]
  >([]);
  const [queueData, setQueueData] = useState<StorageItem[]>([]);
  const [editingQueue, setEditingQueue] = useState<{
    index: number;
    data: any;
  } | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedData, setEditedData] = useState<string>('');
  const [formFields, setFormFields] = useState<{ [key: string]: any }>({});
  const [relatedDocType, setRelatedDocType] = useState<any>(null);

  const [collapsed, setCollapsed] = useState({
    downloadDoctypes: false,
    queue: false,
    json: true,
  });

  // Sync editedData with formFields changes
  useEffect(() => {
    if (editingQueue && Object.keys(formFields).length > 0) {
      const updatedQueueItem = {
        ...editingQueue.data,
        data: formFields,
      };
      setEditedData(JSON.stringify(updatedQueueItem, null, 2));
    }
  }, [formFields, editingQueue]);

  const fetchAsyncStorageData = useCallback(async () => {
    try {
      const downloadDoctypes: StorageItem[] = [];
      const queue: StorageItem[] = [];

      const keys = await AsyncStorage.getAllKeys();
      const entries = await AsyncStorage.multiGet(keys);

      for (const [key, value] of entries) {
        if (!key) {
          continue;
        }

        const parsedValue = tryParseJSON(value);
        const size = getTextSize(value || '');
        const item = {
          key,
          value: parsedValue,
          size: formatBytes(size),
        };

        if (key === 'downloadDoctypes') {
          // Handle Record<string, {}> structure
          if (
            parsedValue &&
            typeof parsedValue === 'object' &&
            !Array.isArray(parsedValue)
          ) {
            Object.entries(parsedValue).forEach(
              ([doctypeName, doctypeData]: [string, any]) => {
                const subItem = {
                  key: `${key}.${doctypeName}`,
                  value: doctypeData,
                  size: formatBytes(getTextSize(JSON.stringify(doctypeData))),
                };
                downloadDoctypes.push(subItem);
              }
            );
          } else {
            downloadDoctypes.push(item);
          }
        } else if (key === 'pendingSubmissions') {
          // If it's an array, split it into individual items for rendering
          if (Array.isArray(parsedValue)) {
            parsedValue.forEach((val: any, idx: number) => {
              const subItem = {
                key: `${key}[${idx}]`,
                value: val,
                size: formatBytes(getTextSize(JSON.stringify(val))),
              };
              queue.push(subItem);
            });
          } else {
            queue.push(item);
          }
        }
      }

      setDownloadDoctypesData(downloadDoctypes);
      setQueueData(queue);
    } catch (e) {
      console.error('Error fetching AsyncStorage data:', e);
    }
  }, []);

  useEffect(() => {
    fetchAsyncStorageData();
  }, [fetchAsyncStorageData]);

  const tryParseJSON = (jsonString: string | null) => {
    try {
      return jsonString ? JSON.parse(jsonString) : jsonString;
    } catch {
      return jsonString;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeQueueItem = async (indexToRemove: number) => {
    try {
      const raw = await AsyncStorage.getItem('pendingSubmissions');
      if (!raw) {
        return;
      }

      const queue = JSON.parse(raw);
      if (!Array.isArray(queue)) {
        return;
      }

      queue.splice(indexToRemove, 1);
      await AsyncStorage.setItem('pendingSubmissions', JSON.stringify(queue));

      fetchAsyncStorageData();
    } catch (e) {
      console.error('Error removing queue item:', e);
    }
  };

  // Remove downloadDoctypes item
  const removeDownloadDoctypeItem = async (index: number) => {
    try {
      const raw = await AsyncStorage.getItem('downloadDoctypes');
      if (!raw) {
        return;
      }

      const data = JSON.parse(raw);
      if (typeof data !== 'object' || Array.isArray(data)) {
        return;
      }

      // Get the doctype name from the displayed item
      const downloadDoctypeItem = downloadDoctypesData[index];
      if (!downloadDoctypeItem) {
        return;
      }

      // Extract doctype name from key (format: "downloadDoctypes.doctypeName")
      const doctypeName = downloadDoctypeItem.key.replace(
        'downloadDoctypes.',
        ''
      );

      // Remove the specific doctype from the record
      delete data[doctypeName];

      await AsyncStorage.setItem('downloadDoctypes', JSON.stringify(data));
      fetchAsyncStorageData();
    } catch (e) {
      console.error('Error removing downloadDoctypes item:', e);
    }
  };

  // Edit queue item
  const editQueueItem = (index: number, data: any) => {
    setEditingQueue({ index, data });
    setEditedData(JSON.stringify(data, null, 2));

    // Extract form data from the data.data field
    if (data && data.data) {
      setFormFields({ ...data.data });
    } else {
      setFormFields({});
    }

    // Find related doctype data
    findRelatedDocType(data);

    setEditModalVisible(true);
  };

  // Find related doctype data based on doctype name
  const findRelatedDocType = async (queueItem: any) => {
    try {
      const doctypeName = queueItem?.doctype;
      if (!doctypeName) {
        setRelatedDocType(null);
        return;
      }

      const keys = await AsyncStorage.getAllKeys();
      const docTypeKeys = keys.filter(key => key.startsWith('docType_'));

      for (const key of docTypeKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsedData = tryParseJSON(data);
          if (
            parsedData &&
            (parsedData.name === doctypeName ||
              parsedData.doctype === doctypeName)
          ) {
            setRelatedDocType(parsedData);
            return;
          }
        }
      }
      setRelatedDocType(null);
    } catch (e) {
      console.error('Error finding related doctype:', e);
      setRelatedDocType(null);
    }
  };

  // Update a specific field in form data
  const updateFormField = (fieldName: string, value: any) => {
    setFormFields(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const saveQueueItem = async () => {
    if (!editingQueue) {
      return;
    }

    try {
      // Reconstruct the queue item with updated form data
      const updatedQueueItem = {
        ...editingQueue.data,
        data: formFields,
      };

      const raw = await AsyncStorage.getItem('pendingSubmissions');
      if (!raw) {
        return;
      }

      const queue = JSON.parse(raw);
      if (!Array.isArray(queue)) {
        return;
      }

      queue[editingQueue.index] = updatedQueueItem;
      await AsyncStorage.setItem('pendingSubmissions', JSON.stringify(queue));

      setEditModalVisible(false);
      setEditingQueue(null);
      setEditedData('');
      setFormFields({});
      setRelatedDocType(null);
      fetchAsyncStorageData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save queue item. Please try again.');
      console.error('Error saving queue item:', e);
    }
  };

  const cancelEdit = () => {
    setEditModalVisible(false);
    setEditingQueue(null);
    setEditedData('');
    setFormFields({});
    setRelatedDocType(null);
  };

  const toggleCollapse = (section: keyof typeof collapsed) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSection = (
    title: string,
    items: StorageItem[],
    sectionKey: keyof typeof collapsed,
    removeHandler?: (index: number) => void,
    removeByNameHandler?: (name: string) => void,
    editHandler?: (index: number, data: any) => void
  ) => (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <TouchableOpacity
        onPress={() => toggleCollapse(sectionKey)}
        style={[
          styles.sectionHeader,
          { backgroundColor: theme.cardBackground },
        ]}
      >
        <View style={styles.headerLeft}>
          {collapsed[sectionKey] ? (
            <ChevronRight size={18} color={theme.text} />
          ) : (
            <ChevronDown size={18} color={theme.text} />
          )}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.itemCount, { color: theme.subtext }]}>
          {items.length} items
        </Text>
      </TouchableOpacity>

      {!collapsed[sectionKey] && (
        <View>
          {items.length === 0 ? (
            <Text style={[styles.noItems, { color: theme.subtext }]}>
              {t('downloads.noItems')}
            </Text>
          ) : (
            items.map((item, index) => (
              <View
                key={index}
                style={[styles.itemContainer, { borderTopColor: theme.border }]}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.flexOne}>
                    <Text style={[styles.itemKey, { color: theme.text }]}>
                      {item.key}
                    </Text>
                    <Text style={[styles.itemSize, { color: theme.subtext }]}>
                      Size: {item.size}
                    </Text>
                  </View>
                  <View style={styles.buttonContainer}>
                    {editHandler && (
                      <TouchableOpacity
                        onPress={() => editHandler(index, item.value)}
                        style={styles.editButton}
                      >
                        <Edit size={16} color={theme.buttonBackground} />
                        <Text
                          style={[
                            styles.editButtonText,
                            { color: theme.buttonBackground },
                          ]}
                        >
                          {t('downloads.edit')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {removeHandler && (
                      <TouchableOpacity
                        onPress={() => removeHandler(index)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={16} color="#b91c1c" />
                        <Text
                          style={[styles.removeButtonText, styles.errorColor]}
                        >
                          {t('downloads.remove')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.itemValueBox,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <Text style={[styles.itemValue, { color: theme.text }]}>
                    {typeof item.value === 'object'
                      ? JSON.stringify(item.value, null, 2)
                      : String(item.value)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        {t('downloads.title')}
      </Text>
      {renderSection(
        ' Download Doctypes',
        downloadDoctypesData,
        'downloadDoctypes',
        removeDownloadDoctypeItem
      )}
      {renderSection(
        '⏳ Pending Queue',
        queueData,
        'queue',
        removeQueueItem,
        undefined,
        editQueueItem
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: theme.cardBackground,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t('downloads.editQueueItem')}
              </Text>
              {relatedDocType && (
                <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                  DocType:{' '}
                  {relatedDocType.name || relatedDocType.doctype || 'Unknown'}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={cancelEdit} style={styles.cancelButton}>
              <X size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Form Fields Editor */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t('downloads.formDataFields')}
              </Text>

              {Object.entries(formFields).map(([key, value]) => (
                <View
                  key={key}
                  style={[
                    styles.fieldContainer,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.fieldHeader}>
                    <Text style={[styles.fieldName, { color: theme.text }]}>
                      {key}
                    </Text>
                  </View>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    value={String(value || '')}
                    onChangeText={text => updateFormField(key, text)}
                    placeholder={`Enter value for ${key}`}
                    placeholderTextColor={theme.subtext}
                    multiline={String(value || '').length > 50}
                    textAlignVertical="top"
                  />
                </View>
              ))}
            </View>

            {/* DocType Structure Reference */}
            {relatedDocType && relatedDocType.fields && (
              <View style={styles.referenceSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t('downloads.docTypeFields')}
                </Text>
                <View
                  style={[
                    styles.referenceContainer,
                    { backgroundColor: theme.cardBackground },
                  ]}
                >
                  {relatedDocType.fields.map((field: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.referenceField,
                        { backgroundColor: theme.background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.referenceFieldName,
                          { color: theme.text },
                        ]}
                      >
                        {field.fieldname || field.label || `Field ${index}`}
                      </Text>
                      <Text
                        style={[
                          styles.referenceFieldType,
                          { color: theme.subtext },
                        ]}
                      >
                        Type: {field.fieldtype || 'Unknown'}
                      </Text>
                      {field.options && (
                        <Text
                          style={[
                            styles.referenceFieldOptions,
                            { color: theme.subtext },
                          ]}
                        >
                          Options: {field.options}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Raw JSON Editor (Collapsed) */}
            <View style={styles.jsonSection}>
              <TouchableOpacity
                onPress={() =>
                  setCollapsed(prev => ({ ...prev, json: !prev.json }))
                }
                style={styles.jsonToggle}
              >
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {t('downloads.rawJsonData')}
                </Text>
                {collapsed.json ? (
                  <ChevronRight size={18} color={theme.text} />
                ) : (
                  <ChevronDown size={18} color={theme.text} />
                )}
              </TouchableOpacity>

              {!collapsed.json && (
                <View
                  style={[
                    styles.readOnlyContainer,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.readOnlyLabel, { color: theme.subtext }]}
                  >
                    {t('downloads.autoUpdateNote')}
                  </Text>
                  <TextInput
                    style={[
                      styles.modalTextInput,
                      styles.readOnlyTextInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    value={editedData}
                    placeholder="JSON data will appear here"
                    placeholderTextColor={theme.subtext}
                    multiline
                    textAlignVertical="top"
                    editable={false}
                    selectTextOnFocus={false}
                  />
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              onPress={cancelEdit}
              style={[
                styles.modalCancelButton,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Text style={[styles.modalCancelText, { color: theme.subtext }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveQueueItem}
              style={[
                styles.modalSaveButton,
                { backgroundColor: theme.buttonBackground },
              ]}
            >
              <Save size={16} color={theme.buttonText} />
              <Text style={[styles.modalSaveText, { color: theme.buttonText }]}>
                {t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  noItems: {
    padding: 16,
    textAlign: 'center',
    color: '#6b7280',
  },
  itemContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 12,
  },
  itemKey: {
    fontWeight: '600',
    color: '#111827',
  },
  itemSize: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  itemValueBox: {
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
  },
  itemValue: {
    fontSize: 12,
    color: '#374151',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 6,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: '#f9fafb',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#0369a1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSaveText: {
    color: 'white',
    fontWeight: '600',
  },
  // New form editor styles
  modalSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  formSection: {
    marginBottom: 24,
  },
  fieldContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  deleteFieldButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#fee2e2',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    backgroundColor: 'white',
    fontSize: 14,
    minHeight: 36,
  },
  referenceSection: {
    marginBottom: 24,
  },
  referenceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  referenceField: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0369a1',
  },
  referenceFieldName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  referenceFieldType: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  referenceFieldOptions: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
    fontStyle: 'italic',
  },
  jsonSection: {
    marginBottom: 16,
  },
  jsonToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  readOnlyContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  readOnlyTextInput: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderColor: '#cbd5e1',
  },
  flexOne: {
    flex: 1,
  },
  errorColor: {
    color: '#b91c1c',
  },
});

export default Downloads;
