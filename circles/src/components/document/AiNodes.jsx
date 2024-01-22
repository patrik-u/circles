//#region imports
import { DecoratorNode } from "lexical";
import * as React from "react";
//#endregion

export class AiPromptNode extends DecoratorNode {
    __uuid;

    static clone(node) {
        return new AiPromptNode(node.__uuid, node.__key);
    }

    static getType() {
        return "ai-prompt";
    }

    static importJSON(serializedNode) {
        const node = $createAiPromptNode(serializedNode.uuid);
        return node;
    }

    exportJSON() {
        return {
            type: "ai-prompt",
            uuid: this.__uuid,
            version: 1,
        };
    }

    constructor(uuid, key) {
        super(key);
        this.__uuid = uuid;
    }

    updateDOM(prevNode, dom, config) {
        return false;
    }

    createDOM(config) {
        return document.createElement("span");
    }

    decorate() {
        return (
            <span style={{ color: "#ccc" }} spellCheck="false">
                <img
                    src="/Spinner-1s-20px.gif"
                    style={{ display: "inline", width: "1em", height: "1em", verticalAlign: "middle" }}
                    alt="spinner"
                />
            </span>
        );
    }
}

export function $createAiPromptNode(uuid) {
    return new AiPromptNode(uuid);
}
