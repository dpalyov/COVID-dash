import React, { useRef, useEffect, ReactNode } from "react";
import  {
    select,
    scaleLinear,
    max,
    axisLeft,
    axisTop,
    scaleOrdinal,
    stack,
    scaleBand,
    ScaleLinear,
    Series,
    ScaleBand,
    ScaleOrdinal,
    schemeYlOrRd,
    event,
    axisBottom,
    selectAll,
} from "d3";
import styles from "../styles/BarChart.module.css";

export interface BarChartData {
    label: string;
    props: {
        cases: number;
        todayCases: number;
        deaths: number;
        recovered: number;
        active: number;
        critical: number;
        casesPerOneMillion: number;
        deathsPerOneMillion: number;
        tests: number;
        testsPerOneMillion: number;
    }
}

export interface BarChartProps {
    id: string;
    textColor?: string;
    textAlign?: string;
    chartTitle: string;
    colorScheme?: readonly (readonly string[])[];
    xAxisTop?: boolean;
    verticalOrientation?: boolean;
    data: BarChartData[];
}

export default function BarChart<BarChartProps>({
    id,
    textColor = "white",
    chartTitle,
    colorScheme = schemeYlOrRd,
    xAxisTop = true,
    verticalOrientation = true,
    data,
}) {
    const node = useRef(null);
    const maxLabel: number = Math.max(...data.map((d: BarChartData) => d.label.length))
    const margins = { top: 80, right: 80, bottom: 80, left: maxLabel > 15 ? 120 : 80 };
    const height = 600;
    const width = 600;

    const transform = (data: BarChartData[]): any[] => {
        const transformedData: any[] = [];
        const labels = new Set(data.map((d: BarChartData) => d.label));
        data.forEach((d: BarChartData) => {
            if (labels.has(d.label)) {
                const keys = Object.keys(d.props);
                const transformed = {};
                keys.forEach((k) => {
                    transformed[k] = d.props[k];
                });

                labels.delete(d.label);
                transformedData.push({
                    label: d.label,
                    ...transformed,
                });
            }
        });
        return transformedData;  
        
    };

    const buildChart = (
        node: React.MutableRefObject<any>,
        width: number,
        height: number,
        chartTitle: string,
        xScale: ScaleLinear<number, number>,
        yScale: ScaleBand<string>,
        colorScale: ScaleOrdinal<string, any>,
        stack: Series<{ [key: string]: number }, string>[]
    ) => {
        const container = select(node.current);
        const defaultScheme = ["grey", "steelblue"];

        const toolTip = select("body").append("div").attr("class", styles.tooltip);

        const svg = container
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`);
        
        svg.append("g")
        .attr("class", "title")
        .append("text")
        .attr("x", (width/2) - chartTitle.length * 4)
        .attr("y", 15)
        .style("font-size", "2rem")
        .style("fill", textColor)
        .text(chartTitle)

        const groups = svg.append("g")
            .selectAll("g")
            .data(stack)
            .join("g")
            .attr("class", id)
            .attr("fill", (d,i) => colorScale ? colorScale(d.key): defaultScheme[i])
   
            groups.filter((e,i) => {
                return i === document.getElementsByClassName(id).length - 1})
             .selectAll("text")
            .data(d => d)
            .join("text")
            .attr("x", d => verticalOrientation ? xScale(d[1]) + 2 :  yScale(d.data.label.toString()) + yScale.bandwidth() / 3)
            .attr("y", d => verticalOrientation ? yScale(d.data.label.toString()) + yScale.bandwidth() / 2 + 5 : xScale(d[1]) - 5)
            .attr("fill", textColor)
            .attr("font-size", "1rem")
            .text(d => verticalOrientation ? ` -${d[1]}` : `${d[1]}`);

            groups.selectAll("rect")
            .data((d) => d)
            .join("rect")
            .attr("class", styles.rect)
            .attr("x", (d) => verticalOrientation ? xScale(d[0]) : yScale(d.data.label.toString()))
            .attr("y", (d) => verticalOrientation ? yScale(d.data.label.toString()) : xScale(d[1]))
            .attr("width",  (d) => verticalOrientation ? xScale(d[1]) - xScale(d[0]) : yScale.bandwidth())
            .attr("height", d => verticalOrientation ? yScale.bandwidth() : xScale(d[0]) - xScale(d[1]))
            .on("mousemove", d => {
                toolTip.style("left", event.pageX+10+"px")
                toolTip.style("top", event.pageY-25+"px");
                toolTip.style("display", "inline-block");
                toolTip.html(`${d["key"]} - ${d[1] - d[0]}`);
            })
            .on("mouseleave", d => {
                toolTip.style("display", "none");
            });

            // .text((d) => `${d.data.label} ${d["key"]}\n${d.data[d["key"]]}`)
         
        const buildLinearScale = () => {
            if(xAxisTop && verticalOrientation){
                return  svg.append("g")
                .attr("transform", `translate(0, ${margins.top})`)
                .attr("color", textColor)
                .call(axisTop(xScale).ticks(null, "s"));
            }
            else if(!xAxisTop && verticalOrientation){
                return  svg.append("g")
                .attr("transform", `translate(0, ${height - margins.bottom})`)
                .attr("color", textColor)
                .call(axisBottom(xScale).ticks(null,"s"))
            }
            else if(!verticalOrientation){
                return svg.append("g")
                .attr("transform", `translate(${margins.left}, 0)`)
                .attr("color", textColor)
                .call(axisLeft(xScale).ticks(null, "s"))
            }

        } 
        
        const buildBandScale = () => {
            if(verticalOrientation){
                return   svg.append("g")
                .attr("transform", `translate(${margins.left }, 0)`)
                .attr("color", textColor)
                .call(axisLeft(yScale).tickPadding(4).tickSizeOuter(0))
            }
            else {
                return svg.append("g")
                .attr("transform", `translate(0, ${height - margins.top})`)
                .attr("color", textColor)
                .call(axisBottom(yScale).tickPadding(4).tickSizeOuter(0))
            }
        }
          
            //x axis
            buildLinearScale()
            .selectAll("text")
            .attr("color", textColor)
            .call(g => g.selectAll(".domain").remove());


            //y axis
            buildBandScale()
            .selectAll("text")
            .attr("color", textColor)
            .call(g => g.selectAll(".domain").remove());

            return svg;

        
    };

    const buildLegend = (node: React.MutableRefObject<any>,labels: string[], colorScale: ScaleOrdinal<string, any>) => {

      
        const container = select(node.current);
        const svg = container.append("svg");
        const size = 20;

        svg.selectAll("mydots")
        .data(labels)
        .enter()
        .append("rect")
          .attr("x", 50)
          .attr("y", function(d,i){ return 50 + i*(size+5)})
          .attr("width", size)
          .attr("height", size)
          .style("fill", function(d){ return colorScale(d)})
      
        svg.selectAll("mylabels")
        .data(labels)
        .enter()
        .append("text")
          .attr("x", 50 + size*1.2)
          .attr("y", function(d,i){ return 50 + i*(size+5) + (size/2)}) 
          .style("fill", function(d){ return colorScale(d)})
          .text(function(d){ return d})
          .attr("text-anchor", "left")
          .style("font-size", "1.25rem")
          .style("alignment-baseline", "middle")


    }

    useEffect(() => {
        if (data.length !== 0) {
            const transformedData = transform(data);
            const keys = Object.keys(transformedData[0]).slice(1);
            const stackedData = stack()
                .keys(keys)(transformedData)
                .map((d) => (d.forEach((v) => {
                    v["key"] = d.key;
                }
                ), d));


            const colorScale = scaleOrdinal()
                .domain(stackedData.map((d) => d.key))
                .range(colorScheme.length === 1 ? colorScheme[0] : colorScheme[stackedData.length])
                .unknown("#ccc");

            const bandScale = scaleBand()
                .domain(transformedData.map((d) => d.label))
                .range(verticalOrientation ? [margins.top, height - margins.bottom] : [margins.left, width - margins.bottom])
                .padding(0.1)

            const linearScale = scaleLinear()
                .domain(verticalOrientation ? [0, max(stackedData, d=> max(d, d => d[1]))] : [max(stackedData, d=> max(d, d => d[1])), 0] )
                .rangeRound(verticalOrientation ? [margins.left, width - margins.right] : [margins.bottom, height - margins.top]);

            buildLegend(node, stackedData.map(d => d.key), colorScale)
            buildChart(node, width, height, chartTitle, linearScale, bandScale, colorScale, stackedData)

        }

        return () => {
            select(node.current).selectAll("*").remove();
            select("body").selectAll(styles.tooltip).remove();
        }
    }, [data]);


    return <div ref={node} className={styles.chart}></div>;
}
