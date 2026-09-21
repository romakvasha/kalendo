import { ClientShell } from "@/components/layout";

export default function ClientAppLayout({ children }: LayoutProps<"/app">) {
  return <ClientShell>{children}</ClientShell>;
}
