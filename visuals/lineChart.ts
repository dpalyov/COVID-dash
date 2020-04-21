import {select, selectAll, create, scaleLinear, max} from 'd3';
import { MutableRefObject } from 'react';

export default () => {

    const data = [5, 8, 23, 32, 11];

    const chart = select('body')
    .attr("height", "300px")
    .attr("width", "420px")

    const x = scaleLinear()
    .domain([0, max(data)])
    .range([0, 420])

    chart
        .enter()
        .data(data)
        .join("div")
            .style("background-color", "black")
            .style("color", "white")
            .style("width", d => `${x(d)}px`)
            .style("margin", '2px')
            .style("padding", '3px')
            .style("text-align", "right")
            .text(d => d)

    return chart.node();
}   

