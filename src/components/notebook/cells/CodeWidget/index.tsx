import {
  Box,
  Grid
} from "@mui/material";
import React, { useMemo } from "react";
import { useCellContext } from "../../../../providers/CellProvider";
import { CodeCellType } from "../../../../types";
import { PREFIXES } from "../../../../utils/sparql";
import { cellOutputToYasgui } from "../../../../utils/yasgui";
import { Yasr } from "../../../data/Yasr";
import { Yasqe } from "../../../input/Yasqe";


export const CodeWidget = () => {
  const { cell, cellRef, outputs, setCell } = useCellContext();
  const { source } = cell as CodeCellType;
  const editorRef = React.useRef(null);

  const content = useMemo(() => (
    <Grid item xs={12}>
      <Yasqe
        value={source || ''}
        onChange={(value) => {
          setCell({
            ...cellRef.current,
            source: value,
          } as any)
        }}
        editorRef={editorRef}
        prefixes={PREFIXES}
      />
    </Grid>
  ), [ source ]);

  const result = useMemo(() => {
    if (!!outputs?.length) {
      return (<Box sx={{ width: '100%' }}>
        <Yasr
          result={cellOutputToYasgui(outputs[0])}
          prefixes={PREFIXES}
        />
      </Box>)
    }

    return null;
  }, [ outputs ]);

  return (
    <>
      {content}
      {result}
    </>
  )
}
