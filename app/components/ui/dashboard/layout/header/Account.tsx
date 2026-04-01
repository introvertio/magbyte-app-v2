"use client";
import { useGetProfile } from "@/app/components/hooks/user/useGetProfile";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { styles } from "@/app/components/styles/constants";
import Spinner from "../../../loaders/Spinner";
import { useTokenStore } from "@/app/components/stores/auth/useTokenStore";
import Button from "../../../input/Button";
import { useRouter } from "next/navigation";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

export default function Account() {
  const { data: user, isLoading, isError } = useGetProfile();
  const { token, logout } = useTokenStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.replace("/");
  }

  if (isLoading && token)
    return (
      <div className="size-[45px] flex items-center justify-center">
        <Spinner />
      </div>
    );

  if (isError || !user || !token) {
    return (
      <Link href={"/"} className={``}>
        <Button>
          <p>Sign in</p>
        </Button>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex flex-row gap-2 items-center justify-center ${styles.squish}`}
        aria-label="Account menu"
        aria-expanded={open}
      >
        <small className="select-none font-semibold text-xs md:text-sm">
          {`${user.first_name} ${user.last_name}`}
        </small>
        <img
          referrerPolicy="no-referrer"
          src={user.pfp as string}
          alt="user profile picture"
          className="object-cover size-10 rounded-full overflow-hidden ring-2 ring-primary"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {user.email}
            </p>
          </div>

          {/* Actions */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-red-600 font-medium hover:bg-red-50 transition-colors"
          >
            <ArrowRightStartOnRectangleIcon className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
