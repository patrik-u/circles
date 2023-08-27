//#region imports
import { useEffect, useState } from "react";
import { $getRoot } from "lexical";
import axios from "axios";
import { useAtom } from "jotai";
import { triggerClearEditorAtom } from "components/Atoms";
import { debounce } from "components/Helpers";
import { log } from "components/Helpers";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
//#endregion

const emptyEditorState =
    '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

// saves the document if it's changed
const CommandListenerPlugin = () => {
    const [editor] = useLexicalComposerContext();
    const [triggerClearEditor, setTriggerClearEditor] = useAtom(triggerClearEditorAtom);

    useEffect(() => {
        if (!triggerClearEditor) {
            return;
        }
        const editorState = editor.parseEditorState(emptyEditorState);
        editor.setEditorState(editorState);
        setTriggerClearEditor(false);
    }, [triggerClearEditor, setTriggerClearEditor, editor]);

    return null;
};
export default CommandListenerPlugin;
