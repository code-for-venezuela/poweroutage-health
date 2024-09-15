import { notFound } from "next/navigation";
import { PrismaClient, OutageEvent } from '@prisma/client'; // Ensure OutageEvent is imported
import { Breadcrumbs } from "@/components/parts/breadcrumbs";
import { Header } from "@/components/parts/header";
import { DataTable } from "@/components/groups/outage-events/data-table";
import { columns } from "@/components/groups/outage-events/columns";
import { PageWrapper } from "@/components/parts/page-wrapper";

const pageData = {
    name: "Logs Apagones",
    title: "Logs Apagones",
    description: "Información de los eventos de apagones por dispositivo",
};
const prisma = new PrismaClient();

export default async function Page() {
    let outageEventsData: OutageEvent[] = [];
    let outageEventsServerError = null;

    try {
        outageEventsData = await prisma.outageEvent.findMany();
    } catch (error) {
        outageEventsServerError = error;
    }

    // check for errors
    if (
        !outageEventsData ||
        outageEventsServerError
    ) {
        notFound();
    }

    return (
        <>
            <Breadcrumbs pageName={pageData?.name} />
            <PageWrapper>
                <Header title={pageData?.title}>{pageData?.description}</Header>
                <DataTable
                    columns={columns}
                    data={outageEventsData}
                />
            </PageWrapper>
        </>
    );
}
