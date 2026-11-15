/** Ersatz für next/link und next/navigation in der Einzeldatei-Version: Navigation im Speicher. */
import { useSyncExternalStore, type AnchorHTMLAttributes, type ReactNode } from "react";

interface Loc {
  path: string;
  search: string;
  key: number;
}
let loc: Loc = { path: "/", search: "", key: 0 };
const subs = new Set<() => void>();
const parse = (href: string) => {
  const [p, q = ""] = href.split("#")[0].split("?");
  return { path: p || "/", search: q ? `?${q}` : "" };
};

export function navigate(href: string, remount = true) {
  loc = { ...parse(href), key: remount ? loc.key + 1 : loc.key };
  subs.forEach((f) => f());
  if (remount) window.scrollTo({ top: 0 });
  window.dispatchEvent(new Event("upl:nav"));
}
const w = window as unknown as Record<string, unknown>;
w.__uplSearch = () => loc.search;
w.__uplNav = (href: string) => navigate(href, false);

export const useLocation = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => loc);
export const usePathname = () => useLocation().path;
export const useRouter = () => ({ push: (h: string) => navigate(h), replace: (h: string) => navigate(h), back: () => navigate("/") });

export default function Link({ href, children, ...rest }: { href: string; children?: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  if (/^https?:/.test(href)) return <a href={href} {...rest}>{children}</a>;
  return (
    <a
      href="#"
      {...rest}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
