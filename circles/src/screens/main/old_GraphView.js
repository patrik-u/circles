// #region imports
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, useNodesState, useEdgesState, addEdge, Handle, Position } from "reactflow";
import { Box } from "@chakra-ui/react";
import UserContext from "../../components/UserContext";
import { CirclePicture } from "../../components/CircleElements";
import "reactflow/dist/style.css";
import { ForceGraph3D } from "react-force-graph";
import CircleListItem from "../circle/old_CircleListItem";
// #endregion

// #region React Flow
const CircleNode = ({ data }) => {
    const handleStyle = { left: 10 };

    return (
        <>
            <Handle type="source" position={Position.Top} id="top" />
            <Handle type="source" position={Position.Bottom} id="bottom" />
            <Handle type="source" position={Position.Left} id="left" />
            <Handle type="source" position={Position.Right} id="right" />
            <Box>
                <CircleListItem item={data} width="435px" borderRadius="20px" />
            </Box>
        </>
    );
};

const SimpleCircleNode = ({ data }) => {
    const handleStyle = { left: 10 };

    return (
        <>
            <Handle type="source" position={Position.Top} id="top" />
            <Handle type="source" position={Position.Bottom} id="bottom" />
            <Handle type="source" position={Position.Left} id="left" />
            <Handle type="source" position={Position.Right} id="right" />
            <Box>
                <CirclePicture circle={data} size={30} hasPopover={true} />
            </Box>
        </>
    );
};

export const FlowGraph = ({ circle, circles, circleConnections }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState();
    const [edges, setEdges, onEdgesChange] = useEdgesState();
    const nodeTypes = useMemo(() => ({ circle: CircleNode, simpleCircle: SimpleCircleNode }), []);

    const user = useContext(UserContext);

    useEffect(() => {
        if (!circle) {
            setNodes([]);
            setEdges([]);
            return;
        }

        // console.log("connections = " + JSON.stringify(connections, null, 2));
        let newNodes = circles?.map((x, i) => {
            // TODO space circles out properly relative to each other
            //let position = getLngLatArray(x.base);
            return { id: x.id, position: { x: i * 10, y: i * 10 }, data: { label: x.name, ...x }, type: "simpleCircle" };
        });
        newNodes?.push({ id: circle.id, position: { x: 0, y: 0 }, data: { label: circle.name, ...circle }, type: "simpleCircle" });

        setNodes(newNodes);
        setEdges(
            circleConnections?.map((x) => {
                return { id: x.id, source: x.source.id, target: x.target.id, sourceHandle: "top", targetHandle: "bottom" };
            })
        );
    }, [circle, circles, circleConnections, setNodes, setEdges]);

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    return (
        <Box backgroundColor="#dfdfdf" width="100%" height="100%">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                connectionMode="loose"
            >
                <MiniMap />
                <Controls />
            </ReactFlow>
        </Box>
    );
};

// #endregion

// #region Force Graph
export const GraphView = ({ circle, circles, circleConnections }) => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });

    const genRandomTree = (N = 1000) => {
        return {
            nodes: [...Array(N).keys()].map((i) => ({
                id: i,
                canvas: drawCircle(),
            })),
            links: [...Array(N).keys()]
                .filter((id) => id)
                .map((id) => ({
                    source: id,
                    target: Math.round(Math.random() * (id - 1)),
                })),
        };
        //draw a circle to a canvas and return
        function drawCircle() {
            let canvas = document.createElement("canvas");
            canvas.id = "canvas";
            canvas.width = 32;
            canvas.height = 32;
            let ctx = canvas.getContext("2d");
            let PI2 = Math.PI * 2;
            ctx.arc(16, 16, 16, 0, PI2, true);
            ctx.fillStyle = "blue";
            ctx.fill();

            return canvas;
        }
    };
    const data = genRandomTree();
    // Random data
    const N = 30;
    const gData = {
        nodes: [...Array(N).keys()].map((i) => ({ id: i })),
        links: [...Array(N).keys()]
            .filter((id) => id)
            .map((id) => ({
                source: id,
                target: Math.round(Math.random() * (id - 1)),
            })),
    };

    useEffect(() => {
        if (!circle) {
            setGraphData({ nodes: [], links: [] });
            return;
        }

        let newNodes = circles?.map((x, i) => {
            return { id: x.id, name: x.name, picture: x.picture };
        });
        newNodes?.push({ id: circle.id, name: circle.name, val: 20 });
        let links = circleConnections?.map((x) => {
            return { source: x.source.id, target: x.target.id };
        });

        links = links.filter((x) => circles.some((y) => y.id === x.source) || circles.some((y) => y.id === x.target));

        let newGraphData = { nodes: newNodes, links: links };
        setGraphData(newGraphData);
    }, [circle, circles, circleConnections]);

    return (
        <Box backgroundColor="#dfdfdf" width="100%" height="100%">
            <ForceGraph3D
                graphData={graphData}
                linkDirectionalArrowLength={1}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
                // nodeThreeObject={({ picture }) => {
                //     const imgTexture = new THREE.TextureLoader().load(picture ?? "./images/blank-profile-picture.png");
                //     const material = new THREE.SpriteMaterial({ map: imgTexture });
                //     const sprite = new THREE.Sprite(material);
                //     sprite.scale.set(12, 12);
                //     return sprite;
                // }}
            />
        </Box>
    );
};

export default GraphView;
