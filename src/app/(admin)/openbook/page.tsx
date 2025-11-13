import OpenBook from '@/components/agenda/OpenBook';

export default function OpenBookPage() {
  return (
    <div className="h-screen"> {/* Ensure full height */}
      <OpenBook meetingId="current-meeting" />
    </div>
  );
}