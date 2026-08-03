import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Uploads a file to Firebase Storage under the given folder path and returns its public download URL.
 * Resiliently falls back to Base64 Data URL if storage bucket upload encounters permission/network errors.
 * @param {File} file - The file object to upload.
 * @param {string} folder - Target storage folder (defaults to 'uploads').
 * @returns {Promise<string>} Public download URL or Data URL.
 */
export async function uploadFileToStorage(file, folder = 'uploads') {
  if (!file) throw new Error('No file provided for upload.');

  try {
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${folder}/${timestamp}_${sanitizedFileName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return downloadUrl;
  } catch (err) {
    console.warn('Firebase Storage upload notice (falling back to DataURL):', err);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (readErr) => reject(readErr);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Deletes a file from Firebase Storage by full URL or storage path.
 * @param {string} fileUrlOrPath
 */
export async function deleteFileFromStorage(fileUrlOrPath) {
  if (!fileUrlOrPath || fileUrlOrPath.startsWith('data:')) return;
  try {
    const storageRef = ref(storage, fileUrlOrPath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete file from Firebase Storage:', err);
  }
}
