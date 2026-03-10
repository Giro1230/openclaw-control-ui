import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn: Tailwind 클래스 병합 유틸 (shadcn 스타일)
 * 인자로 받은 클래스들을 충돌 없이 병합한다.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
