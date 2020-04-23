import React, { ReactNode } from "react";
import { Container, Row } from "react-bootstrap";
import Footer from "./Footer";
import Header from "./Header";
import Head from "next/head";

export interface LayoutProps {
    children: ReactNode[];
}

function Layout<LayoutProps>({ children }) {
    return (
        <>
        <Head>
                <title>COVID-19 Dash</title>
                <link rel="icon" href="/favicon.png" />
                <link
                    href="https://api.mapbox.com/mapbox-gl-js/v1.9.0/mapbox-gl.css"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.4.2/mapbox-gl-geocoder.css"
                    type="text/css"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,500;0,700;1,400&display=swap"
                    rel="stylesheet"
                />
            </Head>
           
            <Header />
            <Container id="layout-container">
                <Row>{children}</Row>
            </Container>
            <Footer />
        </>
    );
}

export default Layout;
