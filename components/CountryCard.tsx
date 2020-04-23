import React, { ReactNode } from "react";
import { Card, ListGroup, ListGroupItem } from "react-bootstrap";
import styles from "../styles/CountryCard.module.css";

interface CountryProps {
    className?: string;
    title: string;
    gdp?: number;
    updated?: number;
    image: string;
    labelColor?: string;
    data: {};
    components?: ReactNode[];
}

function CountryCard({
    className,
    title,
    updated,
    gdp,
    image,
    labelColor = "grey",
    data,
    components,
}: CountryProps) {
    const renderList = () => {
        const labels = Object.keys(data);

        return labels.map((l, i) => {
            return (
                <ListGroupItem className={styles.li} key={i}>
                    <div className={styles.flip}>
                        <div className={styles.flipInner}>
                            <div className={styles.flipFront}>
                                <label className={styles.liLabel} htmlFor={l}>
                                    {l.charAt(0).toUpperCase() + l.slice(1)}
                                </label>
                                <span className={styles.liText} id={l}>
                                    {data[l].abs}
                                </span>
                            </div>
                            <div className={styles.flipBack}>
                                <label
                                    className={styles.liLabel}
                                    htmlFor="new-since-yesterday"
                                >
                                   {l.charAt(0).toUpperCase() + l.slice(1) + "%"}
                                </label>
                                <span
                                    className={styles.liText}
                                    id="new-since-yesterday"
                                >
                                    {data[l].rel + "%"}
                                </span>
                            </div>
                        </div>
                    </div>
                </ListGroupItem>
            );
        });
    };

    const classes = [styles.card].concat(className);

    return (
        <Card className={classes.join(" ")}>
            <Card.Header className={styles.header}>
                <Card.Title className={styles.title}>{title}</Card.Title>
                <Card.Subtitle
                    className={styles.subtitle}
                >{`Updated on: ${new Date(
                    updated
                ).toDateString()}`}</Card.Subtitle>
            </Card.Header>
            <Card.Img className={styles.img} variant="top" src={image} />
            <ListGroup className={styles.ul}>{renderList()}</ListGroup>
            {components.map((c, i) => c)}
        </Card>
    );
}

export default CountryCard;
