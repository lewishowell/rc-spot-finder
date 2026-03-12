import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <img src="/logo-mobile.svg" alt="RC Spot Finder" className="h-16 mb-6" />
      <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
      <p className="text-lg text-gray-500 mb-6">
        This spot doesn&apos;t exist... yet.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        Back to the Map
      </Link>
    </div>
  );
}
