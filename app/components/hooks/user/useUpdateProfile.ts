"use client";

import { useMutation } from "@tanstack/react-query";
import {
  updateUserProfile,
  UpdateUserProfileBody,
  UpdateUserProfileSuccess,
} from "@/lib/api/user/update-profile";
import { useTokenStore } from "@/app/components/stores/auth/useTokenStore";

export function useUpdateProfile() {
  const token = useTokenStore((state) => state.token);

  return useMutation<
    UpdateUserProfileSuccess,
    Error,
    UpdateUserProfileBody
  >({
    mutationFn: (data: UpdateUserProfileBody) => {
      if (!token) {
        throw new Error("Token is required");
      }
      return updateUserProfile(token, data);
    },
  });
}

