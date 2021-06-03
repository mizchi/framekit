import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { MonacoWorkspace } from "./monaco-workspace/MonacoWorkspace";
import { extendTheme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";

const fonts = { mono: `'Menlo', monospace` };

const breakpoints = createBreakpoints({
  sm: "40em",
  md: "52em",
  lg: "64em",
  xl: "80em",
});

const theme = extendTheme({
  colors: {
    black: "#16161D",
  },
  fonts,
  breakpoints,
});
theme.config.useSystemColorMode = true;
theme.config.initialColorMode = "dark";

export function App(props: {
  initialFiles: { [k: string]: string };
  onChangeContent: (filepath: string, content: string) => void;
}) {
  const initialFiles = Object.entries(props.initialFiles).map(
    ([k, v], index) => {
      return {
        filepath: k,
        content: v,
        open: index === 0,
      };
    }
  );
  return (
    <ChakraProvider theme={theme}>
      <MonacoWorkspace
        colorMode="dark"
        initialFiles={initialFiles}
        onChangeContent={props.onChangeContent}
        onLog={console.log}
      />
    </ChakraProvider>
  );
}
