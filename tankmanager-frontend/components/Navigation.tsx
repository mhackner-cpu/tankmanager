"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import colors from "@/lib/colors";
import { isAuthenticated, getUser, logout, isAdmin } from "@/lib/auth";
import Button from "./Button";

export default function Navigation() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    if (isAuthenticated()) {
      setUser(getUser());
    } else {
      setUser(null);
    }
  }, []);

  function handleLogout() {
    logout();
    setShowDropdown(false);
    setShowMobileMenu(false);
    setUser(null);
    setLoggedIn(false);
    router.push("/auth/login");
  }

  function canAccessSystemSettings() {
    return isAdmin();
  }

  const navItems = [
    { label: "Maschinen", href: "/machines" },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    }
    if (showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileMenu]);

  return (
    <nav style={{ width: "100%", background: "#fff", borderBottom: `1px solid ${colors.neutral[200]}`, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 22, color: colors.primary, textDecoration: "none" }}>TankManager</Link>
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ color: colors.black, textDecoration: "none", fontWeight: 500, fontSize: 16, padding: "8px 12px", borderRadius: 6, transition: "background 0.2s" }}>{item.label}</Link>
          ))}
        </div>
        <div className="desktop-user" style={{ position: "relative", marginLeft: 16 }}>
          {loggedIn && user ? (
            <>
              <Button onClick={() => setShowDropdown((v) => !v)} style={{ minWidth: 48, minHeight: 48, borderRadius: 24, fontWeight: 600, fontSize: 16 }}>
                👤 {user.firstName}
              </Button>
              {showDropdown && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, backgroundColor: "white", border: `2px solid ${colors.neutral[300]}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", minWidth: 220, zIndex: 1000 }}>
                  {canAccessSystemSettings() && (
                    <Link href="/admin" onClick={() => setShowDropdown(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, textDecoration: "none", color: colors.black, fontSize: 16, borderBottom: `1px solid ${colors.neutral[200]}` }}><span>⚙️</span> <span>Systemverwaltung</span></Link>
                  )}
                  <Link href="/profile" onClick={() => setShowDropdown(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, textDecoration: "none", color: colors.black, fontSize: 16, borderBottom: `1px solid ${colors.neutral[200]}` }}><span>👤</span> <span>Profil bearbeiten</span></Link>
                  <Link href="/profile/password" onClick={() => setShowDropdown(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, textDecoration: "none", color: colors.black, fontSize: 16, borderBottom: `1px solid ${colors.neutral[200]}` }}><span>🔒</span> <span>Passwort ändern</span></Link>
                  <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 16, textAlign: "left", backgroundColor: "transparent", border: "none", cursor: "pointer", color: colors.error, fontSize: 16, fontWeight: 500 }}><span>🚪</span> <span>Logout</span></button>
                </div>
              )}
            </>
          ) : (
            <Link href="/auth/login" style={{ textDecoration: "none", padding: "12px 20px", borderRadius: 8, background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", color: "white", fontWeight: 600, fontSize: 16, border: "2px solid transparent", transition: "all 0.3s ease", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 6px rgba(0,0,0,0.1)", minHeight: 48, whiteSpace: "nowrap" }}><span>Login</span></Link>
          )}
        </div>
        <button className="mobile-menu-button" style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", display: "none" }} onClick={() => setShowMobileMenu((v) => !v)}>
          ☰
        </button>
      </div>
      {/* Mobile Menu Overlay */}
      {showMobileMenu && loggedIn && user && (
        <div ref={mobileMenuRef} style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, backgroundColor: "white", zIndex: 999, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }} className="mobile-menu">
          {/* User Info */}
          <div style={{ padding: 16, backgroundColor: colors.neutral[100], borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: colors.black, marginBottom: 4 }}>
              👤 {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: 14, color: colors.neutral[600] }}>{user.email}</div>
          </div>
          {/* Navigation Items */}
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} style={{ textDecoration: "none", color: colors.black, fontWeight: 600, fontSize: 16, padding: 16, borderRadius: 8, backgroundColor: "rgba(144, 238, 144, 0.3)", border: "2px solid rgba(144, 238, 144, 0.5)", display: "flex", alignItems: "center", minHeight: 56 }}>{item.label}</Link>
          ))}
          {canAccessSystemSettings() && (
            <Link href="/admin" onClick={() => setShowMobileMenu(false)} style={{ textDecoration: "none", color: colors.black, fontWeight: 600, fontSize: 16, padding: 16, borderRadius: 8, backgroundColor: colors.neutral[200], display: "flex", alignItems: "center", gap: 12 }}><span>⚙️</span> <span>Systemverwaltung</span></Link>
          )}
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 16, textAlign: "left", backgroundColor: "transparent", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, minHeight: 56, marginTop: 16 }}><span>🚪</span> <span>Logout</span></button>
        </div>
      )}
      {/* CSS for Media Queries */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav,
          .desktop-user {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-user {
            display: block !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
