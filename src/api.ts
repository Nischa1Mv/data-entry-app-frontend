import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DocType, FormItem ,RawField} from "./types";
import {BACKEND_URL} from '@env';

// One axios instance to keep cookies
const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

//fetch all doctypes
export async function fetchAllDocTypeNamess(): Promise<FormItem[]> {
  try {
    const response = await axios.get(`${BACKEND_URL}/doctype/`, {
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
    const response = await axios.get(`${BACKEND_URL}/docType/${docTypeName}`, {
      withCredentials: true,
    });
    if (!response.data || !response.data.data) {
      throw new Error(`No data found for doctype: ${docTypeName}`);
    }
    return response.data.data as DocType;
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

export async function getDocTypeFromLocal(docTypeName: string): Promise<DocType | null> {
  try {
    const stored = await AsyncStorage.getItem("downloadDoctypes");
    if (!stored) return null;
    const docTypeData = JSON.parse(stored)[docTypeName] as DocType;
    return docTypeData;
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
    return true;
  } catch (error) {
    console.error(`Error saving local doctype: ${docTypeName}:`, error);
    throw error as Error;
  }
}
export function extractFields(docType: DocType): RawField[] {
  return docType.fields.map((field: RawField) => ({
    fieldname: field.fieldname,
    fieldtype: field.fieldtype,
    label: field.label,
    options: field.options,
  }));
}


export default api;
