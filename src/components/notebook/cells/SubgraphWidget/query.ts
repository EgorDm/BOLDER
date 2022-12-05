import { triple } from "@rdfjs/data-model";
import { CONSTRUCT, sparql } from "@tpluscode/sparql-builder";
import {
  optionalBound,
  NAMESPACES,
  sparqlLabelBound,
  sparqlSimpleLabelBound,
  suffix,
  valuesBound,
  WDT_NAMESPACES
} from "../../../../utils/sparql";
import { flexTermToSparql, newVar, QueryState } from "../../../input/QueryBuilder/sparql";
import { SubgraphWidgetData } from "./types";


export const buildQuery = (data: SubgraphWidgetData) => {
  const { rdf, wikibase } = WDT_NAMESPACES;

  const state: QueryState = {
    globalBounds: [],
    tempVarCounter: 0,
    statements: new Set(),
    predicateVars: new Set(),
    wikidata: true,
  }

  const { varName: eVar, bounds: eBounds } = flexTermToSparql(state, data.entity);
  const { bounds: eLabelBounds, varLabel: eVarLabel } = sparqlSimpleLabelBound(eVar, true);

  let pBound = undefined;
  if (!(data.anyPredicate ?? true)) {
    const { bounds: pBounds } = flexTermToSparql(state, data.predicates);
    pBound = pBounds?.[0];
  }

  const addPredicate = () => {
    const varName = newVar(state, 'p');
    let bounds: any[] = pBound ? [valuesBound(varName, pBound.values)] : [];

    let labelledVar = varName;
    if (state.wikidata) {
      labelledVar = newVar(state, 'tmp');
      bounds.push(triple(labelledVar, wikibase.directClaim, varName));
    }

    const { bounds: labelBounds, varLabel } = sparqlSimpleLabelBound(labelledVar, true);
    return { varName, varLabel, bounds: [...bounds, labelBounds] }
  }

  const addObject = () => {
    const varName = newVar(state, 'o');
    const { bounds, varLabel } = sparqlSimpleLabelBound(varName, true);

    return {
      varName, varLabel,
      bounds: [
        sparql`FILTER(!isLiteral(${varName}))`,
        ...bounds,
      ]
    }
  }

  const selectTriples = [triple(eVar, rdf.label, eVarLabel)];
  const bounds: any[] = [ ...(eBounds ?? []), ...(eLabelBounds ?? [])];

  let stack = [eVar];
  const depth = data.depth ?? 1;
  for (let i = 0; i < depth; i++) {
    const nextStack = [];

    for (const sVar of stack) {
      {
        // Outward edge
        const { varName: pVar, varLabel: pVarLabel, bounds: pBounds } = addPredicate();
        const { varName: oVar, varLabel: oVarLabel, bounds: oBounds } = addObject();

        selectTriples.push(triple(sVar, pVar, oVar));
        selectTriples.push(triple(oVar, rdf.label, oVarLabel));
        selectTriples.push(triple(pVar, rdf.label, pVarLabel));
        bounds.push(triple(sVar, pVar, oVar));
        bounds.push(...pBounds);
        bounds.push(...oBounds);

        nextStack.push(oVar);
      }
      {
        // Inward edge
        const { varName: pVar, varLabel: pVarLabel, bounds: pBounds } = addPredicate();
        const { varName: oVar, varLabel: oVarLabel, bounds: oBounds } = addObject();

        selectTriples.push(triple(oVar, pVar, sVar));
        selectTriples.push(triple(oVar, rdf.label, oVarLabel));
        selectTriples.push(triple(pVar, rdf.label, pVarLabel));
        bounds.push(triple(oVar, pVar, sVar));
        bounds.push(...pBounds);
        bounds.push(...oBounds);

        nextStack.push(oVar);
      }
    }

    stack = nextStack;
  }

  const query = CONSTRUCT`${selectTriples}`
    .WHERE`
      ${bounds}
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    `
    .LIMIT((data.limit ?? 20) * 3);

  return {
    primaryQuery: query.build(),
  };
}
