"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearBookingService, setBookingService } from "@/lib/booking-intent";

export default function ReserveLink({
  serviceId,
  className,
  children,
}: {
  serviceId?: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href="/rendez-vous"
      className={className}
      onClick={(e) => {
        if (serviceId) setBookingService(serviceId);
        else clearBookingService();
        if (window.location.pathname === "/rendez-vous") {
          e.preventDefault();
          router.replace("/rendez-vous");
        }
      }}
    >
      {children}
    </Link>
  );
}
