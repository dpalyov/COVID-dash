import React from 'react';
import styles from '../styles/Footer.module.css';

function Footer() {
    return (
        <footer className={styles.footer}>
            <section className={styles.resources}>
                <h2>Resources</h2>
                <div>
                    <div className={styles.item}><span><b>COVID data: </b><a href="https://corona.lmao.ninja/">NOVELCovid/API </a></span></div>
                    <div className={styles.item}><span><b>Polygons geo data: </b><a  href="https://geojson-maps.ash.ms/">Geojson maps</a></span></div>
                </div>
            </section>
            <section className={styles.imageSection}>
                <div className={styles.img} />
            </section>
        </footer>
    )
}

export default Footer
