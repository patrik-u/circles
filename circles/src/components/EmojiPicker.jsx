import React, { useEffect, useRef, useState } from "react";
import { log } from "@/components/Helpers";
import data from "@emoji-mart/data";
import { Picker } from "emoji-mart";

const EmojiPicker = ({ setMessage }) => {
    const ref = useRef();
    const [, setIsInitialized] = useState(false);
    const [picker, setPicker] = useState(null);

    // const onEmojiSelect = (res) => {
    //     console.log(res);
    //     setMessage((message) => message + res.native + caretIndex);
    // };

    useEffect(() => {
        log("EmojiPicker.useEffect 1", -1);
        if (picker) {
            //picker.props.onEmojiSelect = callback;
            return;
        }
        let callback = (res) => {
            console.log(res);
            setMessage((message) => message + res.native);
        };

        setPicker(new Picker({ onEmojiSelect: callback, data, ref }));
        setIsInitialized((current) => true);
    }, [picker, setMessage]);

    return <div ref={ref} />;
};

export default EmojiPicker;
