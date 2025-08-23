import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronDown, ChevronRight } from "lucide-react-native"; // RN version

interface StorageItem {
    key: string;
    value: any;
    size: string;
}

const Downloads: React.FC = () => {
    const [docTypeNames, setDocTypeNames] = useState<StorageItem[]>([]);
    const [docTypeData, setDocTypeData] = useState<StorageItem[]>([]);
    const [queueData, setQueueData] = useState<StorageItem[]>([]);

    const [collapsed, setCollapsed] = useState({
        names: false,
        data: false,
        queue: false,
    });

    useEffect(() => {
        fetchAsyncStorageData();
    }, []);

    const fetchAsyncStorageData = async () => {
        try {
            const names: StorageItem[] = [];
            const data: StorageItem[] = [];
            const queue: StorageItem[] = [];

            const keys = await AsyncStorage.getAllKeys();
            const entries = await AsyncStorage.multiGet(keys);

            for (const [key, value] of entries) {
                if (!key) continue;

                const parsedValue = tryParseJSON(value);
                const size = new TextEncoder().encode(value || "").length;
                const item = {
                    key,
                    value: parsedValue,
                    size: formatBytes(size),
                };

                if (key.startsWith("downloadedDoctypes")) {
                    // If it's an array of doctype names, create separate items for each
                    if (Array.isArray(parsedValue)) {
                        parsedValue.forEach((val: any, idx: number) => {
                            const doctypeName = typeof val === 'string' ? val : val?.name || `Item ${idx}`;
                            const subItem = {
                                key: `${key}[${idx}] - ${doctypeName}`,
                                value: val,
                                size: formatBytes(new TextEncoder().encode(JSON.stringify(val)).length),
                            };
                            names.push(subItem);
                        });
                    } else {
                        names.push(item);
                    }
                } else if (key.startsWith("docType_")) {
                    data.push(item);
                } else if (key === "pendingSubmissions") {
                    // If it's an array, split it into individual items for rendering
                    if (Array.isArray(parsedValue)) {
                        parsedValue.forEach((val: any, idx: number) => {
                            const subItem = {
                                key: `${key}[${idx}]`,
                                value: val,
                                size: formatBytes(new TextEncoder().encode(JSON.stringify(val)).length),
                            };
                            queue.push(subItem);
                        });
                    } else {
                        queue.push(item);
                    }
                }
            }

            setDocTypeNames(names);
            setDocTypeData(data);
            setQueueData(queue);
        } catch (e) {
            console.error("Error fetching AsyncStorage data:", e);
        }
    };

    const tryParseJSON = (jsonString: string | null) => {
        try {
            return jsonString ? JSON.parse(jsonString) : jsonString;
        } catch {
            return jsonString;
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Remove a regular AsyncStorage key
    const removeItem = async (key: string) => {
        await AsyncStorage.removeItem(key);
        fetchAsyncStorageData();
    };

    // Remove doctype data and sync with downloadedDoctypes
    const removeDocTypeDataWithSync = async (key: string, doctypeData: any) => {
        try {
            // Remove the doctype data entry
            await AsyncStorage.removeItem(key);

            // Extract doctype name from the data
            let doctypeName = null;
            if (doctypeData && typeof doctypeData === 'object') {
                // Try multiple possible field names for the doctype name
                doctypeName = doctypeData.name || 
                             doctypeData.doctype || 
                             doctypeData.title || 
                             doctypeData.doc_type ||
                             doctypeData.type;
                
                // If it's nested in a data object
                if (!doctypeName && doctypeData.data) {
                    doctypeName = doctypeData.data.name || 
                                 doctypeData.data.doctype || 
                                 doctypeData.data.title;
                }
            }

            console.log("Attempting to sync removal for doctype:", doctypeName);

            // If we found a doctype name, also remove it from downloadedDoctypes
            if (doctypeName) {
                const raw = await AsyncStorage.getItem("downloadedDoctypes");
                if (raw) {
                    const arr = JSON.parse(raw);
                    if (Array.isArray(arr)) {
                        const originalLength = arr.length;
                        const filteredArr = arr.filter(item => {
                            // Handle both string items and object items
                            if (typeof item === 'string') {
                                return item !== doctypeName;
                            } else if (typeof item === 'object' && item.name) {
                                return item.name !== doctypeName;
                            }
                            return true;
                        });
                        
                        if (filteredArr.length !== originalLength) {
                            await AsyncStorage.setItem("downloadedDoctypes", JSON.stringify(filteredArr));
                            console.log("Successfully synced removal from downloadedDoctypes");
                        } else {
                            console.log("No matching doctype found in downloadedDoctypes to remove");
                        }
                    }
                }
            } else {
                console.log("Could not extract doctype name from data:", doctypeData);
            }

            fetchAsyncStorageData();
        } catch (e) {
            console.error("Error removing doctype data with sync:", e);
        }
    };

    const removeQueueItem = async (indexToRemove: number) => {
        try {
            const raw = await AsyncStorage.getItem("pendingSubmissions");
            if (!raw) return;

            const queue = JSON.parse(raw);
            if (!Array.isArray(queue)) return;

            queue.splice(indexToRemove, 1);
            await AsyncStorage.setItem("pendingSubmissions", JSON.stringify(queue));

            fetchAsyncStorageData();
        } catch (e) {
            console.error("Error removing queue item:", e);
        }
    };

    // Remove a specific downloadedDoctypes item if it's an array
    const removeDoctypeItem = async (indexToRemove: number) => {
        try {
            const raw = await AsyncStorage.getItem("downloadedDoctypes");
            if (!raw) return;

            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return;

            arr.splice(indexToRemove, 1);
            await AsyncStorage.setItem("downloadedDoctypes", JSON.stringify(arr));

            fetchAsyncStorageData();
        } catch (e) {
            console.error("Error removing downloadedDoctypes item:", e);
        }
    };

    // Remove a specific doctype by name from downloadedDoctypes array
    const removeDoctypeByName = async (doctypeName: string) => {
        try {
            const raw = await AsyncStorage.getItem("downloadedDoctypes");
            if (!raw) return;

            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return;

            const filteredArr = arr.filter(item => {
                // Handle both string items and object items
                if (typeof item === 'string') {
                    return item !== doctypeName;
                } else if (typeof item === 'object' && item.name) {
                    return item.name !== doctypeName;
                }
                return true;
            });

            await AsyncStorage.setItem("downloadedDoctypes", JSON.stringify(filteredArr));

            console.log("Attempting to sync removal of doctype data for:", doctypeName);

            // Also remove corresponding docType_ data
            await removeCorrespondingDocTypeData(doctypeName);

            fetchAsyncStorageData();
        } catch (e) {
            console.error("Error removing doctype by name:", e);
        }
    };

    // Remove a specific doctype by index from the displayed list
    const removeDoctypeByDisplayIndex = async (displayIndex: number) => {
        try {
            const raw = await AsyncStorage.getItem("downloadedDoctypes");
            if (!raw) return;

            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return;

            // Get the doctype name before removing it
            const doctypeToRemove = arr[displayIndex];
            let doctypeName = null;
            
            if (typeof doctypeToRemove === 'string') {
                doctypeName = doctypeToRemove;
            } else if (typeof doctypeToRemove === 'object' && doctypeToRemove.name) {
                doctypeName = doctypeToRemove.name;
            }

            // Remove from downloadedDoctypes array
            arr.splice(displayIndex, 1);
            await AsyncStorage.setItem("downloadedDoctypes", JSON.stringify(arr));

            console.log("Attempting to sync removal of doctype data for:", doctypeName);

            // If we have a doctype name, also remove corresponding docType_ data
            if (doctypeName) {
                await removeCorrespondingDocTypeData(doctypeName);
            }

            fetchAsyncStorageData();
        } catch (e) {
            console.error("Error removing doctype by index:", e);
        }
    };

    // Remove corresponding docType_ data based on doctype name
    const removeCorrespondingDocTypeData = async (doctypeName: string) => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const docTypeKeys = keys.filter(key => key.startsWith("docType_"));
            
            for (const key of docTypeKeys) {
                const data = await AsyncStorage.getItem(key);
                if (data) {
                    const parsedData = tryParseJSON(data);
                    
                    // Check if this doctype data matches the name we're looking for
                    let dataName = null;
                    if (parsedData && typeof parsedData === 'object') {
                        dataName = parsedData.name || 
                                  parsedData.doctype || 
                                  parsedData.title || 
                                  parsedData.doc_type ||
                                  parsedData.type;
                        
                        // Check nested data object
                        if (!dataName && parsedData.data) {
                            dataName = parsedData.data.name || 
                                      parsedData.data.doctype || 
                                      parsedData.data.title;
                        }
                    }
                    
                    // If names match, remove this doctype data
                    if (dataName === doctypeName) {
                        await AsyncStorage.removeItem(key);
                        console.log(`Removed corresponding doctype data: ${key}`);
                        break; // Assuming one doctype data per name
                    }
                }
            }
        } catch (e) {
            console.error("Error removing corresponding doctype data:", e);
        }
    };

    const toggleCollapse = (section: keyof typeof collapsed) => {
        setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const renderSection = (
        title: string,
        items: StorageItem[],
        sectionKey: keyof typeof collapsed,
        removeHandler?: (index: number) => void,
        removeByNameHandler?: (name: string) => void
    ) => (
        <View style={styles.section}>
            <TouchableOpacity
                onPress={() => toggleCollapse(sectionKey)}
                style={styles.sectionHeader}
            >
                <View style={styles.headerLeft}>
                    {collapsed[sectionKey] ? (
                        <ChevronRight size={18} />
                    ) : (
                        <ChevronDown size={18} />
                    )}
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>
                <Text style={styles.itemCount}>{items.length} items</Text>
            </TouchableOpacity>

            {!collapsed[sectionKey] && (
                <View>
                    {items.length === 0 ? (
                        <Text style={styles.noItems}>No items</Text>
                    ) : (
                        items.map((item, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <View style={styles.itemHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemKey}>{item.key}</Text>
                                        <Text style={styles.itemSize}>Size: {item.size}</Text>
                                    </View>
                                    {(removeHandler || removeByNameHandler) && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (sectionKey === 'names' && removeByNameHandler) {
                                                    // Extract doctype name from the value
                                                    const doctypeName = typeof item.value === 'string' 
                                                        ? item.value 
                                                        : item.value?.name || item.value;
                                                    
                                                    if (doctypeName) {
                                                        removeDoctypeByDisplayIndex(index);
                                                    }
                                                } else if (removeHandler) {
                                                    removeHandler(index);
                                                }
                                            }}
                                            style={styles.removeButton}
                                        >
                                            <Text style={styles.removeButtonText}>Remove</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={styles.itemValueBox}>
                                    <Text style={styles.itemValue}>
                                        {typeof item.value === "object"
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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>AsyncStorage Manager</Text>
            {renderSection(
                "📄 downloadedDoctypes", 
                docTypeNames, 
                "names", 
                undefined,
                removeDoctypeByName
            )}
            {renderSection(
                "📑 DocType Data",
                docTypeData,
                "data",
                (index: number) => removeDocTypeDataWithSync(docTypeData[index].key, docTypeData[index].value)
            )}
            {renderSection("⏳ Pending Queue", queueData, "queue", removeQueueItem)}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f9fafb",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
    },
    section: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        marginBottom: 16,
        overflow: "hidden",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#f3f4f6",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    itemCount: {
        fontSize: 12,
        color: "#6b7280",
    },
    noItems: {
        padding: 16,
        textAlign: "center",
        color: "#6b7280",
    },
    itemContainer: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 6,
    },
    itemKey: {
        fontWeight: "600",
        color: "#111827",
    },
    itemSize: {
        fontSize: 12,
        color: "#6b7280",
    },
    removeButton: {
        backgroundColor: "#fee2e2",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    removeButtonText: {
        color: "#b91c1c",
        fontWeight: "600",
    },
    itemValueBox: {
        backgroundColor: "#f9fafb",
        padding: 8,
        borderRadius: 6,
    },
    itemValue: {
        fontSize: 12,
        color: "#374151",
    },
});

export default Downloads;
