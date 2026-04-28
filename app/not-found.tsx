import Link from "next/link";
import { CalendarDays, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-6 animate-pulse-slow">
          <CalendarDays className="h-10 w-10 text-indigo-600" />
        </div>
        <p className="text-7xl font-bold text-gray-900 tracking-tight">404</p>
        <h1 className="text-2xl font-semibold text-gray-900 mt-4">Page not found</h1>
        <p className="text-gray-500 mt-2 mb-8">
          The page you&apos;re looking for has been rescheduled to nowhere.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
