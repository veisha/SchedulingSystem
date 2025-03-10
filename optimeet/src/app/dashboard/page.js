import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route.js';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div className="bg-white p-8 rounded shadow-md text-center w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Welcome, {session.user.name}!</h1>
        <p className="text-gray-700 mb-2">Your email: {session.user.email}</p>
        <p className="text-gray-700 mb-4">
          Your time zone: {session.user.timeZone || 'Not set'}
        </p>

        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
