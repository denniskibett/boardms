import { redirect } from 'next/navigation';

// The old Open Book page had no meeting attached; books now live under /books.
export default function OpenBookPage() {
  redirect('/books');
}
