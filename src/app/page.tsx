"use client"
import { Breadcrumbs } from '@/components/parts/breadcrumbs';
import { PageWrapper } from '@/components/parts/page-wrapper';
import { Header } from '@/components/parts/header';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const pageData = {
  name: "VEAC",
  title: "VEAC - Vigiliancia Energetica",
  description: "Vigilancia Energética y Activismo Comunitario",
};

const Map = dynamic(() => import('../components/Map'), {
  ssr: false, // Disable server-side rendering for this import
});

export default function Home() {
  return (
    <>
      <Breadcrumbs pageName={pageData?.name} />
      <PageWrapper>
        <Header title={pageData?.title}>{pageData?.description}</Header>
        <Map />
      </PageWrapper>
    </>

  );
}