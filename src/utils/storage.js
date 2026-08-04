import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Uploads a file to Firebase Storage under the given folder path and returns its public download URL.
 * Throws a real error on failure instead of silently degrading to a Base64 Data URL —
 * embedding a full image as text in Firestore risks exceeding the 1MB document limit
 * and hides real Storage permission/network problems from the caller.
 * @param {File} file - The file object to upload.
 * @param {string} folder - Target storage folder (defaults to 'uploads').
 * @returns {Promise<string>} Public download URL.
 */
export async function uploadFileToStorage(file, folder = 'uploads') {
  if (!file) throw new Error('No file provided for upload.');

  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${folder}/${timestamp}_${sanitizedFileName}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return downloadUrl;
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