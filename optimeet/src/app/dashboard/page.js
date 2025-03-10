import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route.js";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // If there's no session, redirect to login
    redirect("/login");
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome, {session.user.name}!</h1>
      <p>Your email: {session.user.email}</p>
      <p>Your time zone: {session.user.timeZone || "Not set"}</p>

      <form action="/api/auth/signout" method="POST">
        <button type="submit">Sign out</button>
      </form>
    </div>
  );
}
