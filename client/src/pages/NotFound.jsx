import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <SearchX className="w-16 h-16 text-gray-300" />
      <h1 className="text-5xl font-extrabold text-gray-900">404</h1>
      <p className="text-xl font-semibold text-gray-700">Page not found</p>
      <p className="text-sm text-gray-500 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
