import React from "react";
import { Cell, CellOutput } from "../../../../types";
import { PREFIXES } from "../../../../utils/sparql";
import { cellOutputToYasgui } from "../../../../utils/yasgui";
import { Yasr } from "../../../data/Yasr";


export const ResultTab = ({
  mode, cell, outputs
}: {
  mode: string,
  cell: Cell,
  outputs: CellOutput[] | null,
}) => {
  const result = cellOutputToYasgui(outputs[0]);

  return (
    <Yasr
      result={result}
      prefixes={PREFIXES}
    />
  )
}
