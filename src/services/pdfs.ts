import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { usePdfsStore } from '../store/pdfsStore';
import { PdfItem } from '../models/pdf';

const PDFS_PATH = 'pdfs';

export const subscribeToPdfs = () => {
  const pdfsRef = collection(db, PDFS_PATH);
  const q = query(pdfsRef, orderBy('createdAt', 'desc'));

  usePdfsStore.getState().setLoading(true);

  const fallbackTimeout = setTimeout(() => {
    usePdfsStore.getState().setLoading(false);
  }, 2000);

  return onSnapshot(q, (snapshot) => {
    clearTimeout(fallbackTimeout);
    const pdfsList: PdfItem[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());
      const updatedAt = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now());
      pdfsList.push({ 
        id: docSnap.id, 
        ...data,
        tags: data.tags || [],
        favorite: data.favorite || false,
        createdAt,
        updatedAt
      } as PdfItem);
    });

    usePdfsStore.getState().setPdfs(pdfsList);
    usePdfsStore.getState().setLoading(false);
  }, (error) => {
    console.error('Error fetching pdfs:', error);
    usePdfsStore.getState().setLoading(false);
  });
};

export const createPdf = async (
  uri: string,
  fileName: string,
  fileSize: number,
  title: string,
  description: string,
  collectionId: string | null = null,
  tags: string[] = [],
  favorite: boolean = false,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const pdfsRef = collection(db, PDFS_PATH);
  const newDocRef = doc(pdfsRef);
  const id = newDocRef.id;

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'application/pdf',
    name: fileName || 'document.pdf',
  } as any);
  formData.append('upload_preset', 'BrainDump');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Use Cloudinary's /auto/upload endpoint for PDF/raw documents
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/dtymwiwmj/auto/upload');
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
    }

    xhr.onload = async () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          const now = Date.now();
          
          const newPdf: Omit<PdfItem, 'id'> = {
            type: 'pdf',
            title,
            description,
            pdfUrl: response.secure_url,
            publicId: response.public_id,
            fileName: fileName,
            fileSize: fileSize || response.bytes,
            pageCount: response.pages,
            collectionId,
            tags,
            favorite,
            createdAt: now,
            updatedAt: now,
          };

          // Save metadata to Firestore
          await setDoc(newDocRef, newPdf);
          resolve(id);
        } catch (error) {
          console.error('Error saving pdf metadata:', error);
          reject(error);
        }
      } else {
        const errorMsg = 'Cloudinary upload failed: ' + xhr.responseText;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      console.error('Network error during upload');
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
};

export const updatePdf = async (
  id: string, 
  title: string, 
  description: string, 
  collectionId: string | null = null,
  tags: string[] = [],
  favorite: boolean = false
) => {
  const store = usePdfsStore.getState();
  store.setPdfs(
    store.pdfs.map(pdf => pdf.id === id ? { ...pdf, title, description, collectionId, tags, favorite, updatedAt: Date.now() } : pdf)
  );

  const pdfRef = doc(db, PDFS_PATH, id);
  await updateDoc(pdfRef, {
    title,
    description,
    collectionId,
    tags,
    favorite,
    updatedAt: Date.now(),
  });
};

export const deletePdf = async (id: string) => {
  const store = usePdfsStore.getState();
  store.setPdfs(store.pdfs.filter(pdf => pdf.id !== id));

  try {
    const pdfRef = doc(db, PDFS_PATH, id);
    await deleteDoc(pdfRef);
  } catch (error) {
    console.error('Error deleting pdf:', error);
  }
};
