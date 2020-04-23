import React, { useRef, useEffect } from "react";
import {
    select,
    scaleLinear,
    scaleTime,
    extent,
    max,
    axisLeft,
    axisBottom,
    line,
    timeFormat,
    event,
} from "d3";
import styles from "../styles/LineChart.module.css";

export interface LineChartProps {
    id: string;
    width?: number;
    height?: number;
    scaleColor?: string;
    strokeColor?: string;
    dotColor?: string;
    strokeWidth?: number;
    labelX: string;
    labelY: string;
    tooltipLabel?: string;
    data: TimeSeries[];
}

export interface TimeSeries {
    country: string;
    category: string;
    date: number;
    value: number;
    supporting?: any | undefined;
}

interface MutatedSeries {
    date: Date;
    value: number;
    supporting?: any | undefined;
    country: string;
}

export default function LineChart({
    id,
    width = 250,
    height = 200,
    scaleColor = "black",
    strokeColor = "blue",
    dotColor = "white",
    strokeWidth = 1.5,
    labelX,
    labelY,
    tooltipLabel,
    data = [],
}: LineChartProps) {
    const node = useRef(null);

    useEffect(() => {
        const primarySeries: MutatedSeries[] = data
            .map((d: TimeSeries) => {
                return {
                    ...d,
                    date: new Date(d.date),
                };
            })
            .filter((d) => d.value !== 0);

        const margins = { top: 0, bottom: 80, left: 80, right: 40 };
        const cleanH = height - margins.bottom - margins.top;
        const cleanW = width - margins.left - margins.right - 2 * strokeWidth;

        const container = select(node.current);
        const svg = container
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margins.left},0)`);

        const grp = svg
            .append("g")
            .attr(
                "transform",
                `translate(-${margins.left - strokeWidth},-${margins.top})`
            );

        const tooltip = select("body")
            .append("div")
            .attr("class", styles.tooltip);

        const xPrimary = scaleTime()
            .domain(extent(primarySeries, (d) => d.date))
            .range([0, cleanW]);

        const yPrimary = scaleLinear()
            .domain([0, max(primarySeries, (d) => d.value + d.value * 0.5)])
            .range([cleanH, 0]);

        // gridlines in y axis function
        const make_y_gridlines = () => {
            return axisLeft(yPrimary).ticks(5);
        };

        svg.append("g")
            .attr("class", styles.grid)
            .call(make_y_gridlines().tickSize(-cleanW));

        //add Y scale
        svg.append("g").attr("color", scaleColor).call(axisLeft(yPrimary));

        //add x Scale
        svg.append("g")
            .attr("transform", `translate(0,${cleanH})`)
            .attr("color", scaleColor)
            .call(axisBottom(xPrimary).tickFormat(timeFormat("%B-%d")))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("color", scaleColor)
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        //label x
        svg.append("text")
            .attr("fill", scaleColor)
            .attr("dx", width / 3)
            .attr("dy", height)
            .attr("font-size", "18")
            .text(labelX);

        //label Y
        svg.append("text")
            .attr("fill", scaleColor)
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margins.left)
            .attr("x", 0 - cleanH / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("font-size", 18)
            .text(labelY);

        //delcare a line object
        const primaryLine = line<MutatedSeries>()
            .x((d: MutatedSeries) => xPrimary(d.date))
            .y((d: MutatedSeries) => yPrimary(d.value));

        //append primary line
        grp.append("path")
            .attr("transform", `translate(${margins.left},0)`)
            .datum(primarySeries)
            .attr("fill", "none")
            .attr("stroke", strokeColor)
            .attr("stroke-width", strokeWidth)
            .attr("d", primaryLine);

        //add dots primary
        grp.selectAll("dot")
            .data(primarySeries)
            .enter()
            .append("circle")
            .attr("class", styles.circle)
            .attr("transform", `translate(${margins.left},0)`)
            .attr("cx", (d) => xPrimary(d.date))
            .attr("cy", (d) => yPrimary(d.value))
            .attr("fill", dotColor)
            .on("mouseover", (d) => {
                tooltip.style("display", "inline-block");
                // tooltip.style("opacity", 0.9)
                tooltip
                    .html(
                        `<span style="text-align:left">${timeFormat("%B-%d")(
                            d.date
                        )}</span>
                            <br/>
                        <span style="color:black">${labelY}:${d.value}</span>
                        <br/>
                    ${
                        d.supporting ?
                        `<span style="color:grey">${tooltipLabel}:${d.supporting}</span>` : ""
                    }`
                    )
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", (d) => {
                tooltip.style("display", "none");
            });

        return () => {
            container.selectAll("*").remove();
            tooltip.remove();
        };
    }, [data, dotColor, scaleColor, strokeColor, strokeWidth, width, height]);

    return <div ref={node} id={id} className={styles.chart}></div>;
}
