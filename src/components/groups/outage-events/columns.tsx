"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/header";
import Link from "next/link";
//import OptionsDropdown from "./options-dropdown";
import { OutageEvent } from "@prisma/client";

/**
 * Helper function to format duration in a human-readable way.
 * @param durationInSeconds - Duration in seconds.
 * @returns Formatted duration string.
 */
function formatDuration(durationInSeconds: number): string {
  if (durationInSeconds < 60) {
    return `${durationInSeconds} second${durationInSeconds !== 1 ? 's' : ''}`;
  } else if (durationInSeconds < 3600) {
    const minutes = Math.floor(durationInSeconds / 60);
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else if (durationInSeconds < 86400) { // less than a day
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    return `${hours} hora${hours !== 1 ? 's' : ''} y ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(durationInSeconds / 86400);
    return `approx ${days} día${days !== 1 ? 's' : ''}`;
  }
}

export const columns: ColumnDef<OutageEvent>[] = [
  {
    accessorKey: "deviceId",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Monitor ID" />;
    },
    cell: ({ row }) => {
      const deviceId: string = row.getValue("deviceId");
      return (
        <Button asChild size="sm" variant="outline">
          <p>{deviceId}</p>
        </Button>
      );
    },
  },
  {
    // Removed the original duration accessor
    id: "duration",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Duración" />;
    },
    cell: ({ row }) => {
      const startTime: Date = row.getValue("startTime");
      const endTime: Date = row.getValue("endTime");

      // Calculate duration in seconds
      const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Format duration
      const formattedDuration = formatDuration(durationInSeconds);

      return <p className="text-xs">{formattedDuration}</p>;
    },
  },
  {
    accessorKey: "startTime",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Fecha Comienzo" />;
    },
    cell: ({ row }) => {
      const createdAt: Date = row.getValue("startTime");
      const date = new Date(createdAt);
      return (
        <p className="text-xs">
          {date.toLocaleString("es-VE", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </p>
      );
    },
  },
  {
    accessorKey: "endTime",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Fecha Finalización" />;
    },
    cell: ({ row }) => {
      const createdAt: Date = row.getValue("endTime");
      const date = new Date(createdAt);
      return (
        <p className="text-xs">
          {date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </p>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Hora de registro del evento" />;
    },
    cell: ({ row }) => {
      const createdAt: Date = row.getValue("createdAt");
      const date = new Date(createdAt);
      return (
        <p className="text-xs">
          {date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </p>
      );
    },
  },
];
