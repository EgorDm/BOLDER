import { variable } from "@rdfjs/data-model";
import { SELECT } from "@tpluscode/sparql-builder";
import { sparqlLabelsBound } from "../../../../utils/sparql";
import { queryToSparql } from "../../../input/QueryBuilder/sparql";
import { QueryBuilderData } from "./types";


export const buildQuery = (data: QueryBuilderData) => {
  const wikidata = true;

  const vars = (data.select ?? []).map(v => variable(v.value));
  if (!vars.length) {
    return {};
    // throw new Error('No variables selected');
  }

  const predVars = new Set<string>();
  const body = queryToSparql(data.tree, wikidata, predVars);

  const { bounds: labelBounds, vars: labelVars } = sparqlLabelsBound(vars, wikidata, predVars);
  const selectVars = [ ...vars, ...labelVars ];

  const query = SELECT`${selectVars}`
    .WHERE`
      ${body}
      ${labelBounds}
    `
    .LIMIT(data.limit ?? 20);

  return {
    primaryQuery: query.build(),
  };
}
