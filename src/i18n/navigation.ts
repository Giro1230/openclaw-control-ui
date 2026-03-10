import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/**
 * next-intl 로케일 인식 Link, useRouter, usePathname (나라별 언어 전환용)
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
