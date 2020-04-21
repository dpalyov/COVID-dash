import React from "react";
import { Row, NavbarBrand } from "react-bootstrap";
import styles from "../styles/Header.module.css";

function Header() {
    return (
        <header className={styles.header}>
            <Row noGutters>
                <NavbarBrand href="/">
                    <h1>COVID19 Dashboard</h1>
                </NavbarBrand>
            </Row>
        </header>
    );
}

export default Header;
