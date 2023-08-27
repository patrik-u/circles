import { HeadingNode, QuoteNode, SerializedHeadingNode } from "@lexical/rich-text";

export class DocumentHeadingNode extends HeadingNode {
    __id;

    constructor(id, tag, key) {
        super(tag, key);
        this.__id = id;
    }

    setId(id) {
        // getWritable() creates a clone of the node
        // if needed, to ensure we don't try and mutate
        // a stale version of this node.
        const self = this.getWritable();
        self.__id = id;
    }

    getId() {
        // getLatest() ensures we are getting the most
        // up-to-date value from the EditorState.
        const self = this.getLatest();
        return self.__id;
    }

    static getType() {
        return "document-heading";
    }

    static clone(node) {
        return new DocumentHeadingNode(node.__id, node.__tag, node.__key);
    }

    exportJSON() {
        return { ...super.exportJSON(), id: this.__id, type: this.getType() };
    }

    static importJSON(serializedNode) {
        const { id, ...rest } = serializedNode;
        const node = new DocumentHeadingNode(id, rest.tag);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }
}

export function $createDocumentHeadingNode(id, tag) {
    return new DocumentHeadingNode(id, tag);
}

export function $isDocumentHeadingNode(node?) {
    return node instanceof DocumentHeadingNode;
}
