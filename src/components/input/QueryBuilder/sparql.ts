import { literal, namedNode, triple, variable } from "@rdfjs/data-model";
import { Variable, Term as RdfTerm } from "@rdfjs/types";
import { SparqlValue } from "@tpluscode/rdf-string";
import { sparql } from "@tpluscode/sparql-builder";
import _ from "lodash";
import { RuleGroupType, RuleType } from "react-querybuilder/dist/types/types/ruleGroups";
import { Term } from "../../../types/terms";
import { bind, brackets, NAMESPACES, sparqlConjunctionBuilder, valuesBound, WDT_NAMESPACES } from "../../../utils/sparql";
import { FlexibleTerm } from "../FlexibleTermInput";
import { DType, DTypeFilterType, FunctionType, OperatorType, OpType } from "./types";
import { collectStatements } from "./utils";

export interface RuleGroup extends RuleGroupType<Rule> {
  variable?: {
    value: string;
    label?: string;
  }
}

export interface Rule extends RuleType {
  value: RuleValue,
}

export type RuleValue = {
  predicate: FlexibleTerm,
  input: FlexibleTerm,
  reverse: boolean,
} | string | null | any;

export interface QueryState {
  tempVarCounter: number,
  globalBounds: SparqlValue[],
  statements: Set<string>,
  wikidata: boolean,
  predicateVars: Set<string>
}

export const tryQueryToSparql = (query: RuleGroup, wikidata = true, predVars: Set<string> = null) => {
  const state: QueryState = {
    tempVarCounter: 0,
    globalBounds: [],
    statements: new Set(),
    predicateVars: predVars ?? new Set(),
    wikidata,
  }

  if (wikidata) {
    collectStatements(query, state.statements);
  }

  return [
    ruleGroupToSparql(state, query),
    ...state.globalBounds,
  ];
}

export const queryToSparql = (query: RuleGroup, wikidata = true, predVars: Set<string> = null) => {
  try {
    return tryQueryToSparql(query, wikidata, predVars);
  } catch (e) {
    console.error(e)
    return {};
  }
}

export const partialToSparql = (state: QueryState, rule: Rule | RuleGroup, parent?: RuleGroup): SparqlValue => {
  if (!rule) {
    return null;
  }

  // @ts-ignore
  if (rule?.combinator) {
    return ruleGroupToSparql(state, rule as RuleGroup);
  } else {
    return ruleToSparql(state, rule as Rule, parent!);
  }
}

const ruleGroupToSparql = (state: QueryState, ruleGroup: RuleGroup) => {
  const combinator = (ruleGroup.combinator ?? 'AND').toUpperCase();
  const quantifier = (ruleGroup as any).quantifier ?? 'must';
  const rules = ruleGroup.rules.map(rule => partialToSparql(state, rule, ruleGroup));

  const cleanedRules = [];
  if (combinator === 'AND') {
    for (const rule of rules) {
      if ((rule as any)?.combinator) {
        if ((rule as any)?.combinator === combinator && (rule as any)?.quantifier === quantifier) {
          cleanedRules.push(...(rule as any).terms);
        } else {
          // cleanedRules.push(sparql`{ ${rule} }`);
          cleanedRules.push(rule);
        }
      } else if (_.isArray(rule)) {
        cleanedRules.push(...rule);
      } else {
        cleanedRules.push(rule);
      }
    }
  } else {
    // Query optimization is more difficult for disjunction queries
    cleanedRules.push(...rules.map(rule => brackets(rule, true)));
  }

  return sparqlConjunctionBuilder(cleanedRules, combinator as any, quantifier);
}

const ruleToSparql = (state: QueryState, rule: Rule, parent: RuleGroup) => {
  switch (rule.operator as OperatorType) {
    case 'filter': {
      const { predicate, input, reverse } = rule.value;
      const parentVar = { type: 'variable', variable: parent.variable };
      const subject = reverse ? input : parentVar;
      const object = reverse ? parentVar : input;

      return tripleToSparql(state, subject, predicate, object);
    }
    case 'datatype': {
      const type: DTypeFilterType = rule.value?.value;
      const parentVar: FlexibleTerm = { type: 'variable', variable: parent.variable };

      state.globalBounds.push(
        boundDatatypeSparql(state, parentVar, type)
      )
      return null;
    }
    case 'operator': {
      const value = rule.value ?? {};
      const op: OpType = value?.op?.value ?? 'eq';
      const p1Val = value?.p1;

      const parentVar: FlexibleTerm = { type: 'variable', variable: parent.variable };
      const { varName: pVar, bounds: pBounds } = flexTermToSparql(state, parentVar);
      const extraBounds = [];

      if (OP_TO_SPARQL[op]) {
        const dtype = value?.dtype?.value ?? 'term';
        const { varName: p1Var, bounds: p1Bounds } = dtypeValueToSparql(state, dtype, p1Val);

        const sparqlOp = OP_TO_SPARQL[op];
        extraBounds.push(
          ...p1Bounds,
          sparql`FILTER(${pVar} ${sparqlOp} ${p1Var})`
        )
      } else {
        switch (op) {
          case 'null':
            extraBounds.push(sparql`FILTER(!BOUND(${pVar}))`);
            break;
          case 'not_null':
            extraBounds.push(sparql`FILTER(BOUND(${pVar}))`);
            break;
          case 'raw':
            extraBounds.push(sparql`FILTER(${p1Val})`);
        }
      }

      return [
        ...(pBounds ?? []),
        ...extraBounds,
      ];
    }
    case 'instance_of':
    case 'subclass_of': {
      const { input } = rule.value;
      const parentVar: FlexibleTerm = { type: 'variable', variable: parent.variable };

      const { varName: sVar, bounds: sBounds } = flexTermToSparql(state, parentVar);
      const { varName: oVar, bounds: oBounds } = flexTermToSparql(state, input);

      const { wdt, rdf, rdfs } = NAMESPACES;
      let pPath = null;
      if (rule.operator === 'instance_of') {
        pPath = state.wikidata
          ? sparql`${wdt.P31}/${wdt.P279}*`
          : sparql`${rdf.type}/${rdfs.subClassOf}*`;
      } else {
        pPath = state.wikidata
          ? sparql`${wdt.P279}+`
          : sparql`${rdfs.subClassOf}+`;
      }
      return [
        ...(oBounds ?? []),
        ...(sBounds ?? []),
        sparql`${sVar} ${pPath} ${oVar}.`,
      ];
    }
    case 'function': {
      const { rawFn, output } = rule.value;
      const func = rule.value.func?.value ?? 'raw';

      const outputVar: FlexibleTerm = { type: 'variable', variable: output };
      const { varName: oVar, bounds: oBounds } = flexTermToSparql(state, outputVar);

      switch (func as FunctionType) {
        case 'raw': {
          return [
            ...(oBounds ?? []),
            bind(sparql`${rawFn}`, oVar)
          ];
        }
        case 'lang': {
          const inputVar: FlexibleTerm = { type: 'variable', variable: rule.value.input };
          const { varName: iVar, bounds: iBounds } = flexTermToSparql(state, inputVar);

          return [
            ...(oBounds ?? []),
            ...(iBounds ?? []),
            bind(sparql`lang(${iVar})`, oVar)
          ];
        }
        case 'is_bound': {
          const inputVar: FlexibleTerm = { type: 'variable', variable: rule.value.input };
          const { varName: iVar, bounds: iBounds } = flexTermToSparql(state, inputVar);

          return [
            ...(oBounds ?? []),
            ...(iBounds ?? []),
            bind(sparql`str(BOUND(${iVar}))`, oVar)
          ];
        }
        case 'simplify': {
          const inputVar: FlexibleTerm = { type: 'variable', variable: rule.value.input };
          const { varName: iVar, bounds: iBounds } = flexTermToSparql(state, inputVar);

          if (state.wikidata) {
            return [
              ...(oBounds ?? []),
              ...(iBounds ?? []),
              bind(sparql`${iVar}`, oVar)
            ];
          } else {
            return [
              ...(oBounds ?? []),
              ...(iBounds ?? []),
              bind(sparql`${iVar}`, oVar)
            ];
          }
        }
        default: {
          throw new Error(`Unknown function ${func}`);
        }
      }
    }
    default:
      throw new Error(`Unknown operator ${rule.operator}`)
  }
}

const OP_TO_SPARQL = {
  'eq': '=',
  'neq': '!=',
  'lt': '<',
  'lte': '<=',
  'gt': '>',
  'gte': '>=',
}

const dtypeValueToSparql = (state: QueryState, dtype: DType, value: FlexibleTerm | any) => {
  if (dtype === 'term') {
    return flexTermToSparql(state, value);
  }

  const { xsd } = NAMESPACES;
  switch (dtype) {
    case 'string':
      return { varName: literal(value), bounds: [] };
    case 'boolean':
      return { varName: literal(value, xsd.boolean), bounds: [] };
    case 'integer':
      return { varName: literal(value, xsd.integer), bounds: [] };
    case 'decimal':
      return { varName: literal(value, xsd.decimal), bounds: [] };
    case 'datetime': {
      const dval = typeof value === 'string' ? new Date(value) : value;
      return { varName: literal(dval?.toISOString(), xsd.dateTime), bounds: [] };
    }
    case 'url':
      return { varName: literal(value, xsd.anyURI), bounds: [] };
    default:
      throw new Error(`Unknown dtype ${dtype}`)
  }
}

const tripleToSparql = (state: QueryState, subject: FlexibleTerm, predicate: FlexibleTerm, object: FlexibleTerm) => {
  const { varName: sVar, bounds: sBounds } = flexTermToSparql(state, subject);
  const { varName: pVar, bounds: pBounds } = flexTermToSparql(state, predicate);
  const { varName: oVar, bounds: oBounds } = flexTermToSparql(state, object);
  const extra = [];

  // Support for wikidata statements
  if (isStmt(state, sVar) || isStmt(state, oVar)) {
    let pBoundVals = pBounds?.[0]?.values;

    if (isStmt(state, sVar) && pBoundVals) {
      // If subject is a statement then we need to modify property to select for value or qualifier
      // ?stmt wdt:.. ?o is translated to ?stmt ps:.. ?o and ?stmt pq:.. ?o
      pBoundVals.filter(isWikiDirect).forEach(t => {
        pBoundVals.push(...wikiDirectToValueProps(t));
      })
    }

    if (isStmt(state, oVar) && pBoundVals) {
      // Wikidata has a special property to select the statement

      // Bind the statement value to the to similar triple
      const varName = variable(`tmp${state.tempVarCounter++}`);
      let varProps = [ ...pBoundVals ];
      varProps.filter(isWikiDirect).forEach(t => {
        varProps.push(...wikiDirectToValueProps(t))
      });
      extra.push(valuesBound(varName, varProps));
      extra.push(triple(oVar, varName, variable(`${oVar.value}Value`)));

      // ?s wdt:.. ?stmt is translated to ?s p:.. ?stmt
      pBoundVals.filter(t => isWikiDirect(t)).forEach(t => {
        pBoundVals.push(namedNode(WIKIDATA_PREFIX_PROP + t.value.slice(WIKIDATA_PREFIX_DIRECT.length)));
      });
      pBounds[0] = valuesBound(pBounds[0].variable, pBoundVals.filter(t => !isWikiDirect(t)))
    }

    if (isStmt(state, oVar)) {
      // Ensure predicate is (not direct) wikidata property
      const { wikibase } = WDT_NAMESPACES;
      extra.push(triple(newVar(state), wikibase.claim, pVar))
    }
  }

  return [
    ...(sBounds ?? []),
    ...(pBounds ?? []),
    ...(oBounds ?? []),
    triple(sVar, pVar, oVar),
    ...extra,
  ]
}

const isStmt = (state: QueryState, v: Variable) => v.termType === 'Variable' && state.statements.has(v.value)

const isWikiDirect = (t: RdfTerm) => t.termType === 'NamedNode' && t.value.startsWith(WIKIDATA_PREFIX_DIRECT);

const isVariable = (t: RdfTerm) => t.termType === 'Variable';

const wikiDirectToValueProps = (t: RdfTerm) => [
  namedNode(WIKIDATA_PREFIX_VAL_SIMPLE + t.value.slice(WIKIDATA_PREFIX_DIRECT.length)),
  namedNode(WIKIDATA_PREFIX_VAL_QUALIFIER + t.value.slice(WIKIDATA_PREFIX_DIRECT.length))
]

export const newVar = (state: QueryState, prefix = 'tmp') => variable(`${prefix}${state.tempVarCounter++}`);


const WIKIDATA_PREFIX_DIRECT = 'http://www.wikidata.org/prop/direct/';
const WIKIDATA_PREFIX_PROP = 'http://www.wikidata.org/prop/';
const WIKIDATA_PREFIX_VAL_SIMPLE = 'http://www.wikidata.org/prop/statement/';
const WIKIDATA_PREFIX_VAL_QUALIFIER = 'http://www.wikidata.org/prop/qualifier/';

export const flexTermToSparql = (state: QueryState, term: FlexibleTerm) => {
  switch (term.type) {
    case 'statement':
    case 'variable': {
      if (!term.variable.value) {
        throw new Error('Variable value is required')
      }

      if (term.variable?.pos == "PREDICATE") {
        state.predicateVars.add(term.variable.value);
      }
      return {
        varName: variable(term.variable.value)
      }
    }
    case 'manual': {
      if (!term.manual) {
        throw new Error('Manual value is required')
      }
      const tokens = term.manual.split(',').map(t => t.trim())
        .map(t =>
          t.startsWith('?') ? variable(t)
            : t.startsWith("<") && t.endsWith(">") ? namedNode(t.slice(1, -1))
              : sparql`${t}` as any
        );

      const varName = variable(`tmp${state.tempVarCounter++}`);
      const bounds = [ valuesBound(varName, tokens) ];

      return { varName, bounds }
    }
    case 'search': {
      if (!term.search) {
        throw new Error('Search value is required')
      }
      let tokens = term.search.map(t => termToSparql(state, t));
      const varName = variable(`tmp${state.tempVarCounter++}`);
      const bounds = [ valuesBound(varName, tokens) ];

      return { varName, bounds }
    }
    case "any": {
      const varName = variable(`any${state.tempVarCounter++}`);

      return { varName, bounds: [] }
    }
    default:
      throw new Error(`Unknown term type ${term.type}`)
  }
}

const termToSparql = (state: QueryState, term: Term) => {
  if (term.type === 'literal') {
    return literal(term.value, term.lang ?? undefined);
  } else {
    return namedNode(term.value);
  }
}

const boundDatatypeSparql = (state: QueryState, term: FlexibleTerm, datatype: string) => {
  const { varName } = flexTermToSparql(state, term);

  if (datatype === 'null') {
    return sparql`FILTER(isBLANK(${varName})).`
  }
  if (datatype === 'non_null') {
    return sparql`FILTER(BOUND(${varName})).`
  }

  if ([ 'iri', 'url', 'literal', 'number' ].includes(datatype)) {
    let func: string;
    switch (datatype) {
      case 'iri':
        func = 'isIRI';
        break;
      case 'url':
        func = 'isURI';
        break;
      case 'literal':
        func = 'isLITERAL';
        break;
      case 'number':
        func = 'isNumeric';
        break;
      default:
        throw new Error(`Unknown datatype ${datatype}`)
    }

    return sparql`FILTER(BOUND(${varName}) && ${func}(${varName})).`
  }

  let datatypeIri = [];
  switch (datatype) {
    case 'property':
      const { rdf, wikibase } = WDT_NAMESPACES;
      if (state.wikidata) {
        const varAny = variable(`any${state.tempVarCounter++}`);
        return triple(varAny, wikibase.directClaim, varName)
      } else {
        return triple(varName, rdf.type, rdf.Property);
      }
    case 'string':
      datatypeIri = [ `<http://www.w3.org/2001/XMLSchema#string>` ];
      break;
    case 'integer':
      datatypeIri = [ `<http://www.w3.org/2001/XMLSchema#integer>` ];
      break;
    case 'boolean':
      datatypeIri = [ `<http://www.w3.org/2001/XMLSchema#boolean>` ];
      break;
    case 'datetime':
      datatypeIri = [
        `<http://www.w3.org/2001/XMLSchema#date>`,
        `<http://www.w3.org/2001/XMLSchema#dateTime>`
      ];
      break;
    case 'float':
      datatypeIri = [
        `<http://www.w3.org/2001/XMLSchema#float>`,
        `<http://www.w3.org/2001/XMLSchema#double>`,
        `<http://www.w3.org/2001/XMLSchema#decimal>`,
      ];
      break;
    default:
      throw new Error(`Unknown datatype ${datatype}`)
  }

  return sparql`FILTER(BOUND(${varName}) && DATATYPE(${varName}) IN (${datatypeIri.join(',')})).`
}

export const aggregateToSparql = (state: QueryState | null, v: Variable | SparqlValue, aggregate: string) => {
  switch (aggregate) {
    case 'COUNT':
      return sparql`COUNT(${v})`;
    case 'SUM':
      return sparql`SUM(${v})`;
    case 'AVG':
      return sparql`AVG(${v})`;
    case 'MIN':
      return sparql`MIN(${v})`;
    case 'MAX':
      return sparql`MAX(${v})`;
    case 'SAMPLE':
      return sparql`SAMPLE(${v})`;
  }
}

