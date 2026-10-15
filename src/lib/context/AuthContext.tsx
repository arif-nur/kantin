"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/client";
import { UserProfile, UserRole } from "@/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isPemesan: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: {
    nama: string;
    email: string;
    password: string;
    noTlp: string;
    alamat: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Clear any previous legacy demo user session from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_user");
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              setUserProfile(userSnap.data() as UserProfile);
            } else {
              // Create profile if doc doesn't exist yet
              const newProfile: UserProfile = {
                uid: currentUser.uid,
                kodePemesan: `P${Math.floor(100 + Math.random() * 900)}`,
                namaPemesan: currentUser.displayName || currentUser.email?.split("@")[0] || "Pengguna",
                noTlp: "-",
                alamatPemesan: "-",
                email: currentUser.email || "",
                role: "pemesan",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, newProfile).catch(() => {});
              setUserProfile(newProfile);
            }
          } catch (err) {
            console.error("Gagal memuat profil pengguna dari Firestore:", err);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase Auth listener error:", err);
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, "users", cred.user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        setUserProfile(profile);
        return profile;
      } else {
        const fallback: UserProfile = {
          uid: cred.user.uid,
          kodePemesan: `P${Math.floor(100 + Math.random() * 900)}`,
          namaPemesan: cred.user.displayName || email.split("@")[0],
          noTlp: "-",
          alamatPemesan: "-",
          email,
          role: "pemesan",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, fallback).catch(() => {});
        setUserProfile(fallback);
        return fallback;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    nama: string;
    email: string;
    password: string;
    noTlp: string;
    alamat: string;
  }): Promise<UserProfile> => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const kodePemesan = `P${randomSeq}`;

      const newProfile: UserProfile = {
        uid: cred.user.uid,
        kodePemesan,
        namaPemesan: data.nama,
        noTlp: data.noTlp,
        alamatPemesan: data.alamat,
        email: data.email,
        role: "pemesan", // Role bawaan adalah pemesan
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", cred.user.uid), newProfile);
      setUserProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      console.error("Register error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_user");
    }
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error("Logout error", e);
    }
    setUser(null);
    setUserProfile(null);
    router.push("/login");
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("Pengguna belum login");
    try {
      const userDocRef = doc(db, "users", user.uid);
      const updatePayload: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      delete updatePayload.uid;
      delete updatePayload.role;
      await updateDoc(userDocRef, updatePayload);
      setUserProfile((prev) => (prev ? { ...prev, ...data, updatedAt: new Date().toISOString() } : null));
    } catch (err: any) {
      console.error("Gagal update profil pengguna:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin: userProfile?.role === "admin",
        isPemesan: userProfile?.role === "pemesan",
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
