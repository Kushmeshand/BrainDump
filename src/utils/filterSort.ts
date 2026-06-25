import { Note } from '../models/note';
import { Link } from '../models/link';
import { ImageItem } from '../models/image';
import { PdfItem } from '../models/pdf';
import { SortOption, FilterOption } from '../components/FilterSortBar';

type FeedItem = Note | Link | ImageItem | PdfItem;

export function applyFilterAndSort<T extends FeedItem>(
  items: T[], 
  filter: FilterOption, 
  sort: SortOption
): T[] {
  // 1. Apply Filter
  let filtered = items;
  
  switch (filter) {
    case 'all':
      break;
    case 'notes':
      filtered = items.filter(item => !('url' in item) && !('imageUrl' in item) && !('pdfUrl' in item));
      break;
    case 'links':
      filtered = items.filter(item => 'url' in item);
      break;
    case 'images':
      filtered = items.filter(item => 'imageUrl' in item);
      break;
    case 'pdfs':
      filtered = items.filter(item => 'pdfUrl' in item);
      break;
    case 'favorites':
      filtered = items.filter(item => item.favorite === true);
      break;
    case 'untagged':
      filtered = items.filter(item => !item.tags || item.tags.length === 0);
      break;
    case 'no_collection':
      filtered = items.filter(item => !item.collectionId);
      break;
  }

  // 2. Apply Sort
  let sorted = [...filtered];

  switch (sort) {
    case 'newest':
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'oldest':
      sorted.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case 'alphabetical':
      sorted.sort((a, b) => {
        const titleA = a.title || 'Untitled';
        const titleB = b.title || 'Untitled';
        return titleA.localeCompare(titleB);
      });
      break;
    case 'favorites_first':
      sorted.sort((a, b) => {
        if (a.favorite === b.favorite) {
          return b.createdAt - a.createdAt; // fallback to newest
        }
        return a.favorite ? -1 : 1;
      });
      break;
    case 'recently_updated':
      sorted.sort((a, b) => b.updatedAt - a.updatedAt);
      break;
  }

  return sorted;
}
