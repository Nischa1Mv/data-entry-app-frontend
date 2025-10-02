import AsyncStorage from "@react-native-async-storage/async-storage";
import {SubmissionItem} from "../types"

const STORAGE_KEY = "pendingSubmissions";

export const initQueue = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
};

export const getQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error parsing queue", e);
    return [];
  }
};

export const enqueue = async (submission: SubmissionItem) => {
  const queue = await getQueue();
  const updatedQueue = [...queue, submission];
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue));
    console.log("Enqueued submission:", submission);
  } catch (e) {
    console.error("Failed to save submission:", e);
    throw e;
  }
  return submission;
};

export const clearQueue = async () => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
};

export const removeFromQueue = async (id: string) => {
  const queue = await getQueue();
  const updated = queue.filter((item: any) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

// export const processQueue = async (submitFn: (item: any) => Promise<void>) => {
//   const queue = await getQueue();

//   for (const item of queue) {
//     try {
//       await submitFn(item); // 🔗 call your API here
//       await removeFromQueue(item.id);
//       console.log("✅ Submitted & removed:", item.id);
//     } catch (err) {
//       console.error("❌ Failed to submit:", item.id, err);
//       // keep in queue for retry
//     }
//   }
// };

// // ✅ Auto-process when online
// export const autoProcessOnNetwork = (submitFn: (item: any) => Promise<void>) => {
//   NetInfo.addEventListener((state) => {
//     if (state.isConnected) {
//       console.log("🌐 Online, processing queue...");
//       processQueue(submitFn);
//     }
//   });
// };
