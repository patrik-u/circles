//#region imports
import { useEffect } from "react";
import { $getRoot } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useParams } from "react-router-dom";
//#endregion

const FocusFirstNodeOnLoadPlugin = () => {
    const { documentId } = useParams();
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // focus first heading on mount
        if (editor) {
            editor.update(() => {
                const firstNode = $getRoot()?.getFirstChild();
                if (firstNode) {
                    firstNode.select();
                }
            });
        }
    }, [documentId, editor]);

    return null;
};
export default FocusFirstNodeOnLoadPlugin;
