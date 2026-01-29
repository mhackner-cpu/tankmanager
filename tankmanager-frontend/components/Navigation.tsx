'use client';

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
  const [mounted, setMounted] = useState(false);
  const [authState, setAuthState] = useState(0); // Force re-render on auth change
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Listen for auth changes
    const handleAuthChange = () => {
      setAuthState(prev => prev + 1);
    };
    
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  useEffect(() => {
    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: "Maschinen & Geräte", href: "/machines" },
    // Später:
    // { label: "Tankungen", href: "/fuel" },
    // { label: "Wartung", href: "/maintenance" },
    // { label: "UVV Prüfungen", href: "/uvv" },
    // { label: "Reparaturen", href: "/repairs" },
  ];

  // Prüfen ob User ADMIN oder MANAGEMENT Rolle hat
  const canAccessSystemSettings = () => {
    if (!isAuthenticated()) return false;
    const currentUser = getUser();
    if (!currentUser) return false;
    return currentUser.roles.includes('ADMIN') || currentUser.roles.includes('MANAGEMENT');
  };

  const handleLogout = () => {
    logout();
    setShowMobileMenu(false);
    setShowDropdown(false);
    router.push('/');
  };

  // Get auth state directly from localStorage
  const loggedIn = mounted && isAuthenticated();
  const user = mounted ? getUser() : null;

  return (
    <nav
      style={{
        backgroundColor: colors.primary,
        padding: "12px 16px", // Mobile-First: Reduziertes Padding
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // Mobile-First
        gap: "16px",
        borderBottom: `2px solid ${colors.primaryDark}`,
        minHeight: "60px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", fontWeight: 700, fontSize: "18px", color: colors.black, display: "flex", alignItems: "center", gap: "8px" }}>
        🚜 <span style={{ whiteSpace: "nowrap" }}>TankManager</span>
      </Link>

      {/* Desktop Navigation - Hidden on Mobile */}
      {loggedIn && (
        <div style={{ display: "none", gap: "12px", flex: 1 }} className="desktop-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration: "none",
                color: colors.black,
                fontWeight: 600,
                fontSize: "14px",
                padding: "10px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(144, 238, 144, 0.3)",
                border: "2px solid rgba(144, 238, 144, 0.5)",
                transition: "all 0.2s ease",
                display: "inline-block",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(144, 238, 144, 0.5)";
                e.currentTarget.style.borderColor = "rgba(144, 238, 144, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(144, 238, 144, 0.3)";
                e.currentTarget.style.borderColor = "rgba(144, 238, 144, 0.5)";
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Right Side */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {loggedIn && user ? (
          <>
            {/* Mobile Menu Button - Only on Mobile */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                backgroundColor: colors.primaryDark,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "24px",
              }}
              className="mobile-menu-button"
              aria-label="Menü"
            >
              {showMobileMenu ? '✕' : '☰'}
            </button>

            {/* Desktop User Dropdown - Hidden on Mobile */}
            <div ref={dropdownRef} style={{ position: "relative" }} className="desktop-user">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 16px",
                  backgroundColor: colors.primaryDark,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: colors.black,
                  fontSize: "16px",
                  fontWeight: 500,
                  minHeight: "48px",
                  whiteSpace: "nowrap",
                }}
              >
                <span>👤</span>
                <span>{user.firstName} {user.lastName}</span>
                <span style={{ fontSize: "12px" }}>{showDropdown ? '▲' : '▼'}</span>
              </button>

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    backgroundColor: "white",
                    border: `2px solid ${colors.neutral[300]}`,
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    minWidth: "220px",
                    zIndex: 1000,
                  }}
                >
                  {canAccessSystemSettings() && (
                    <Link
                      href="/admin"
                      onClick={() => setShowDropdown(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "16px",
                        textDecoration: "none",
                        color: colors.black,
                        fontSize: "16px",
                        borderBottom: `1px solid ${colors.neutral[200]}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.neutral[100];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span>⚙️</span> <span>Systemverwaltung</span>
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      textDecoration: "none",
                      color: colors.black,
                      fontSize: "16px",
                      borderBottom: `1px solid ${colors.neutral[200]}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.neutral[100];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span>👤</span> <span>Profil bearbeiten</span>
                  </Link>

                  <Link
                    href="/profile/password"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      textDecoration: "none",
                      color: colors.black,
                      fontSize: "16px",
                      borderBottom: `1px solid ${colors.neutral[200]}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.neutral[100];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span>🔒</span> <span>Passwort ändern</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      textAlign: "left",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: colors.error,
                      fontSize: "16px",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.neutral[100];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span>🚪</span> <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link 
            href="/auth/login"
            style={{
              textDecoration: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              color: "white",
              fontWeight: 600,
              fontSize: "16px",
              border: "2px solid transparent",
              transition: "all 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              minHeight: "48px",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
              e.currentTarget.style.background = "linear-gradient(135deg, #059669 0%, #2563eb 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              e.currentTarget.style.background = "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)";
            }}
          >
            <span>Login</span>
          </Link>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && loggedIn && user && (
        <div
          ref={mobileMenuRef}
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            zIndex: 999,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
          className="mobile-menu"
        >
          {/* User Info */}
          <div style={{
            padding: "16px",
            backgroundColor: colors.neutral[100],
            borderRadius: "8px",
            marginBottom: "16px",
          }}>
            <div style={{ fontSize: "18px", fontWeight: 600, color: colors.black, marginBottom: "4px" }}>
              👤 {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: "14px", color: colors.neutral[600] }}>
              {user.email}
            </div>
          </div>

          {/* Navigation Items */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowMobileMenu(false)}
              style={{
                textDecoration: "none",
                color: colors.black,
                fontWeight: 600,
                fontSize: "16px",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "rgba(144, 238, 144, 0.3)",
                border: "2px solid rgba(144, 238, 144, 0.5)",
                display: "flex",
                alignItems: "center",
                minHeight: "56px",
              }}
            >
              {item.label}
            </Link>
          ))}

          {canAccessSystemSettings() && (
            <Link
              href="/admin"
              onClick={() => setShowMobileMenu(false)}
              style={{
                textDecoration: "none",
                color: colors.black,
                fontWeight: 600,
                fontSize: "16px",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: colors.neutral[200],
                display: "flex",
                alignItems: "center",
                gap: "12px",
                minHeight: "56px",
              }}
            >
              <span>⚙️</span> <span>Systemverwaltung</span>
            </Link>
          )}

          <Link
            href="/profile"
            onClick={() => setShowMobileMenu(false)}
            style={{
              textDecoration: "none",
              color: colors.black,
              fontWeight: 600,
              fontSize: "16px",
              padding: "16px",
              borderRadius: "8px",
              backgroundColor: colors.neutral[200],
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minHeight: "56px",
            }}
          >
            <span>👤</span> <span>Profil bearbeiten</span>
          </Link>

          <Link
            href="/profile/password"
            onClick={() => setShowMobileMenu(false)}
            style={{
              textDecoration: "none",
              color: colors.black,
              fontWeight: 600,
              fontSize: "16px",
              padding: "16px",
              borderRadius: "8px",
              backgroundColor: colors.neutral[200],
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minHeight: "56px",
            }}
          >
            <span>🔒</span> <span>Passwort ändern</span>
          </Link>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              backgroundColor: colors.error,
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 600,
              minHeight: "56px",
              marginTop: "16px",
            }}
          >
            <span>🚪</span> <span>Logout</span>
          </button>
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
            >
              <span>👤</span>
              <span>{user.firstName} {user.lastName}</span>
              <span style={{ fontSize: "10px" }}>{showDropdown ? '▲' : '▼'}</span>
            </button>

            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  backgroundColor: "white",
                  border: `2px solid ${colors.neutral[300]}`,
                  borderRadius: "6px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  minWidth: "200px",
                  zIndex: 1000,
                }}
              >
                <Link
                  href="/profile"
                  onClick={() => setShowDropdown(false)}
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    textDecoration: "none",
                    color: colors.black,
                    fontSize: "14px",
                    borderBottom: `1px solid ${colors.neutral[200]}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  ⚙️ Profil bearbeiten
                </Link>

                <Link
                  href="/profile/password"
                  onClick={() => setShowDropdown(false)}
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    textDecoration: "none",
                    color: colors.black,
                    fontSize: "14px",
                    borderBottom: `1px solid ${colors.neutral[200]}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  🔒 Passwort ändern
                </Link>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: colors.error,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            href="/auth/login"
            style={{
              textDecoration: "none",
              padding: "10px 24px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              color: "white",
              fontWeight: 600,
              fontSize: "14px",
              border: "2px solid transparent",
              transition: "all 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
              e.currentTarget.style.background = "linear-gradient(135deg, #059669 0%, #2563eb 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              e.currentTarget.style.background = "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)";
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Login</span>
          </Link>
        )}
      </div>

      {/* CSS for Media Queries */}
      <style jsx>{`
        /* Mobile-First: Show hamburger, hide desktop elements */
        .mobile-menu-button {
          display: flex !important;
        }
        
        .desktop-nav,
        .desktop-user {
          display: none !important;
        }
        
        .mobile-menu {
          display: flex !important;
        }
        
        /* Desktop: Show desktop elements, hide mobile hamburger and menu */
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
