'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import colors from "@/lib/colors";
import { isAuthenticated, getUser, logout, isAdmin } from "@/lib/auth";
import Button from "./Button";

export default function Navigation() {
  const router = useRouter();
  }
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
