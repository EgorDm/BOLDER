import { Notebook } from "./notebooks";

export interface Report {
  id: string;
  notebook: Notebook;
  created_at?: string;
  updated_at?: string;

  namespaces: null | {
    prefix: string;
    name: string;
  }[]
}

export interface GPTOutput {
  id: string;
  choices: {
    text: string;
    index: number;
  }[]
}
