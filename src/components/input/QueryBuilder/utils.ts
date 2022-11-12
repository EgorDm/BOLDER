import { RuleGroupType } from "react-querybuilder";

export const collectStatements = (group: RuleGroupType | any, vars: Set<string>) => {
  if (group?.value?.input?.variable?.value) {
    if (group.value.input.type === 'statement') {
      vars.add(group.value.input.variable.value);
    }
  }

  if (group.rules) {
    for (const rule of group.rules) {
      collectStatements(rule, vars);
    }
  }
}

const collectVars = (group: RuleGroupType | any, vars: Set<string>) => {
  if (group.variable?.value) {
    vars.add(group.variable.value);
  }

  if (group?.value) {
    const gv = group.value;

    if (gv.input?.variable?.value) {
      vars.add(gv.input.variable.value);
      if (gv.input.type === 'statement') {
        vars.add(gv.input.variable.value + 'Value');
      }
    }

    if (gv.predicate?.variable?.value) {
      vars.add(gv.predicate.variable.value);
    }

    if (group?.operator === 'function' && gv.output) {
      vars.add(gv.output.value);
    }

    if (group?.operator === 'function' && gv.input) {
      vars.add(gv.input.value);
    }
  }

  if (group.rules) {
    for (const rule of group.rules) {
      collectVars(rule, vars);
    }
  }
}

export const collectVarsFromGroup = (group: RuleGroupType | any): string[] => {
  const vars = new Set<string>();
  vars.add('main');
  if (group?.combinator) {
    collectVars(group, vars);
  }
  return Array.from(vars);
}
