import React from "react";
import { Row, NavbarBrand } from "react-bootstrap";
import styles from "../styles/Header.module.css";

interface HeaderProps {
    lastUpdate?: number;
}

function Header<HeaderProps>({ lastUpdate }) {
    const date = new Date(lastUpdate);
    return (
        <header className={styles.header}>
            <Row noGutters className={styles.row}>
                <NavbarBrand href="/">
                    <h1>COVID19 Dashboard</h1>
                </NavbarBrand>
                <div>
                    <span>Last updated on: {date.toUTCString()}</span>
                </div>
            </Row>
        </header>
    );
}

export default Header;
