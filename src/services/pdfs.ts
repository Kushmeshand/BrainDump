import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_STORAGE_BUCKET, supabase } from './supabase';
import { usePdfsStore } from '../store/pdfsStore';
import { PdfItem } from '../models/pdf';
import { Platform } from 'react-native';

import { extractTextFromPdf } from '../utils/pdfParser';
import { recognizeText } from 'expo-mlkit-ocr';
import * as FileSystem from 'expo-file-system/legacy';
const { deleteAsync, copyAsync, cacheDirectory } = FileSystem;
import ExpoPdfToImageModule from 'expo-pdf-to-image';

const PDFS_PATH = 'pdfs';

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL FILE COPY
//
// On Android, expo-document-picker returns a content:// URI. Android's
// ContentResolver.openInputStream(contentUri) is a ONE-SHOT stream consumer:
// it can only be read ONCE. Every subsequent open of the same content:// URI
// returns an EOF stream → 0 chars for pages 2-N.
//
// Fix: at the very start of createPdf(), copy the file to a local file:// URI
// in the app cache directory. The local copy can be opened and read any number
// of times by both the PDF parser and the OCR renderer.
// The copy is deleted at the very end of the pipeline (after upload).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Copies a content:// URI to a local file:// path so it can be read multiple times.
 * Returns the original URI unchanged on iOS or if it is already a file://.
 */
const ensureLocalFile = async (uri: string, id: string): Promise<{ localUri: string; isCopy: boolean }> => {
  if (Platform.OS === 'android' && uri.startsWith('content://')) {
    const dest = `${cacheDirectory || ''}braindump_${id}.pdf`;
    console.log(`[PDFS] content:// URI detected — copying to ${dest}`);
    await copyAsync({ from: uri, to: dest });
    console.log(`[PDFS] Local copy created.`);
    return { localUri: dest, isCopy: true };
  }
  return { localUri: uri, isCopy: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// TEXT STORAGE HELPERS
//
// Firestore has a hard 1 MB per-document limit. A multi-page PDF can easily
// exceed this. Fix: store the full extracted text in a Firestore sub-document:
//   pdfs/{id}/textContent/data   { text: "..." }
// The main pdfs/{id} document stores only a 500-char preview.
// ─────────────────────────────────────────────────────────────────────────────

const TEXT_SUB_PATH = 'textContent';
const TEXT_DOC_ID = 'data';

export const saveExtractedText = async (pdfId: string, text: string): Promise<void> => {
  console.log(`[PDFS] Saving ${text.length} chars to sub-doc pdfs/${pdfId}/textContent/data`);
  const subRef = doc(db, PDFS_PATH, pdfId, TEXT_SUB_PATH, TEXT_DOC_ID);
  await setDoc(subRef, { text, savedAt: Date.now() });
  console.log(`[PDFS] Sub-document write complete.`);
};

export const loadExtractedText = async (pdfId: string, fallbackText?: string): Promise<string> => {
  try {
    console.log(`[PDFS] Loading full text for pdf ${pdfId} ...`);
    const subRef = doc(db, PDFS_PATH, pdfId, TEXT_SUB_PATH, TEXT_DOC_ID);
    const snap = await getDoc(subRef);
    if (snap.exists()) {
      const text = snap.data()?.text || '';
      console.log(`[PDFS] Loaded ${text.length} chars from sub-document.`);
      return text;
    }
    const fb = fallbackText || '';
    console.log(`[PDFS] Sub-document not found — using fallback (${fb.length} chars).`);
    return fb;
  } catch (err) {
    console.warn(`[PDFS] Failed to load sub-document:`, err);
    return fallbackText || '';
  }
};

// ─────────────────────────────────────────────────────────────────────────────

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
  onProgress?: (progress: number) => void,
  onOcrProgress?: (status: string) => void
): Promise<string> => {
  const pdfsRef = collection(db, PDFS_PATH);
  const newDocRef = doc(pdfsRef);
  const id = newDocRef.id;

  return new Promise(async (resolve, reject) => {
    // localUri and isCopy are declared outside try/finally so we can clean up
    // the temp copy even if the pipeline fails partway through.
    let localUri = uri;
    let isCopy = false;

    try {
      // ── Step 0: Guarantee a local file:// URI (fixes Android content:// bug) ──
      console.log(`\n[PDFS] ══════════════════════════════════════════`);
      console.log(`[PDFS] createPdf() started — id: ${id}`);
      console.log(`[PDFS] Input URI: ${uri}`);

      try {
        const local = await ensureLocalFile(uri, id);
        localUri = local.localUri;
        isCopy = local.isCopy;
        console.log(`[PDFS] Working URI: ${localUri} (is local copy: ${isCopy})`);
      } catch (copyErr: any) {
        console.error(`[PDFS] Failed to create local copy: ${copyErr.message}`);
        console.warn(`[PDFS] Proceeding with original URI (may fail on Android).`);
        localUri = uri;
        isCopy = false;
      }

      // ── Step 1: Hybrid PDF Extraction Pipeline ──────────────────────
      const startTime = Date.now();
      if (onOcrProgress) onOcrProgress('Starting extraction...');
      console.log(`[PDFS] Starting Hybrid Extraction Pipeline...`);

      let totalPages = 0;
      let pageCount = 1;
      try {
        const { getPageCount } = require('expo-pdf-text-extract');
        totalPages = await getPageCount(localUri);
        pageCount = totalPages;
        console.log(`[PDFS] Total pages detected: ${totalPages}`);
      } catch (e) {
        console.error('[PDFS] getPageCount failed:', e);
      }

      let imagePaths: string[] | null = null;
      let finalMergedText = '';
      let totalExtractedChars = 0;

      if (totalPages > 0) {
        const { extractTextFromPage } = require('expo-pdf-text-extract');

        for (let p = 1; p <= totalPages; p++) {
          let pageText = '';
          try {
             const raw = await extractTextFromPage(localUri, p);
             pageText = (raw || '').trim();
          } catch (e) {
             console.error(`[PDFS] Native extraction failed for page ${p}:`, e);
          }

          const nativeChars = pageText.length;
          const cleanNative = pageText.replace(/\s+/g, '');
          const needsOcr = cleanNative.length < 20;

          console.log(`[PDFS] Page ${p}`);
          console.log(`[PDFS]   Native chars: ${nativeChars}`);
          console.log(`[PDFS]   OCR needed: ${needsOcr ? 'Yes' : 'No'}`);

          if (needsOcr) {
             // Generate images only when the first OCR is actually needed
             if (!imagePaths) {
               if (onOcrProgress) onOcrProgress(`Rendering PDF for OCR...`);
               console.log(`[PDFS]   Rendering PDF to images (triggered by page ${p})...`);
               try {
                 imagePaths = await ExpoPdfToImageModule.convertPdfToImages(localUri);
               } catch (e) {
                 console.error(`[PDFS]   convertPdfToImages failed:`, e);
                 imagePaths = [];
               }
             }

             let ocrChars = 0;
             if (imagePaths && imagePaths.length >= p) {
                const pageUri = imagePaths[p - 1];
                const finalPageUri = pageUri.startsWith('file://') ? pageUri : 'file://' + pageUri;

                if (onOcrProgress) onOcrProgress(`OCR: Page ${p} of ${totalPages}...`);
                try {
                  const ocrResult = await recognizeText(finalPageUri);
                  pageText = (ocrResult.text || '').trim();
                  ocrChars = pageText.length;
                } catch (e) {
                  console.error(`[PDFS]   OCR failed for page ${p}:`, e);
                }
             }
             console.log(`[PDFS]   OCR chars: ${ocrChars}`);
          }

          console.log(`[PDFS]   Final chars: ${pageText.length}`);
          totalExtractedChars += pageText.length;

          if (pageText) {
             finalMergedText += `--- Page ${p} ---\n${pageText}\n\n`;
          } else {
             finalMergedText += `--- Page ${p} ---\n[No readable text found]\n\n`;
          }
        }
      } else {
         console.warn('[PDFS] 0 pages reported. Fallback to old full-doc extraction.');
         let extractedText = await extractTextFromPdf(localUri);
         finalMergedText = extractedText.trim();
      }

      // Clean up rendered images
      if (imagePaths) {
         for (const img of imagePaths) {
            try { await deleteAsync(img, { idempotent: true }); } catch (e) {}
         }
      }

      let extractedText = finalMergedText.trim();
      if (!extractedText) {
        extractedText = 'No readable text could be detected from this PDF.';
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[PDFS] ──────────────────────────────────────────`);
      console.log(`[PDFS] HYBRID EXTRACTION SUMMARY`);
      console.log(`[PDFS]   Time           : ${totalTime}s`);
      console.log(`[PDFS]   Pages          : ${totalPages}`);
      console.log(`[PDFS]   Text length    : ${extractedText.length} chars`);
      console.log(`[PDFS]   Non-ws chars   : ${extractedText.replace(/\s+/g, '').length}`);
      console.log(`[PDFS] ══════════════════════════════════════════\n`);

      // ── Step 3: Upload PDF binary to Supabase Storage ─────────────────────
      if (onOcrProgress) onOcrProgress('Uploading PDF...');
      console.log('[PDFS] Starting Supabase upload...');

      const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const storagePath = `${id}_${safeFileName}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${storagePath}`;

      // Upload from localUri (file://) — always readable, avoids content:// issues
      const uploadWithRetry = async (retries = 3): Promise<any> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            console.log(`[PDFS] Upload attempt ${attempt}/${retries}...`);

            const uploadTask = FileSystem.createUploadTask(
              uploadUrl,
              localUri,  // ← always a readable file:// URI
              {
                httpMethod: 'POST',
                uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
                headers: {
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/pdf',
                  'x-upsert': 'true',
                },
              },
              (progress) => {
                if (onProgress && progress.totalBytesExpectedToSend > 0) {
                  const percent = (progress.totalBytesSent / progress.totalBytesExpectedToSend) * 100;
                  onProgress(percent);
                }
              }
            );

            const result = await uploadTask.uploadAsync();

            if (result && (result.status === 200 || result.status === 201)) {
              console.log(`[PDFS] Upload succeeded on attempt ${attempt}.`);
              return result;
            }

            throw new Error(`Server returned ${result?.status}: ${result?.body}`);
          } catch (e: any) {
            console.error(`[PDFS] Upload attempt ${attempt} failed: ${e.message}`);
            if (attempt === retries) throw e;
            await new Promise(res => setTimeout(res, 2000));
          }
        }
      };

      await uploadWithRetry(3);

      // ── Step 4: Save main Firestore document ──────────────────────────────
      const downloadURL = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${storagePath}`;
      const now = Date.now();

      // Only store a short preview in the main document to stay well under 1MB.
      // Full text lives in pdfs/{id}/textContent/data.
      const textPreview = extractedText.substring(0, 500);

      const newPdf: Omit<PdfItem, 'id'> = {
        type: 'pdf',
        title,
        description,
        pdfUrl: downloadURL,
        publicId: storagePath,
        fileName,
        fileSize,
        pageCount,
        collectionId,
        tags,
        favorite,
        createdAt: now,
        updatedAt: now,
        extractedText: textPreview,
      };

      console.log(`[PDFS] Writing main Firestore document...`);
      await setDoc(newDocRef, newPdf);
      console.log(`[PDFS] Main document saved.`);

      // ── Step 5: Save full text in sub-document ────────────────────────────
      if (extractedText.length > 0) {
        await saveExtractedText(id, extractedText);
      }

      console.log(`[PDFS] ✓ createPdf complete — id: ${id}`);
      resolve(id);
    } catch (error: any) {
      console.error('[PDFS] createPdf failed:', error);
      reject(error);
    } finally {
      // ── Cleanup: delete local copy after pipeline finishes (success or fail) ──
      if (isCopy && localUri) {
        try {
          await deleteAsync(localUri, { idempotent: true });
          console.log(`[PDFS] Local copy deleted: ${localUri}`);
        } catch (_) {}
      }
    }
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
    const pdf = store.pdfs.find(p => p.id === id);
    if (pdf?.publicId && SUPABASE_URL) {
      try {
        const { error: deleteError } = await supabase.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .remove([pdf.publicId]);

        if (deleteError) {
          console.error('Supabase deletion error:', deleteError);
        } else {
          console.log(`Deleted ${pdf.publicId} from Supabase.`);
        }
      } catch (e) {
        console.error('Failed to delete from Supabase Storage:', e);
      }
    }
    const pdfRef = doc(db, PDFS_PATH, id);
    await deleteDoc(pdfRef);
  } catch (error) {
    console.error('Error deleting pdf:', error);
  }
};
