"use client";
import { useParams } from 'next/navigation';
import { useMemoDetail } from '@/hooks/useMemo';
import Link from 'next/link';

export default function MemoDetailPage() {
  const params = useParams();
  const memoId = params.id as string;
  const { memo, loading, error } = useMemoDetail(memoId);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Error Loading Memo</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <Link
            href="/memos"
            className="mt-4 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Back to Memos
          </Link>
        </div>
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Memo Not Found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            The memo you're looking for doesn't exist.
          </p>
          <Link
            href="/memos"
            className="mt-4 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Back to Memos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {memo.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Originating from <strong>{memo.ministry_name}</strong> on {new Date(memo.created_at).toLocaleDateString()}
          </p>
        </div>
        <Link
          href="/memos"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Back to List
        </Link>
      </div>

      {/* Status and Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white">Status</h3>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2 ${
            memo.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            memo.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
            memo.status === 'approved' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {memo.status.charAt(0).toUpperCase() + memo.status.slice(1)}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white">Priority</h3>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2 ${
            memo.priority === 'low' ? 'bg-gray-100 text-gray-800' :
            memo.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
            memo.priority === 'high' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {memo.priority.charAt(0).toUpperCase() + memo.priority.slice(1)}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white">Type</h3>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2 bg-purple-100 text-purple-800">
            {memo.memo_type.charAt(0).toUpperCase() + memo.memo_type.slice(1)}
          </span>
        </div>
      </div>

      {/* Ministry/Department Info */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Submitting Entity
        </h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Ministry:</span> {memo.ministry_name} ({memo.ministry_acronym})
          </div>
          {memo.state_department_name && (
            <div>
              <span className="font-medium">State Department:</span> {memo.state_department_name}
            </div>
          )}
          {memo.agency_name && (
            <div>
              <span className="font-medium">Agency:</span> {memo.agency_name}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Executive Summary
        </h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {memo.summary}
        </p>
      </div>

      {/* Body Content */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Content
        </h2>
        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {memo.body}
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && memo.debug && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800">Debug Information</h3>
          <pre className="text-xs mt-2 text-yellow-700">
            {JSON.stringify(memo.debug, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}