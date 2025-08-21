import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import MidiPianoApp from './MidiPianoApp';
import Button from './components/Button';
export default function App() {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-3", children: [_jsx(Button, { variant: "primary", size: "md", children: "Primary" }), _jsx(Button, { variant: "secondary", size: "md", children: "Secondary" }), _jsx(Button, { variant: "tertiary", size: "md", children: "Tertiary" })] }), _jsx(MidiPianoApp, {})] }));
}
