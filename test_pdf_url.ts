import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { db } from './src/services/firebase';

async function checkUrl() {
  const q = query(collection(db, 'pdfs'), orderBy('createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    console.log("Found PDF URL:", doc.data().pdfUrl);
  });
  process.exit(0);
}

checkUrl();
