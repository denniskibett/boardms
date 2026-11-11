import type { Metadata } from 'next';
import BooksList from '@/components/books/BooksList';

export const metadata: Metadata = { title: 'Meeting Books' };

export default function BooksPage() {
  return <BooksList />;
}
