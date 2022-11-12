import { triple, variable } from "@rdfjs/data-model";
import { SELECT, sparql } from "@tpluscode/sparql-builder";
import { sparqlLabelBound, WDT_NAMESPACES } from "../../../../utils/sparql";
import { flexTermToSparql, QueryState } from "../../../input/QueryBuilder/sparql";
import { PropertiesWidgetData } from "./types";

export const buildQuery = (data: PropertiesWidgetData) => {
  if (!data?.subject) {
    return null;
  }

  const state: QueryState = {
    globalBounds: [],
    tempVarCounter: 0,
    statements: new Set(),
    wikidata: true,
  };

  const { varName: sVar, bounds: sBounds } = flexTermToSparql(state, data.subject);

  const pVar = variable('p');
  const { bounds: pLabelBounds, varLabel: pVarLabel } = sparqlLabelBound(pVar, state.wikidata);

  const oVar = variable('o');
  const { bounds: oLabelBounds, varLabel: oVarLabel } = sparqlLabelBound(oVar);

  const selectVars = [pVar, pVarLabel, oVar, oVarLabel];
  const bounds: any[] = [
    ...sBounds,
    triple(sVar, pVar, oVar),
    sparql`FILTER(!isLiteral(${oVar}) || langMatches(lang(${oVar}), "en") || langMatches(lang(${oVar}), ""))`,
    ...pLabelBounds, ...oLabelBounds,
  ];
  if (state.wikidata) {
    const { wikibase } = WDT_NAMESPACES;
    bounds.push(triple(variable('pClaim'), wikibase.directClaim, pVar));
  }

  const primaryQuery = SELECT`${selectVars}`
    .WHERE`${bounds}`
    .LIMIT(data.limit ?? 20);

  return {
    primaryQuery: primaryQuery.build(),
  };
}
