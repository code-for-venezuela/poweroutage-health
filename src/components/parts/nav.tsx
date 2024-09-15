// Component Imports
import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "@/components/parts/mode-toggle";

// Image Imports
import Logo from "../../../public/logo.svg";

// Icon Imports
import { BarChart, Logs, Router } from "lucide-react";

const links = [
  { href: "/", text: "Dashboard", icon: BarChart },
  { href: "/device-statuses", text: "Monitores", icon: Router },
  { href: "/outage-events", text: "Logs Apagones", icon: Logs },
];
export default function Nav() {
  return (
    <nav className="p-4 flex flex-col gap-4 justify-between h-screen">
      <Link
        href="/"
        className="border bg-muted/50 flex items-center gap-2 rounded-lg p-6"
      >
        <Image
          className="dark:invert -mt-px mb-px"
          src={Logo}
          width={100}
          height={18.53}
          alt="Router.so Wordmark"
        />
      </Link>
      <div className="border bg-muted/50 rounded-lg flex flex-col justify-between p-6 h-full">
        <div className="flex flex-col gap-8">
          <div className="grid gap-2">
            {links.map((link) => (
              <NavLink key={link.href} icon={link.icon} href={link.href}>
                {link.text}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center gap-2">
              <ModeToggle />
              <p className="text-xs text-muted-foreground opacity-50">
                © veac, 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

const NavLink = ({ href, children, icon: Icon }: NavLinkProps) => {
  return (
    <Link
      className="flex items-center gap-2 group p-2 rounded-md -ml-2 transition-all"
      href={href}
    >
      <Icon
        className="text-muted-foreground group-hover:text-foreground transition-all"
        size={20}
      />
      {children}
    </Link>
  );
};
