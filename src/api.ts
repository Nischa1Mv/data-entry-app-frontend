import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DocType, FormItem } from "./types";

const API_BASE = "https://erp.kisanmitra.net";

// One axios instance to keep cookies
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// login function
export async function login(username: string, password: string) {
  await api.post("/api/method/login", { usr: username, pwd: password });
}

//fetch all doctypes
export async function fetchAllDocTypeNamess(): Promise<FormItem[]> {
  try {
    await axios.post(
      `${API_BASE}/api/method/login`,
      {
        usr: 'ads@aegiondynamic.com',
        pwd: 'Csa@2025',
      },
      { withCredentials: true }
    );

    const response = await axios.get(`${API_BASE}/api/resource/DocType`, {
      withCredentials: true,
    });

    const data = response.data.data;
    return data;
  } catch (error) {
    console.error('Error while online:', error);
    throw error as Error;
  }
}

// fetch doctypes
export async function fetchDocType(docTypeName: string): Promise<DocType> {
  try {
    await axios.post(
      `${API_BASE}/api/method/login`,
      {
        usr: 'ads@aegiondynamic.com',
        pwd: 'Csa@2025',
      },
      { withCredentials: true }
    );

    const response = await axios.get(`${API_BASE}/api/resource/DocType/${docTypeName}`, {
      withCredentials: true,
    });
    if (!response.data || !response.data.data) {
      throw new Error(`No data found for doctype: ${docTypeName}`);
    }
    return response.data as DocType;
  } catch (error) {
    console.error('Error fetching doctype data:', error);
    throw error as Error;
  }
}

export async function getAllDoctypesFromLocal(): Promise<Record<string, DocType>> {
  try {
    const stored = await AsyncStorage.getItem("downloadDoctypes");
    if (stored) {
      return JSON.parse(stored) as Record<string, DocType>;
    } else {
      return {};
    }
  } catch (error) {
    console.error("Error fetching local doctypes:", error);
    throw error as Error;
  }
}

export async function getAllDocTypeNames(): Promise<FormItem[]> {
  try {
    const allDoctypes = await getAllDoctypesFromLocal();

    return Object.keys(allDoctypes).map((docTypeName) => ({
      name: docTypeName,
    }));
  } catch (error) {
    console.error("Error fetching docType names:", error);
    throw error as Error;
  }
}

export async function getDocTypeFromLocal(docTypeName: string): Promise<DocType> {
  try {
    const stored = await AsyncStorage.getItem("downloadDoctypes");
    if (stored && JSON.parse(stored)[docTypeName]) {
      console.log("stored value:", stored);
      const DocType = JSON.parse(stored)[docTypeName]
      return DocType.data ? DocType.data as DocType : {} as DocType;
    } else {
      return {} as DocType;
    }
  } catch (error) {
    console.error(`Error fetching local doctype: ${docTypeName}:`, error);
    throw error as Error;
  }
}

export async function saveDocTypeToLocal(docTypeName: string, docTypeData: DocType): Promise<boolean> {
  try {
    const existingDoctypeData = await AsyncStorage.getItem("downloadDoctypes");
    let allDocTypeStorage: Record<string, DocType> = existingDoctypeData ? JSON.parse(existingDoctypeData) : {};
    allDocTypeStorage[docTypeName] = docTypeData;
    await AsyncStorage.setItem("downloadDoctypes", JSON.stringify(allDocTypeStorage));
    console.log(`DocType ${docTypeName} saved locally.`);
    const reponse = await getDocTypeFromLocal(docTypeName);
    if (reponse) return true;
    else return false;
  } catch (error) {
    console.error(`Error saving local doctype: ${docTypeName}:`, error);
    throw error as Error;
  }
}


export default api;
