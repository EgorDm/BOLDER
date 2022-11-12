import { Notebook } from "./notebooks";

export interface Report {
  id: string;
  notebook: Notebook;
  created_at: Date;
  updated_at: Date;

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
