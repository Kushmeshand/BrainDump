import { extractTextWithInfo, extractTextFromPage, getPageCount, isAvailable } from 'expo-pdf-text-extract';

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSE (Android) — fixed in pdfs.ts, not here
//
// expo-document-picker returns a content:// URI on Android.
// Android's ContentResolver.openInputStream(contentUri) is a ONE-SHOT stream
// consumer. Each call to getInputStream() on the same content:// URI gets an
// already-exhausted stream → 0 chars for pages 2-N.
//
// Fix: pdfs.ts copies the content:// URI to a local file:// path BEFORE
// calling this function. This function therefore always receives a reusable
// file:// URI and can open it as many times as needed.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the COMPLETE text from a PDF file.
 *
 * IMPORTANT: The caller MUST pass a file:// URI or absolute path.
 * content:// URIs will only work for the first read on Android.
 * Use pdfs.ts → ensureLocalFile() before calling this function.
 *
 * Strategy:
 *  1. extractTextWithInfo() — reads the whole document in one pass.
 *     Most reliable for total char count.
 *  2. extractTextFromPage() for EVERY page — builds a structured, labelled
 *     output and verifies every page is covered.
 *  3. Return page-by-page text (preferred) or bulk text as fallback.
 *
 * @param localUri A file:// URI or absolute path to the PDF.
 * @returns Full extracted text with page labels, or '' on failure.
 */
export const extractTextFromPdf = async (localUri: string): Promise<string> => {
  console.log('\n[EXTRACT] ═══════════════════════════════════════════════');
  console.log(`[EXTRACT] Extraction started`);
  console.log(`[EXTRACT] URI: ${localUri}`);

  if (!isAvailable()) {
    console.warn('[EXTRACT] expo-pdf-text-extract not available. Returning empty.');
    return '';
  }

  // ── Stage 1: Bulk extraction (one stream open, reads all pages) ───────────
  console.log('[EXTRACT] Stage 1 — bulk extractTextWithInfo() ...');
  let bulkText = '';
  let reportedPageCount = 0;

  try {
    const info = await extractTextWithInfo(localUri);
    if (info.success) {
      bulkText = (info.text || '').trim();
      reportedPageCount = info.pageCount || 0;
      console.log(`[EXTRACT] Stage 1 success:`);
      console.log(`[EXTRACT]   Pages reported : ${reportedPageCount}`);
      console.log(`[EXTRACT]   Bulk chars     : ${bulkText.length}`);
      console.log(`[EXTRACT]   Non-ws chars   : ${bulkText.replace(/\s+/g, '').length}`);
    } else {
      console.warn(`[EXTRACT] Stage 1 failed: ${info.error} (${info.errorCode})`);
    }
  } catch (err: any) {
    console.warn(`[EXTRACT] Stage 1 threw: ${err.message}`);
  }

  // ── Stage 2: Page-by-page (each page opens a fresh stream — safe on file://) ──
  console.log('[EXTRACT] Stage 2 — page-by-page extractTextFromPage() ...');

  let totalPages = reportedPageCount;
  if (totalPages === 0) {
    try {
      totalPages = await getPageCount(localUri);
      console.log(`[EXTRACT] getPageCount() = ${totalPages}`);
    } catch (countErr: any) {
      console.warn(`[EXTRACT] getPageCount() failed: ${countErr.message}`);
    }
  }

  let pageByPageText = '';
  let pageTotalChars = 0;

  if (totalPages > 0) {
    const pageSegments: string[] = [];

    for (let p = 1; p <= totalPages; p++) {
      try {
        const raw = await extractTextFromPage(localUri, p);
        const pageText = (raw || '').trim();
        console.log(`[EXTRACT]   Page ${p}/${totalPages}: ${pageText.length} chars`);
        pageTotalChars += pageText.length;
        pageSegments.push(`--- Page ${p} ---\n${pageText}`);
      } catch (pageErr: any) {
        console.error(`[EXTRACT]   Page ${p} failed: ${pageErr.message}`);
        pageSegments.push(`--- Page ${p} ---\n[Extraction failed]`);
      }
    }

    pageByPageText = pageSegments.join('\n\n');
    console.log(`[EXTRACT] Stage 2 complete:`);
    console.log(`[EXTRACT]   Pages processed     : ${totalPages}`);
    console.log(`[EXTRACT]   Sum of page chars   : ${pageTotalChars}`);
    console.log(`[EXTRACT]   Page-by-page length : ${pageByPageText.length}`);
  } else {
    console.warn('[EXTRACT] Zero pages — stage 2 skipped.');
  }

  // ── Stage 3: Choose the best result ───────────────────────────────────────
  const bulkNonWs = bulkText.replace(/\s+/g, '').length;
  const pageNonWs = pageByPageText.replace(/\s+/g, '').length;

  let finalText = '';
  if (pageNonWs > 0) {
    finalText = pageByPageText;
    console.log(`[EXTRACT] Selected: page-by-page (${finalText.length} chars)`);
  } else if (bulkNonWs > 0) {
    finalText = bulkText;
    console.log(`[EXTRACT] Selected: bulk text (${finalText.length} chars)`);
  } else {
    console.warn('[EXTRACT] Both stages returned empty — PDF may be scanned.');
  }

  console.log(`[EXTRACT] ═══════════════════════════════════════════════`);
  console.log(`[EXTRACT] FINAL: ${finalText.length} chars`);
  if (finalText.length > 0) {
    console.log(`[EXTRACT] Preview: ${finalText.substring(0, 200)}`);
  }
  console.log(`[EXTRACT] ═══════════════════════════════════════════════\n`);

  return finalText;
};
