"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import "./Sidebar.module.css"; // adjust path depending on your folder structure


const Sidebar = () => {
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({
      callbackUrl: "/login",
    });
  };

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="sidebar__logo-container">
        <h2 className="sidebar__logo-text">Optimeet</h2>
      </div>

      {/* Profile Section */}
      <div className="sidebar__profile-container">
        <p className="sidebar__welcome-text">Welcome, {session?.user?.name || "?"}</p>
        {/* Example avatar (optional) */}
        {/* <img className="sidebar__avatar" src={session?.user?.image || "/default-avatar.png"} alt="User Avatar" /> */}
      </div>

      {/* Navigation Section */}
      <nav className="sidebar__nav-container">
        <ul className="sidebar__nav-list">
          <li className="sidebar__nav-item">
            <Link href="/dashboard" className="sidebar__nav-link">
               Dashboard
            </Link>
            {/* <p className="sidebar__nav-desc">Quick stats: upcoming meetings</p> */}
          </li>

          <li className="sidebar__nav-item">
            <Link href="/meetings" className="sidebar__nav-link">
               My Meetings
            </Link>
            {/* <p className="sidebar__nav-desc">List of meetings/events you created or joined</p> */}
          </li>

          <li className="sidebar__nav-item">
            <Link href="/meetings/create" className="sidebar__nav-link">
               Create Meeting
            </Link>
            {/* <p className="sidebar__nav-desc">Start a new meeting / schedule</p> */}
          </li>

          <li className="sidebar__nav-item">
            <Link href="/invitations" className="sidebar__nav-link">
               Invitations
            </Link>
            {/* <p className="sidebar__nav-desc">Manage invites, pending requests</p> */}
          </li>

          <li className="sidebar__nav-item">
            <Link href="/settings" className="sidebar__nav-link">
               Settings
            </Link>
            {/* <p className="sidebar__nav-desc">Preferences: notifications, timezones, profile</p> */}
          </li>
        </ul>
      </nav>

      {/* Logout Button Section */}
      <div className="sidebar__logout-container">
        <button onClick={handleLogout} className="sidebar__logout-button">
           Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
