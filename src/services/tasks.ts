import { MutableRefObject } from "react";
import { CellErrorOutput, CellOutput, CellTypeWidget, Notebook, Report, setCellOutputs, setCellState, WidgetCellType } from "../types";
import { fetchRunQuery } from "./wikidata";

export const taskRunCell = async (
    notebookRef: MutableRefObject<Notebook>,
    setNotebook: (notebook: Notebook) => void,
    cellId: string,
): Promise<void> => {
    try {
        const cell = notebookRef.current.content.cells[cellId];
        if (!cell) {
            throw new Error(`Cell ${cellId} not found`);
        }

        setNotebook(setCellState(notebookRef.current, cellId, {
            status: 'RUNNING',
        }));

        let error = false;
        let outputs = [];
        const timeout = cell.metadata.timeout;
        const cellType = cell.cell_type;

        console.log('taskRunCell', cellType, cellId);


        if (cellType === 'code') {
            const result = await runSparqlQuery(cell.source, timeout);
            error = result.error;
            outputs = result.outputs;
        } else if (cellType.startsWith('widget_')) {
            const cellW = cell as any as WidgetCellType;
            const snapshot = cellW.data;
            for (const source of cellW.source) {
                const result = await runSparqlQuery(source, timeout);
                for (const output of result.outputs) {
                    if (output.output_type === 'execute_result') {
                        output['snapshot'] = snapshot;
                    }
                    outputs.push(output);
                }
                if (result.error) {
                    error = true;
                    break;
                }
            }
        }

        setNotebook(setCellOutputs(notebookRef.current, cellId, outputs));

        setNotebook(setCellState(notebookRef.current, cellId, {
            status: 'FINISHED'
        }));
    } catch (e) {
        // TODO: handle error
        setNotebook(setCellState(notebookRef.current, cellId, {
            status: 'ERROR'
        }));
    }
}


const runSparqlQuery = async (query: string, timeout: number = 5000, limit = 100): Promise<any> => {
    var startTime = performance.now();

    let error = false;
    const outputs = [];
    try {
        const result = await fetchRunQuery(query, timeout);
        outputs.push({
            'output_type': 'execute_result',
            'execute_count': 1,
            'data': result,
            'execution_time': performance.now() - startTime
        })
    } catch (e) {
        error = true;
        outputs.push(resultError(e, performance.now() - startTime));
        console.error('runSparqlQuery', e);
    }

    return {
        outputs,
        error,
    };
}

const resultError = (error: Error, duration: number): CellErrorOutput => ({
    'output_type': 'error',
    'ename': (typeof error).toString(),
    'evalue': error.message,
    'traceback': [],
    'execution_time': duration
})