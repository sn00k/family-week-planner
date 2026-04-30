import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
          📅
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Familjekalendern
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Inloggad som {user?.displayName ?? user?.email}
        </p>
        <button
          onClick={() => signOut()}
          className="text-sm cursor-pointer text-gray-500 hover:text-gray-700 underline"
        >
          Logga ut
        </button>
      </div>
    </div>
  );
}
