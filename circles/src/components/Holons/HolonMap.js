import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const HolonMap = ({ data }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        const width = 960;
        const height = 960;
        const format = d3.format(",d");
        const color = d3.scaleSequential([8, 0], d3.interpolateMagma);

        const pack = (data) =>
            d3.pack().size([width, height]).padding(3)(
                d3
                    .hierarchy(data)
                    .sum((d) => d.value)
                    .sort((a, b) => b.value - a.value)
            );

        const root = pack({
            name: "flare",
            children: data,
        });

        const svg = d3.select(svgRef.current).append("svg").attr("viewBox", [0, 0, width, height]).attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", "middle");

        const node = svg
            .selectAll("g")
            .data(d3.group(root.descendants(), (d) => d.height))
            .join("g")
            .attr("fill", (d) => color(d[0].height))
            .selectAll("g")
            .data((d) => d[1])
            .join("g")
            .attr("transform", (d) => `translate(${d.x + 1},${d.y + 1})`);

        node.append("circle")
            .attr("r", (d) => d.r)
            .attr("fill-opacity", 0.7)
            .attr("stroke", "#fff");

        node.filter((d) => !d.children)
            .append("text")
            .attr("dy", "0.3em")
            .text((d) => d.data.name.substring(0, d.r / 3));

        node.filter((d) => d.children)
            .selectAll("tspan")
            .data((d) => d.data.name.split(/(?=[A-Z][^A-Z])/g))
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
            .text((d) => d);

        svg.call(
            d3
                .zoom()
                .extent([
                    [0, 0],
                    [width, height],
                ])
                .scaleExtent([1, 8])
                .on("zoom", zoomed)
            // .on("wheel", function (e) {
            //     e.preventDefault();
            // })
        );

        function zoomed({ transform }) {
            svg.attr("transform", transform);
        }
    }, [data]);

    return <div ref={svgRef} />;
};

export default HolonMap;
