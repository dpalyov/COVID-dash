import React from "react";
import { Row, Badge, Col } from "react-bootstrap";
import styles from "../styles/GlobalStats.module.css";

interface GlobalStatsProps {
    data: object;
    colorScheme?: string[];
}

function GlobalStats<GlobalStatsProps>({
    data = {},
    colorScheme,
}) {
    const keys = Object.keys(data);
    if (colorScheme.length === 0) {
        keys.forEach((k) => {
            colorScheme.push("#b4b2b2");
        });
    }

    if (colorScheme.length < keys.length) {
        const diff = keys.length - colorScheme.length;
        for (let i = 0; i < diff; i++) {
            colorScheme.push("#b4b2b2");
        }
    }

    return (
        <div className={styles.container}>
            {keys.map((k, i) => (
                <div key={i}>
                    <span>{keys[i]}: </span>
                    <Badge as="span" style={{color: colorScheme[i]}}>
                        {data[k]}
                    </Badge>
                </div>
            ))}
        </div>
    );
}

export default GlobalStats;
