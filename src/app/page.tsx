import styles from './page.module.css';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Head>
        <title>VEAC - Vigiliancia Energetica</title>
        <meta name="description" content="Vigilancia Energética y Activismo Comunitario" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.container}>
          <h1 className={styles.title}>VEAC</h1>
          <nav>
            <Link href="/device-statuses" className={styles.button}>
              Dashboard Operativo
            </Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={`${styles.section} ${styles.gridBackground}`}>
          <h2 className={styles.heading}>Bienvenido al servicio de Vigiliancia Energetica</h2>
          <p className={styles.subText}>La solución al seguimiento del estado de la energía en Venezuela.</p>

        </section>

        <section className={styles.linksSection}>
          <h3 className={styles.linksHeading}>Explore nuestros servicios</h3>
          <div className={styles.buttonsContainer}>
            <Link href="/device-statuses" className={styles.button}>
              Estado de Dispositivos
            </Link>
            <Link href="/outages" className={styles.button}>
              Cortes
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 Todos los derechos Reservados.</p>
      </footer>
    </div>
  );
}