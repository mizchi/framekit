import { useMonaco, useTextModels } from "./useMonaco";
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  FormControl,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import produce from "immer";
import sortBy from "lodash.sortby";
import Monaco from "monaco-editor";
import React, { useCallback, useEffect, useRef, useState } from "react";
import FocusLock from "react-focus-lock";
import { AiFillFileAdd, AiOutlineExpand } from "react-icons/ai";
import {
  FaArrowDown,
  FaArrowUp,
  FaCaretDown,
  FaCaretRight,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import { setupMonaco, updateTextModel } from "./monacoHelper";
import { loadExternalLibTypes } from "./loadExternalLibTypes";
import { FoldableTextModelEditor } from "./FoldableTextModelEditor";
// import { getPrettierApi, getUnirollApi } from "@/lib/getWorkers";

let tid: any = null;
let changes: { [fpath: string]: string } = {};

type Files = Array<{ filepath: string; open: boolean }>;

export function MonacoWorkspace({
  initialFiles,
  onChangeContent,
  onChangeOrder,
  colorMode,
  onLog,
}: {
  colorMode: "dark" | "light";
  initialFiles: Array<{ filepath: string; content: string; open: boolean }>;
  onChangeOrder?: (files: Array<{ filepath: string; open: boolean }>) => void;
  onChangeContent?: (filepath: string, content: string) => void;
  onLog: (type: string, message: string) => void;
}) {
  const monaco = useMonaco();
  const [files, setFiles] = useState<Files>(initialFiles);

  // initialize models
  useEffect(() => {
    if (monaco == null) return;
    monaco.editor.getModels().forEach((m) => m.dispose());
    for (const f of initialFiles) {
      updateTextModel(f.content, `file://${f.filepath}`);
    }
  }, [monaco]);

  const onCreateFile = useCallback(
    (filepath: string, value: string) => {
      if (monaco == null) return;
      updateTextModel(value, filepath);
      const newFiles = files.concat([
        {
          filepath,
          open: true,
        },
      ]);
      setFiles(newFiles);
      onChangeOrder?.(newFiles);
    },
    [monaco]
  );
  const onClickOpen = useCallback(
    (filepath, state) => {
      if (monaco == null) return true;
      const newFiles = produce(files, (draft) => {
        const x = draft.find((f) => f.filepath === filepath);
        x && (x.open = state);
      });
      setFiles(newFiles);
      onChangeOrder?.(newFiles);
    },
    [files, monaco]
  );
  const onClickExpand = useCallback(
    (filepath) => {
      if (monaco == null) return true;
      const newFiles = files.map((f) => {
        return { open: filepath === f.filepath, filepath: f.filepath };
      });
      setFiles(newFiles);
      onChangeOrder?.(newFiles);
    },
    [files, monaco]
  );

  const onClickMoveDown = useCallback(
    (filepath: string) => {
      const newFiles = produce(files, (draft) => {
        const index = draft.findIndex((x) => x.filepath === filepath);
        if (index < draft.length - 1) {
          const orig = draft[index];
          const target = draft[index + 1];
          draft[index] = target;
          draft[index + 1] = orig;
        }
      });
      setFiles(newFiles);
      onChangeOrder?.(newFiles);
    },
    [files, monaco]
  );
  const onClickMoveUp = useCallback(
    (filepath: string) => {
      const newFiles = produce(files, (draft) => {
        const index = draft.findIndex((x) => x.filepath === filepath);
        if (index > 0) {
          const orig = draft[index];
          const target = draft[index - 1];
          draft[index] = target;
          draft[index - 1] = orig;
        }
      });
      setFiles(newFiles);
      onChangeOrder?.(newFiles);
    },
    [files, monaco]
  );

  return (
    <WorkspaceImpl
      colorMode={colorMode}
      files={files}
      onClickExpand={onClickExpand}
      onClickOpen={onClickOpen}
      onChangeContent={onChangeContent}
      onClickMoveDown={onClickMoveDown}
      onClickMoveUp={onClickMoveUp}
      onCreateFile={onCreateFile}
      onLog={onLog}
    />
  );
}

function WorkspaceImpl(props: {
  files: Array<{ filepath: string; open: boolean }>;
  onChangeContent?: (fpath: string, content: string) => void;
  onCreateFile: (filepath: string, content: string) => void;
  onClickOpen: (filepath: string, state: boolean) => void;
  onClickMoveDown: (filepath: string) => void;
  onClickMoveUp: (filepath: string) => void;
  onClickExpand: (filepath: string) => void;
  onLog: (type: string, message: string) => void;
  colorMode: "dark" | "light";
}) {
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco == null) return;
    // const prettierApi = getPrettierApi();
    setupMonaco(monaco, {
      // format: prettierApi.format,
      format: async (content: string) => content,
    });
  }, [monaco]);

  const models = useTextModels();

  const sortedModels = sortBy(models, (model) => {
    const index = props.files.findIndex(
      (file) => model.uri.path === file.filepath
    );
    return index !== -1 ? index : Infinity;
  });

  const onChangeContent = useCallback(
    (fpath: string, content: string) => {
      props.onChangeContent?.(fpath, content);
      if (monaco) {
        changes[fpath] = content;
        tid && clearTimeout(tid);
        tid = setTimeout(async () => {
          if (Object.keys(fpath).length === 0) {
            tid = null;
            return;
          }
          // const api = getUnirollApi();
          await loadExternalLibTypes({
            monaco,
            code: Object.values(changes).join("\n"),
            // extractImportSpecifiers: api.getImportUrls,
            extractImportSpecifiers: async () => [],
            onLog(message) {
              props.onLog("log", message);
            },
          });
          changes = {};
        }, 800);
      }
      return () => {
        changes = {};
        tid && clearTimeout(tid);
        tid = null;
      };
    },
    [props.onChangeContent, monaco, props.onLog]
  );
  return (
    <Box h="100%" w="100%">
      <Box flex={1} h="100%">
        <Flex h="100%" w="100%" flexDir="column">
          {/* <Flex h="32px">
            <BottomTools onCreateFile={props.onCreateFile} />
          </Flex> */}
          {sortedModels.map((m) => {
            const isFocus = props.files[0].filepath === m.uri.path;
            return (
              <FileEditor
                colorMode={props.colorMode}
                onClickMoveDown={props.onClickMoveDown}
                onClickMoveUp={props.onClickMoveUp}
                opened={
                  props.files.find((f) => f.filepath === m.uri.path)?.open ??
                  false
                }
                onClickOpen={props.onClickOpen}
                onClickExpand={props.onClickExpand}
                key={m.uri.path}
                model={m}
                onChangeContent={onChangeContent}
                focus={isFocus}
              />
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
}

function FileEditor(props: {
  model: Monaco.editor.ITextModel;
  opened: boolean;
  focus: boolean;
  colorMode: "dark" | "light";
  onClickOpen: (filepath: string, state: boolean) => void;
  onClickExpand: (filepath: string) => void;
  onClickMoveDown: (filepath: string) => void;
  onClickMoveUp: (filepath: string) => void;
  onChangeContent: (fpath: string, content: string) => void;
}) {
  const bgColor = { light: "gray.50", dark: "gray.700" };
  return (
    <Flex
      overflow="hidden"
      flex={props.opened ? 1 : undefined}
      h={props.opened ? undefined : "2.1rem"}
      flexDir="column"
    >
      <Flex
        bg={bgColor[props.colorMode]}
        w="100%"
        borderRadius={2}
        paddingLeft={1}
      >
        <Center h="100%" cursor="pointer" paddingLeft="5px">
          <IconButton
            _focus={{ outline: "none" }}
            variant="unstyled"
            size="sm"
            aria-label="toggle"
            onClick={() =>
              props.onClickOpen(props.model.uri.path, !props.opened)
            }
            icon={props.opened ? <FaCaretDown /> : <FaCaretRight />}
          />
        </Center>
        <Center h="100%" cursor="pointer">
          <IconButton
            _focus={{ outline: "none" }}
            variant="unstyled"
            size="sm"
            aria-label="expand"
            onClick={() => props.onClickExpand(props.model.uri.path)}
            icon={<AiOutlineExpand />}
          />
        </Center>
        <Center h="100%">
          <Text paddingLeft="2px">{props.model.uri.path}</Text>
        </Center>

        <ButtonGroup flex={1} d="flex" justifyContent="flex-end">
          <IconButton
            _focus={{ outline: "none" }}
            variant="unstyled"
            size="sm"
            icon={<FaArrowDown />}
            aria-label="move-down"
            onClick={() => props.onClickMoveDown(props.model.uri.path)}
          />
          <IconButton
            _focus={{ outline: "none" }}
            variant="unstyled"
            size="sm"
            icon={<FaArrowUp />}
            aria-label="move-up"
            onClick={() => props.onClickMoveUp(props.model.uri.path)}
          />
          <IconButton
            _focus={{ outline: "none" }}
            variant="unstyled"
            size="sm"
            icon={<FaTrash />}
            aria-label="trash"
          />
        </ButtonGroup>
      </Flex>
      {props.opened && (
        <Box w="100%" h="100%">
          <FoldableTextModelEditor
            focus={props.focus}
            options={{
              automaticLayout: true,
              theme: props.colorMode === "dark" ? "vs-dark" : "vs",
              lineNumbers: "off",
              fontSize: 18,
              minimap: {
                enabled: false,
              },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              wrappingStrategy: "advanced",
              overviewRulerLanes: 0,
            }}
            model={props.model}
            onChangeContent={props.onChangeContent}
          />
        </Box>
      )}
    </Flex>
  );
}

function BottomTools(props: {
  onCreateFile: (filepath: string, content: string) => void;
}) {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const firstFieldRef = useRef(null);
  return (
    <>
      <Center h="100%" w="1rem" paddingLeft="2rem">
        <Popover
          isOpen={isOpen}
          initialFocusRef={firstFieldRef}
          onOpen={onOpen}
          onClose={onClose}
          placement="top"
          closeOnBlur={false}
        >
          <PopoverTrigger>
            <IconButton
              size="sm"
              aria-label="add file"
              icon={<AiFillFileAdd />}
            />
          </PopoverTrigger>
          <PopoverContent p={5}>
            <FocusLock returnFocus persistentFocus={false}>
              <PopoverArrow />
              <PopoverCloseButton />
              <Form
                firstFieldRef={firstFieldRef}
                onCancel={onClose}
                onSave={(filepath) => {
                  props.onCreateFile(filepath, "");
                  onClose();
                }}
              />
            </FocusLock>
          </PopoverContent>
        </Popover>
      </Center>
    </>
  );
}

function Form({
  firstFieldRef,
  onSave: onClickSave,
}: {
  firstFieldRef: React.RefObject<any>;
  onSave: (filepath: string) => void;
  onCancel: () => void;
}) {
  const [filepath, setFilepath] = useState("/");
  return (
    <Stack spacing={4}>
      <Flex>
        <FormControl>
          <Input
            spellCheck={false}
            ref={firstFieldRef}
            id="Addfilepath"
            value={filepath}
            onChange={(ev) => {
              setFilepath((ev.target as any).value);
            }}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                onClickSave(filepath);
              }
            }}
          />
        </FormControl>
        <Button
          isDisabled={!filepath.startsWith("/")}
          colorScheme="teal"
          onClick={() => onClickSave(filepath)}
        >
          <FaSave />
        </Button>
      </Flex>
    </Stack>
  );
}
